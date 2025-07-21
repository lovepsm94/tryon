import { TryonLoading } from '@/components/ui';
import Drawer from '@/components/ui/Drawer';
import Modal from '@/components/ui/Modal';
import { useProduct } from '@/contexts/ProductContext';
import { useResponsive } from '@/contexts/ResponsiveContext';
import PreparePhoto from '@/pages/product/Mobile/ProductActions/PreparePhoto';
import { indexedDBManager } from '@/utils/indexedDBManager';
import { localStorageManager } from '@/utils/localStorageManager';
import { tryonApiService, TryonRequest } from '@/utils/tryonApi';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import WeightHeightInput from './WeightHeightInput';
import ModalSelectModel from '@/pages/product/Mobile/ProductActions/PreparePhoto/ModalSelectModel';

type VirtualTryonStep = 'weight-height' | 'prepare-photo';

async function checkWebcamAvailability(): Promise<{ available: boolean; state: string }> {
	try {
		// Check if getUserMedia is supported
		if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
			return { available: false, state: 'unsupported' };
		}

		// Enumerate devices to check for video input devices
		const devices = await navigator.mediaDevices.enumerateDevices();
		console.log(devices);
		const videoDevices = devices.filter((device) => device.kind === 'videoinput');
		console.log(videoDevices, 'videoDevices');

		if (videoDevices.length === 0) {
			return { available: false, state: 'no-devices' };
		}

		// Check camera permission status using permissions API
		let permissionState = 'prompt'; // default state
		try {
			const permissionResult = await navigator.permissions.query({ name: 'camera' as PermissionName });
			permissionState = permissionResult.state; // 'granted', 'denied', or 'prompt'
			console.log('Camera permission state:', permissionState);
		} catch (permissionError) {
			console.warn('Permissions API not supported, falling back to device labels');
			// Fallback: check if we have permission by looking at device labels
			const hasPermission = videoDevices.some((device) => device.label && device.label.length > 0);
			permissionState = hasPermission ? 'granted' : 'denied';
		}

		return {
			available: true,
			state: permissionState // Only permission states: 'granted', 'denied', 'prompt'
		};
	} catch (error) {
		console.warn('Could not enumerate devices:', error);
		return { available: false, state: 'error' };
	}
}

