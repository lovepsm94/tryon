import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useWebcam } from '@/hooks';
import { ReactComponent as FrontPose } from '@/assets/front-pose.svg';
import { frontPose } from '@/pages/product/Mobile/ProductActions/PreparePhoto/templates';
import CountdownAnimation from '../CountdownAnimation';
import { indexedDBManager } from '@/utils/indexedDBManager';

import { usePoseDetection } from '@/hooks/usePoseDetection';

interface FrontViewStepProps {
	onContinue: () => void;
}

const FrontViewStep: React.FC<FrontViewStepProps> = ({ onContinue }) => {
	const { t } = useTranslation();
	const { videoRef, startCamera, stopCamera } = useWebcam();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const { poseResult, startDetection, stopDetection } = usePoseDetection(videoRef, canvasRef, frontPose, {
		maxOffsetX: 50,
		maxOffsetY: 50
	});
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [poseStableTime, setPoseStableTime] = useState(0);
	const [isPoseValid, setIsPoseValid] = useState(false);
	const [isCountingDown, setIsCountingDown] = useState(false);
	const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
	const [capturedImageBlob, setCapturedImageBlob] = useState<Blob | null>(null);
	const [isPhotoTaken, setIsPhotoTaken] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// Capture photo from video stream
	const capturePhoto = async () => {
		if (!videoRef.current) return;

		try {
			// Create canvas to capture the video frame
			const canvas = document.createElement('canvas');
			const video = videoRef.current;
			const context = canvas.getContext('2d');

			if (!context) return;

			// Set canvas size to match video
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;

			// Flip the context horizontally to correct the mirror effect
			context.scale(-1, 1);
			context.translate(-canvas.width, 0);

			// Draw the current video frame to canvas
			context.drawImage(video, 0, 0, canvas.width, canvas.height);

			// Convert canvas to blob
			canvas.toBlob(
				(blob) => {
					if (blob) {
						// Create image URL for display
						const imageUrl = URL.createObjectURL(blob);
						setCapturedImageUrl(imageUrl);
						setCapturedImageBlob(blob);
						setIsPhotoTaken(true);
						stopCamera();
						stopDetection();
					}
				},
				'image/jpeg',
				1
			);
		} catch (error) {
			console.error('Error capturing photo:', error);
		}
	};

	// Retake photo function
	const retakePhoto = () => {
		setCapturedImageUrl(null);
		setCapturedImageBlob(null);
		setIsPhotoTaken(false);
		setPoseStableTime(0);
		setIsPoseValid(false);
		setIsSaving(false);
		startCamera();
		startDetection();
	};

	// Accept photo function
	const acceptPhoto = async () => {
		if (!capturedImageBlob || !capturedImageUrl) return;

		try {
			setIsSaving(true);

			// Save new image to IndexedDB
			const imageId = await indexedDBManager.saveUserImage(capturedImageBlob, 'front');

			console.log('Front view image saved to IndexedDB with ID:', imageId);

			// Notify parent component with the image URL
			onContinue();
		} catch (error) {
			console.error('Error saving image to IndexedDB:', error);
		} finally {
			setIsSaving(false);
		}
	};

	useEffect(() => {
		if (!isPhotoTaken) {
			startCamera();
		}
		return () => {
			stopCamera();
		};
	}, [isPhotoTaken]);

	// Start pose detection when camera is ready
	useEffect(() => {
		if (videoRef.current) {
			console.log('startDetection');
			startDetection();
		}
	}, [startDetection, isPhotoTaken]);

	// Handle pose detection results
	useEffect(() => {
		if (poseResult && !isPhotoTaken) {
			const isValid = poseResult.isValidPose;
			setIsPoseValid(isValid);
		}
	}, [poseResult, isPhotoTaken]);

	// Track how long the pose has been stable and start countdown
	useEffect(() => {
		let interval: NodeJS.Timeout;

		if (isPoseValid && !isPhotoTaken) {
			interval = setInterval(() => {
				setPoseStableTime((prev) => {
					const newTime = prev + 0.1;
					if (newTime >= 2.0) {
						// Pose has been stable for 2 seconds, start countdown
						if (!isCountingDown) {
							setIsCountingDown(true);
						}
						return 2.0;
					}
					return newTime;
				});
			}, 100);
		} else {
			setPoseStableTime(0);
			setIsCountingDown(false);
		}

		return () => {
			if (interval) {
				clearInterval(interval);
			}
		};
	}, [isPoseValid, isCountingDown, isPhotoTaken]);

	// Cleanup pose detection on unmount
	useEffect(() => {
		return () => {
			stopDetection();
		};
	}, [stopDetection]);

	return (
		<>
			<div className='w-full max-w-md grow rounded-2xl mx-auto mb-4 flex items-center justify-center overflow-hidden relative md:h-[calc(100vh-350px)]'>
				{!isPhotoTaken ? (
					<>
						<div className='absolute inset-0 flex items-center justify-center z-30' ref={containerRef}>
							<FrontPose className='w-full object-cover h-[calc(100%-80px)]' />
						</div>
						<video ref={videoRef} className='w-full h-full object-cover' playsInline muted />

						<canvas
							ref={canvasRef}
							className='absolute inset-0 w-full h-full pointer-events-none z-40'
							style={{
								objectFit: 'cover',
								width: '100%',
								height: '100%',
								transform: 'scaleX(-1)'
							}}
						/>

						{/* Countdown overlay */}
						{isCountingDown && (
							<div className='absolute inset-0 flex items-center justify-center z-50 bg-black/50'>
								<CountdownAnimation
									initialCount={3}
									onComplete={() => {
										setIsCountingDown(false);
										capturePhoto();
									}}
									showRestartButton={false}
									className='w-32 h-32'
								/>
							</div>
						)}
					</>
				) : (
					<>
						{/* Display captured image */}
						{capturedImageUrl && (
							<img src={capturedImageUrl} alt='Captured photo' className='w-full h-full object-cover' />
						)}
					</>
				)}
			</div>
			<div className='h-[92px] flex flex-col'>
				{!isPhotoTaken ? (
					<>
						<div className='rounded-lg border-gradient text-center'>
							<p className='text-[#1B1D21] text-[16px] leading-[24px] p-4 text-center bg-[rgba(44,68,239,0.1)]'>
								{t('getUserModelImage.steps.frontView.instruction')}
							</p>
						</div>
						<div className='grow'></div>
					</>
				) : (
					<>
						<p className='text-[#1B1D21] text-[16px] leading-[24px] text-center'>
							{t('common.doYouWantToUseThisPhoto')}
						</p>
						<div className='mt-4 grid grid-cols-2 gap-3'>
							<button
								className='bg-white h-[44px] text-[#1B1D21] text-[16px] leading-[24px] border border-[#1B1D21]'
								onClick={retakePhoto}
								disabled={isSaving}
							>
								{t('common.retake')}
							</button>
							<button
								className='bg-gradient h-[44px] text-white text-[16px] leading-[24px]'
								onClick={acceptPhoto}
								disabled={isSaving}
							>
								{t('common.accept')}
							</button>
						</div>
					</>
				)}
			</div>
		</>
	);
};

export default FrontViewStep;
