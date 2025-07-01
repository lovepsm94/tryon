import axios from 'axios';
import { indexedDBManager } from './indexedDBManager';
import { localStorageManager } from './localStorageManager';

const API_BASE_URL = 'https://api.tryonic.ai';

export interface TryonRequest {
	upper_garment?: File;
	front_image: File;
	side_image?: File;
	lower_garment?: File;
	weight?: number; // in kg
	height?: number; // in cm
}

// Helper type for validation
export interface ValidTryonRequest {
	upper_garment?: File;
	front_image: File;
	side_image?: File;
	lower_garment?: File;
	weight?: number; // in kg
	height?: number; // in cm
}

export interface TryonResponse {
	task_id: string;
}

export interface TryonStatusResponse {
	status: 'PENDING' | 'SUCCESS' | 'FAILURE';
	result?: {
		tryon_image: string; // base64 image
	};
	error?: string;
}

class TryonApiService {
	/**
	 * Submit a tryon request
	 */
	async submitTryonRequest(request: TryonRequest): Promise<string> {
		console.log(request, 'request');
		try {
			const formData = new FormData();

			// Add required fields
			formData.append('front_image', request.front_image);

			// Add optional fields only if they exist
			if (request.upper_garment) {
				formData.append('upper_garment', request.upper_garment);
			}
			if (request.side_image) {
				formData.append('side_image', request.side_image);
			}
			if (request.lower_garment) {
				formData.append('lower_garment', request.lower_garment);
			}
			if (request.weight) {
				formData.append('weight', request.weight.toString());
			}
			if (request.height) {
				formData.append('height', request.height.toString());
			}

			const response = await axios.post<TryonResponse>(`${API_BASE_URL}/tryon`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			});

			return response.data.task_id;
		} catch (error) {
			alert(JSON.stringify([error]));
			console.error('Error submitting tryon request:', error);
			throw new Error('Failed to submit tryon request');
		}
	}

	/**
	 * Check the status of a tryon task
	 */
	async checkTryonStatus(taskId: string): Promise<TryonStatusResponse> {
		try {
			const response = await axios.get<TryonStatusResponse>(`${API_BASE_URL}/status/${taskId}`);
			return response.data;
		} catch (error) {
			alert(JSON.stringify([error]));
			console.error('Error submitting tryon request:', error);
			throw new Error('Failed to check tryon status');
		}
	}

	/**
	 * Poll for tryon completion
	 */
	async pollTryonCompletion(taskId: string, maxAttempts = 30, intervalMs = 2000): Promise<string> {
		let attempts = 0;

		while (attempts < maxAttempts) {
			try {
				const status = await this.checkTryonStatus(taskId);

				console.log(
					`Poll attempt ${attempts + 1}: status=${status.status}, hasImage=${!!status.result?.tryon_image}`
				);

				// Check for FAILURE status first
				if (status.status === 'FAILURE') {
					throw new Error(JSON.stringify([status]) || 'Tryon processing failed');
				}

				// Check for SUCCESS status - return immediately if image is ready
				if (status.status === 'SUCCESS') {
					console.log(`Tryon completed successfully on attempt ${attempts + 1}`);
					return status.result?.tryon_image || '';
				}

				// Wait for PENDING status
				if (status.status === 'PENDING') {
					await new Promise((resolve) => setTimeout(resolve, intervalMs));
				}

				attempts++;
			} catch (error) {
				alert((error as any).toString());
				console.error(`Error polling tryon status (attempt ${attempts + 1}):`, error);
				throw error;
			}
		}

		throw new Error('Tryon request timed out');
	}

	/**
	 * Get user images from IndexedDB and prepare for API request
	 */
	async prepareUserImages(): Promise<{ frontImage: File; sideImage?: File }> {
		try {
			// Get selected front image ID from localStorage
			let selectedFrontImageId: number | null = null;
			try {
				const userData = localStorageManager.getUserData();
				if (userData && userData.selectedFrontImageId) {
					selectedFrontImageId = userData.selectedFrontImageId;
				}
			} catch (error) {
				console.warn('Could not retrieve selected front image ID from localStorage:', error);
			}

			// Get front view image - use selected image if available, otherwise use latest
			let frontImageData;
			if (selectedFrontImageId) {
				// Try to get the selected image
				const selectedImage = await indexedDBManager.getUserImage(selectedFrontImageId);
				if (selectedImage && selectedImage.type === 'front') {
					// Convert the image URL back to blob for the API
					const response = await fetch(selectedImage.imageUrl);
					const blob = await response.blob();
					frontImageData = {
						id: selectedImage.id,
						imageBlob: blob,
						timestamp: selectedImage.timestamp,
						type: selectedImage.type
					};
				} else {
					console.warn('Selected front image not found or is not a front image, falling back to latest');
					frontImageData = await indexedDBManager.getLatestUserImageBlob('front');
				}
			} else {
				// No selection made, use latest image
				frontImageData = await indexedDBManager.getLatestUserImageBlob('front');
			}

			if (!frontImageData) {
				throw new Error('Front view image not found');
			}

			const frontImage = new File([frontImageData.imageBlob], 'front_view.jpg', {
				type: 'image/jpeg'
			});

			return { frontImage, sideImage: undefined };
		} catch (error) {
			console.error('Error preparing user images:', error);
			throw error;
		}
	}

	/**
	 * Convert base64 image to blob
	 */
	base64ToBlob(base64: string, mimeType = 'image/jpeg'): Blob {
		const byteCharacters = atob(base64);
		const byteNumbers = new Array(byteCharacters.length);

		for (let i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}

		const byteArray = new Uint8Array(byteNumbers);
		return new Blob([byteArray], { type: mimeType });
	}

	/**
	 * Fetch product image from URL and convert to File
	 */
	async fetchProductImage(imagePath: string, fileName: string): Promise<File> {
		try {
			const response = await fetch(imagePath);
			if (!response.ok) {
				throw new Error(`Failed to fetch image: ${response.statusText}`);
			}

			const blob = await response.blob();
			return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
		} catch (error) {
			alert('Failed to fetch product image');
			console.error('Error fetching product image:', error);
			throw error;
		}
	}

	/**
	 * Get sleeve type based on product description
	 */
	getSleeveType(productName: string): 'less' | 'short' | 'long' {
		const name = productName.toLowerCase();
		if (name.includes('sleeveless') || name.includes('tank') || name.includes('vest')) {
			return 'less';
		}
		if (name.includes('short sleeve') || name.includes('tee') || name.includes('shirt')) {
			return 'short';
		}
		if (name.includes('long sleeve') || name.includes('sweater') || name.includes('turtleneck')) {
			return 'long';
		}
		// Default to short sleeve for upper garments
		return 'short';
	}

	/**
	 * Get inseam type based on product description
	 */
	getInseamType(productName: string): 'less' | 'short' | 'long' {
		const name = productName.toLowerCase();
		if (name.includes('short') || name.includes('mini')) {
			return 'short';
		}
		if (name.includes('long') || name.includes('pants') || name.includes('jeans')) {
			return 'long';
		}
		// Default to short for lower garments
		return 'short';
	}
}

export const tryonApiService = new TryonApiService();