function VirtualTryon() {
	const { t } = useTranslation();
	const {
		selectedProducts,
		setTryonResult,
		getCachedTryonResult,
		setCachedTryonResult,
		isTryonLoading,
		setTryonLoading,
		setSelectedSize,
		setTryonImage,
		currentProduct,
		handlePhotoTaken
	} = useProduct();
	const [isOpen, setIsOpen] = useState(false);
	const [currentStep, setCurrentStep] = useState<VirtualTryonStep | null>(null);
	const [isOpenModalSelectModel, setIsOpenModalSelectModel] = useState(false);

	const { isMobile } = useResponsive();

	const handleContinue = async () => {
		if (currentStep === 'weight-height') {
			setTimeout(() => {
				setCurrentStep('prepare-photo');
			}, 200);
		} else if (currentStep === 'prepare-photo') {
			setCurrentStep(null);
			// Call onPhotoTaken when photo is taken successfully
			if (handlePhotoTaken) {
				handlePhotoTaken();
			}
			setTimeout(async () => {
				startTryonProcess();
			}, 200);
		}
	};

	const handleCancel = () => {
		setIsOpen(false);
		setCurrentStep(null); // Reset to first step when canceling
	};

	const openDrawer = async () => {
		try {
			// Check if user images already exist
			const frontImage = await indexedDBManager.getLatestUserImageBlob('front');
			const sideImage = await indexedDBManager.getLatestUserImageBlob('side');

			if (!isMobile && !frontImage && !sideImage) {
				const webcamStatus = await checkWebcamAvailability();
				if (!webcamStatus.available) {
					setIsOpenModalSelectModel(true);
					return;
				}
			}

			// If both front and side images exist, start tryon process directly
			if (frontImage && sideImage) {
				console.log('User images found, starting tryon process directly');
				await startTryonProcess();
			} else {
				// If images don't exist, open the weight-height step
				console.log('User images not found, opening weight-height step');
				setIsOpen(true);
				setCurrentStep('weight-height');
			}
		} catch (error) {
			console.error('Error checking user images:', error);
			// If there's an error, fallback to weight-height step
			setIsOpen(true);
			setCurrentStep('weight-height');
		}
	};

	const startTryonProcess = async () => {
		if (!selectedProducts.upper && !selectedProducts.lower) {
			console.error('No products selected for tryon');
			setTryonLoading(false);
			return;
		}

		// Check cache first
		const upperId = selectedProducts.upper?.id;
		const lowerId = selectedProducts.lower?.id;

		// Get selected front image ID for cache key
		let selectedFrontImageId: number | null = null;
		try {
			const userData = localStorageManager.getUserData();
			selectedFrontImageId = userData?.selectedFrontImageId || null;
		} catch (error) {
			console.warn('Could not retrieve selected front image ID from localStorage:', error);
		}

		const cachedResult = getCachedTryonResult({ upperId, lowerId, selectedFrontImageId });

		if (cachedResult) {
			console.log('Using cached tryon result');
			window.scrollTo({ top: 0, behavior: 'smooth' });
			setTryonResult(cachedResult);
			setTryonLoading(false);
			return;
		}

		console.log('No cached result found, calling API');

		try {
			// Get selected front image for loading effect
			let frontImageData;
			try {
				const userData = localStorageManager.getUserData();
				if (userData && userData.selectedFrontImageId) {
					// Try to get the selected image
					const selectedImage = await indexedDBManager.getUserImage(userData.selectedFrontImageId);
					if (selectedImage && selectedImage.type === 'front') {
						// Convert the image URL back to blob
						const response = await fetch(selectedImage.imageUrl);
						const blob = await response.blob();
						frontImageData = {
							id: selectedImage.id,
							imageBlob: blob,
							timestamp: selectedImage.timestamp,
							type: selectedImage.type
						};
					}
				}
			} catch (error) {
				console.warn('Could not get selected front image, falling back to latest:', error);
			}

			// If no selected image found, fall back to latest
			if (!frontImageData) {
				frontImageData = await indexedDBManager.getLatestUserImageBlob('front');
			}

			if (frontImageData) {
				// const frontImageUrl = URL.createObjectURL(frontImageData.imageBlob);
				// setTryonResult(frontImageUrl);
				setTimeout(() => {
					window.scrollTo({ top: 0, behavior: 'smooth' });
				}, 100);
			}

			// Get user images from IndexedDB
			const { frontImage, sideImage } = await tryonApiService.prepareUserImages();

			// Get user weight and height data from localStorage
			let weight: number | undefined;
			let height: number | undefined;
			try {
				const userData = localStorageManager.getUserData();
				if (userData) {
					weight = userData.weight;
					height = userData.height;
					console.log('User data found:', { weight, height });
				}
			} catch (error) {
				console.warn('Could not retrieve user weight/height data:', error);
			}

			setTryonLoading(true);
			setTryonImage(frontImageData?.imageBlob ? URL.createObjectURL(frontImageData.imageBlob) : null);

			// Prepare the tryon request with only required fields
			const request: Partial<TryonRequest> = {
				front_image: frontImage
			};

			// Add side image if available
			request.side_image = sideImage;

			// Add weight and height if available
			if (weight) {
				request.weight = weight;
			}
			if (height) {
				request.height = height;
			}

			// Add upper garment if selected
			if (selectedProducts.upper) {
				const upperImage = await tryonApiService.fetchProductImage(
					selectedProducts.upper.product,
					`upper_${selectedProducts.upper.id}.jpg`
				);
				const upperSizeChart = await tryonApiService.fetchProductSizeChart(
					selectedProducts.upper.sizes,
					'upper_size_chart.csv'
				);

				console.log(upperSizeChart);
				request.upper_garment = upperImage;
				request.upper_size_chart = upperSizeChart;
				request.sleeve_type = selectedProducts.upper.sleeve_type;
			}

			// Add lower garment if selected
			if (selectedProducts.lower) {
				const lowerImage = await tryonApiService.fetchProductImage(
					selectedProducts.lower.product,
					`lower_${selectedProducts.lower.id}.jpg`
				);
				const lowerSizeChart = await tryonApiService.fetchProductSizeChart(
					selectedProducts.lower.sizes,
					'lower_size_chart.csv'
				);
				console.log(lowerSizeChart);
				request.lower_garment = lowerImage;
				request.lower_size_chart = lowerSizeChart;
				request.inseam_type = selectedProducts.lower.inseam_type;
			}

			// Ensure we have at least one garment
			if (!request.upper_garment && !request.lower_garment) {
				throw new Error('No garments selected for tryon');
			}

			// Validate request before sending
			if (!request.front_image) {
				throw new Error('Front image is required');
			}

			// Submit the tryon request
			const taskId = await tryonApiService.submitTryonRequest(request as TryonRequest);

			// Poll for completion
			const result = await tryonApiService.pollTryonCompletion(taskId);

			// Convert base64 to blob URL for display
			const blob = tryonApiService.base64ToBlob(result.tryonImage);
			const imageUrl = URL.createObjectURL(blob);
			const sizeImage = tryonApiService.base64ToBlob(result.sizeImage);
			const sizeImageUrl = URL.createObjectURL(sizeImage);

			// Store in cache
			setCachedTryonResult({
				result: { ...result, tryonImage: imageUrl, sizeImage: sizeImageUrl },
				upperId,
				lowerId,
				selectedFrontImageId
			});
			setTryonResult({
				...result,
				tryonImage: imageUrl,
				sizeImage: sizeImageUrl,
				imageSize: result.imageSize
			});
			const bestFitSize = (() => {
				if (!result || !currentProduct) return null;
				const upperFitData = result.upperFitData;
				const lowerFitData = result.lowerFitData;
				const upperBestFitSize = upperFitData?.size;
				const lowerBestFitSize = lowerFitData?.size;
				if (currentProduct?.type === 'upper') {
					return upperBestFitSize;
				} else {
					return lowerBestFitSize;
				}
			})();
			setSelectedSize(bestFitSize || null);

			console.log('Tryon completed successfully:', imageUrl);
			console.log('Selected products:', {
				upper: selectedProducts.upper?.name,
				lower: selectedProducts.lower?.name
			});
		} catch (error) {
			console.error('Error during tryon process:', error);
			// Clear the loading image on error
			setTryonResult(null);
		} finally {
			setTryonLoading(false);
		}
	};

	return (
		<>
			<button
				className='w-full h-[52px] bg-gradient text-white border-0 outline-0 mt-6'
				onClick={openDrawer}
				disabled={isTryonLoading}
			>
				<span className='flex items-center justify-center gap-2'>
					<TryonLoading isLoading={isTryonLoading} />
					{isTryonLoading ? (
						<span className='flex items-center justify-center gap-2'>{t('common.pleaseWait')}</span>
					) : (
						<span className='flex items-center justify-center gap-2'>
							{t('common.virtualTryOn')}
							{!isMobile && (
								<span className='text-[12px] leading-[20px] text-white'>
									{t('common.personalStylistWithAI')}
								</span>
							)}
						</span>
					)}
				</span>
			</button>

			{currentStep === 'weight-height' && (
				<>
					{isMobile ? (
						<Drawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
							<WeightHeightInput onCancel={handleCancel} onContinue={handleContinue} />
						</Drawer>
					) : (
						<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} contentClassName='max-w-[540px]'>
							<WeightHeightInput onCancel={handleCancel} onContinue={handleContinue} />
						</Modal>
					)}
				</>
			)}

			{currentStep === 'prepare-photo' && <PreparePhoto onCancel={handleCancel} onContinue={handleContinue} />}
			<ModalSelectModel
				isOpen={isOpenModalSelectModel}
				onClose={() => setIsOpenModalSelectModel(false)}
				onSelectModel={startTryonProcess}
			/>
		</>
	);
}

export default VirtualTryon;
