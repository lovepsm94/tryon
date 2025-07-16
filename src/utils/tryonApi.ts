import axios from 'axios';
import { indexedDBManager } from './indexedDBManager';
import { localStorageManager } from './localStorageManager';

const API_BASE_URL = 'https://api.tryonic.ai';

export interface TryonRequest {
	upper_garment?: File;
	front_image: File;
	side_image?: File;
	lower_garment?: File;
	upper_size_chart?: File;
	lower_size_chart?: File;
	sleeve_type?: 'less' | 'short' | 'long';
	inseam_type?: 'short' | 'long';
	weight?: number; // in kg
	height?: number; // in cm
}

export interface TryonResponse {
	task_id: string;
}

export interface UpperFitData {
	size: string;
	measure: {
		columns: string[];
		index: number[];
		data: string[][];
	};
	data_points: {
		Shoulder?: number[][];
		Sleeve?: number[][];
		Width?: number[][];
	};
}

export interface LowerFitData {
	size: string;
	measure: {
		columns: string[];
		index: number[];
		data: string[][];
	};
	data_points: {
		Waist?: number[][];
		Hip?: number[][];
		Inseam?: number[][];
	};
}

export interface TryonStatusResponse {
	status: 'PENDING' | 'SUCCESS' | 'FAILURE';
	task_id?: string;
	result?: {
		tryon_image: string; // base64 image
		size_image: string; // base64 image
		image_size: [number, number]; // [width, height]
		upper_fit_data?: UpperFitData;
		lower_fit_data?: LowerFitData;
		state?: string;
		message?: string;
	};
	error?: string;
}

export interface MaskPointsResponse {
	status: string;
	task_id: string;
	masks: {
		upper: number[][];
		lower: number[][];
		full: number[][];
	};
	elapsed_time: number;
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
			formData.append('human_image', request.front_image);

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
			if (request.upper_size_chart) {
				formData.append('upper_size_chart', request.upper_size_chart);
			}
			if (request.lower_size_chart) {
				formData.append('lower_size_chart', request.lower_size_chart);
			}
			if (request.weight) {
				formData.append('weight', request.weight.toString());
			}
			if (request.height) {
				formData.append('height', request.height.toString());
			}
			if (request.sleeve_type) {
				formData.append('sleeve_type', request.sleeve_type);
			}
			if (request.inseam_type) {
				formData.append('inseam_type', request.inseam_type);
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
	async pollTryonCompletion(
		taskId: string,
		maxAttempts = 30,
		intervalMs = 2000
	): Promise<{
		tryonImage: string;
		sizeImage: string;
		imageSize: [number, number];
		upperFitData?: UpperFitData;
		lowerFitData?: LowerFitData;
	}> {
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

				// Check for SUCCESS status - return immediately if images are ready
				if (status.status === 'SUCCESS' && status.result) {
					if (status.result.state === 'error') {
						throw status.result.message;
					}
					console.log(`Tryon completed successfully on attempt ${attempts + 1}`);
					return {
						...status.result,
						tryonImage: status.result.tryon_image || '',
						sizeImage: status.result.size_image || '',
						imageSize: status.result.image_size || [0, 0],
						upperFitData: 'upper_fit_data' in status.result ? status.result.upper_fit_data : undefined,
						lowerFitData: 'lower_fit_data' in status.result ? status.result.lower_fit_data : undefined
					};
				}

				// Wait for PENDING status
				if (status.status === 'PENDING') {
					await new Promise((resolve) => setTimeout(resolve, intervalMs));
				}

				attempts++;
			} catch (error) {
				alert(error);
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
			const sideImageData = await indexedDBManager.getLatestUserImageBlob('side');

			if (!sideImageData) {
				throw new Error('Side view image not found');
			}

			if (!frontImageData) {
				throw new Error('Front view image not found');
			}

			const sideImage = new File([sideImageData.imageBlob], 'side_view.jpg', {
				type: 'image/jpeg'
			});

			const frontImage = new File([frontImageData.imageBlob], 'front_view.jpg', {
				type: 'image/jpeg'
			});

			return { frontImage, sideImage };
		} catch (error) {
			console.error('Error preparing user images:', error);
			throw error;
		}
	}

	/**
	 * Get mask points for a human image
	 */
	async getMaskPoints(humanImage: File, timeout = 30, pollInterval = 0.5): Promise<MaskPointsResponse> {
		try {
			const formData = new FormData();
			formData.append('human_image', humanImage);
			formData.append('timeout', timeout.toString());
			formData.append('poll_interval', pollInterval.toString());

			const response = await axios.post<MaskPointsResponse>(`${API_BASE_URL}/get_garment_mask`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			});

			if (response.data.status !== 'SUCCESS') {
				throw new Error('Failed to get mask points');
			}

			return response.data;
		} catch (error) {
			console.error('Error getting mask points:', error);
			throw new Error('Failed to get mask points');
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

	async fetchProductSizeChart(sizeChartPath: string, fileName: string): Promise<File> {
		try {
			const response = await fetch(sizeChartPath);
			if (!response.ok) {
				throw new Error(`Failed to fetch size chart: ${response.statusText}`);
			}

			const blob = await response.blob();
			const file = new File([blob], fileName, { type: 'text/csv' });

			return file;
		} catch (error) {
			alert('Failed to fetch product size chart');
			console.error('Error fetching product size chart:', error);
			throw error;
		}
	}

	async verifyAccessCode(accessCode: number): Promise<boolean> {
		try {
			const formData = new FormData();
			formData.append('access_code', accessCode.toString());

			const response = await axios.post(`${API_BASE_URL}/verify_code`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			});
			return response.data.status;
		} catch (error) {
			console.error('Error verifying access code:', error);
			throw new Error('Failed to verify access code');
		}
	}
}

export const tryonApiService = new TryonApiService();
