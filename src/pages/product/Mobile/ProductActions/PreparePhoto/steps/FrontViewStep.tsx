import { ReactComponent as FrontPoseIcon1 } from '@/assets/front-icon-1.svg';
import { ReactComponent as FrontPoseIcon2 } from '@/assets/front-icon-2.svg';
import { ReactComponent as FrontPoseIcon3 } from '@/assets/front-icon-3.svg';
import { ReactComponent as FrontPose1 } from '@/assets/front-pose-1.svg';
import { ReactComponent as FrontPose2 } from '@/assets/front-pose-2.svg';
import { ReactComponent as FrontPose3 } from '@/assets/front-pose-3.svg';
import { ReactComponent as FrontPoseIconGradient1 } from '@/assets/front-pose-icon-gradient-1.svg';
import { ReactComponent as FrontPoseIconGradient2 } from '@/assets/front-pose-icon-gradient-2.svg';
import { ReactComponent as FrontPoseIconGradient3 } from '@/assets/front-pose-icon-gradient-3.svg';
import { useWebcam } from '@/hooks';
import { indexedDBManager } from '@/utils/indexedDBManager';
import { tryonApiService } from '@/utils/tryonApi';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CountdownAnimation from '../CountdownAnimation';

import { ReactComponent as Spinner } from '@/assets/spinner.svg';
import { usePoseValidation } from '@/hooks';
import cn from '@/utils/cn';
import { FRONT_POSE_VALIDATION_ZONES } from '@/utils/poseImageProcessor';

interface FrontViewStepProps {
	onContinue: () => void;
	showPoseSelection?: boolean;
}

const FrontViewStep: React.FC<FrontViewStepProps> = ({ onContinue, showPoseSelection = false }) => {
	const { t } = useTranslation();
	const { videoRef, startCamera, stopCamera } = useWebcam();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [pose, setPose] = useState<number>(1);
	const { isValidPose, startDetection, stopDetection } = usePoseValidation(
		videoRef,
		canvasRef,
		FRONT_POSE_VALIDATION_ZONES
	);

	const imagePath = useMemo(() => `/poses/front_${pose}.png`, [pose]);

	const [isCountingDown, setIsCountingDown] = useState(false);
	const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
	const [capturedImageBlob, setCapturedImageBlob] = useState<Blob | null>(null);
	const [isPhotoTaken, setIsPhotoTaken] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const poseStableTimeRef = useRef(0);

	// Capture photo from video stream
	const capturePhoto = async () => {
		if (!videoRef.current) return;

		try {
			// Create canvas to capture the video frame
			const canvas = document.createElement('canvas');
			const video = videoRef.current;
			const context = canvas.getContext('2d', { alpha: false });

			if (!context) return;

			// Set canvas size to match video
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;

			// Enable high quality rendering
			context.imageSmoothingEnabled = true;
			context.imageSmoothingQuality = 'high';

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
						stopCamera();
						stopDetection();
					}
				},
				'image/jpeg',
				1
			);
			setIsPhotoTaken(true);
		} catch (error) {
			console.error('Error capturing photo:', error);
		}
	};

	// Retake photo function
	const retakePhoto = () => {
		setCapturedImageUrl(null);
		setCapturedImageBlob(null);
		setIsPhotoTaken(false);
		poseStableTimeRef.current = 0;
		setIsSaving(false);
		startCamera();
		startDetection(imagePath);
	};

	// Accept photo function
	const acceptPhoto = async () => {
		if (!capturedImageBlob || !capturedImageUrl) return;

		try {
			setIsSaving(true);

			// Save new image to IndexedDB
			const imageId = await indexedDBManager.saveUserImage(capturedImageBlob, 'front');

			console.log('Front view image saved to IndexedDB with ID:', imageId);

			// Convert blob to File for API call
			const humanImageFile = new File([capturedImageBlob], 'front_view.jpg', {
				type: 'image/jpeg'
			});

			// Get mask points from API
			try {
				const maskPointsResponse = await tryonApiService.getMaskPoints(humanImageFile);

				// Save mask points to IndexedDB with imageId reference
				const maskPointsId = await indexedDBManager.saveMaskPoints(
					imageId,
					maskPointsResponse.masks.upper,
					maskPointsResponse.masks.lower,
					maskPointsResponse.masks.full
				);

				console.log('Mask points saved to IndexedDB with ID:', maskPointsId, 'for image ID:', imageId);
				onContinue();
			} catch (maskError) {
				console.error('Error getting or saving mask points:', maskError);
				// Continue with the flow even if mask points fail
			}

			// Notify parent component with the image URL
		} catch (error) {
			console.error('Error saving image to IndexedDB:', error);
		} finally {
			setIsSaving(false);
		}
	};

	useEffect(() => {
		if (!isPhotoTaken) {
			startCamera();
			return;
		}
		stopDetection();
		return () => {
			stopCamera();
		};
	}, [isPhotoTaken]);

	// Start pose detection when camera is ready or pose changes
	useEffect(() => {
		if (videoRef.current && !isPhotoTaken) {
			startDetection(imagePath);
		}
	}, [startDetection, isPhotoTaken, imagePath, videoRef]);

	// Reset countdown when pose changes
	useEffect(() => {
		if (!isPhotoTaken) {
			console.log(`Pose changed to ${pose}, resetting countdown state`);
			setIsCountingDown(false);
			poseStableTimeRef.current = 0;
			// Stop current detection to allow new one to start with new pose
			stopDetection();
		}
	}, [pose, isPhotoTaken, stopDetection]);

	// Track how long the pose has been stable and start countdown
	useEffect(() => {
		let interval: NodeJS.Timeout;

		if (isPhotoTaken) return;

		console.log(
			`Pose validation state: isValidPose=${isValidPose}, isCountingDown=${isCountingDown}, poseStableTime=${poseStableTimeRef.current.toFixed(1)}`
		);

		if (isValidPose) {
			interval = setInterval(() => {
				poseStableTimeRef.current = poseStableTimeRef.current + 0.1;
				if (poseStableTimeRef.current >= 2.0) {
					// Pose has been stable for 2 seconds, start countdown
					if (!isCountingDown) {
						console.log('Starting countdown - pose stable for 2 seconds');
						setIsCountingDown(true);
					}
					poseStableTimeRef.current = 2.0;
				}
			}, 100);
		} else {
			if (poseStableTimeRef.current > 0) {
				console.log('Resetting pose stable time - pose invalid');
			}
			poseStableTimeRef.current = 0;
			setIsCountingDown(false);
		}

		return () => {
			if (interval) {
				clearInterval(interval);
			}
		};
	}, [isValidPose, isCountingDown, isPhotoTaken]);

	// Cleanup pose detection on unmount
	useEffect(() => {
		return () => {
			stopDetection();
		};
	}, [stopDetection]);

	return (
		<>
			<div className='w-full max-w-md rounded-2xl mx-auto flex items-center justify-center overflow-hidden relative grow md:h-[calc(100vh-350px)] min-h-0 '>
				{/* Countdown overlay */}
				{isCountingDown && isValidPose && (
					<div className={`absolute inset-0 flex items-center justify-center z-50`}>
						<CountdownAnimation
							initialCount={2}
							onComplete={() => {
								setIsCountingDown(false);
							}}
							onCheckShow={capturePhoto}
							showRestartButton={false}
							className='w-32 h-32'
						/>
					</div>
				)}

				{/* Camera view - shown when photo is not taken */}
				<div className={`absolute inset-0 ${isPhotoTaken ? 'hidden' : ''}`}>
					<div className='absolute inset-0 flex items-center justify-center z-30' ref={containerRef}>
						{pose === 1 && (
							<FrontPose1
								className={cn(
									'w-full object-cover h-[80%]',
									!isValidPose ? 'text-white' : 'text-[#4FBF67]'
								)}
							/>
						)}
						{pose === 2 && (
							<FrontPose2
								className={cn(
									'w-full object-cover h-[80%]',
									!isValidPose ? 'text-white' : 'text-[#4FBF67]'
								)}
							/>
						)}
						{pose === 3 && (
							<FrontPose3
								className={cn(
									'w-full object-cover h-[80%]',
									!isValidPose ? 'text-white' : 'text-[#4FBF67]'
								)}
							/>
						)}
					</div>
					<video ref={videoRef} className='absolute inset-0 w-full h-full object-cover' playsInline muted />
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
					<canvas
						id='pose-canvas'
						className='absolute inset-0 pointer-events-none z-[39]'
						style={{
							objectFit: 'cover',
							width: '100%',
							height: '100%',
							transform: 'scaleX(-1)'
						}}
					/>
				</div>

				{/* Captured image view - shown when photo is taken */}
				<div className={`absolute inset-0 ${!isPhotoTaken ? 'hidden' : ''}`}>
					{capturedImageUrl && (
						<img src={capturedImageUrl} alt='Captured photo' className='w-full h-full object-cover' />
					)}
				</div>
			</div>

			<div className='h-[102px] flex flex-col overflow-hidden shrink-0 pb-2'>
				{/* Instruction text - shown when photo is not taken */}
				<div className={`text-center ${isPhotoTaken ? 'hidden' : ''}`}>
					{showPoseSelection ? (
						<div className='h-full flex flex-col'>
							<p className='text-[#1B1D21] text-[16px] leading-[24px] pb-2 mt-2 text-center'>
								{t('getUserModelImage.steps.frontView.instruction')}
							</p>
							<div className='flex justify-center gap-4'>
								<div
									className={cn(
										'w-[56px] aspect-square flex items-center justify-center rounded-lg',
										pose === 1 && 'border-gradient'
									)}
								>
									{pose === 1 ? (
										<FrontPoseIconGradient1 className='h-[80%]' />
									) : (
										<FrontPoseIcon1 className='h-[80%] cursor-pointer' onClick={() => setPose(1)} />
									)}
								</div>
								<div
									className={cn(
										'w-[56px] aspect-square flex items-center justify-center rounded-lg',
										pose === 2 && 'border-gradient'
									)}
								>
									{pose === 2 ? (
										<FrontPoseIconGradient2 className='h-[80%]' />
									) : (
										<FrontPoseIcon2 className='h-[80%] cursor-pointer' onClick={() => setPose(2)} />
									)}
								</div>
								<div
									className={cn(
										'w-[56px] aspect-square flex items-center justify-center rounded-lg',
										pose === 3 && 'border-gradient'
									)}
								>
									{pose === 3 ? (
										<FrontPoseIconGradient3 className='h-[80%]' />
									) : (
										<FrontPoseIcon3 className='h-[80%] cursor-pointer' onClick={() => setPose(3)} />
									)}
								</div>
							</div>
						</div>
					) : (
						<p className='text-[#1B1D21] text-[16px] leading-[24px] p-4 text-center'>
							{t('getUserModelImage.steps.frontView.instruction')}
						</p>
					)}
				</div>

				{/* Photo review section - shown when photo is taken */}
				<div className={`${!isPhotoTaken ? 'hidden' : ''}`}>
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
							className='bg-gradient h-[44px] text-white text-[16px] leading-[24px] flex items-center justify-center gap-1'
							onClick={acceptPhoto}
							disabled={isSaving}
						>
							{isSaving && <Spinner className='w-6 h-6' />}
							{isSaving ? t('common.processing') : t('common.accept')}
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default FrontViewStep;
