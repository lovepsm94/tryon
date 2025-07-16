import { ReactComponent as SidePose } from '@/assets/side-pose.svg';
import { useWebcam } from '@/hooks';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { indexedDBManager } from '@/utils/indexedDBManager';
import CountdownAnimation from '../CountdownAnimation';

import { usePoseValidation } from '@/hooks';
import cn from '@/utils/cn';
import { SIDE_POSE_VALIDATION_ZONES } from '@/utils/poseImageProcessor';

interface SideViewStepProps {
	onContinue: () => void;
}

const SideViewStep: React.FC<SideViewStepProps> = ({ onContinue }) => {
	const { t } = useTranslation();
	const { videoRef, startCamera, stopCamera } = useWebcam();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const { isValidPose, startDetection, stopDetection } = usePoseValidation(
		videoRef,
		canvasRef,
		SIDE_POSE_VALIDATION_ZONES
	);
	const [isCountingDown, setIsCountingDown] = useState(false);
	const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
	const [capturedImageBlob, setCapturedImageBlob] = useState<Blob | null>(null);
	const [isPhotoTaken, setIsPhotoTaken] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const poseStableTimeRef = useRef(0);
	const imagePath = useMemo(() => `/poses/side.png`, []);

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
		setIsCountingDown(false);
		setIsSaving(false);
		startCamera();
		startDetection(imagePath);
	};

	// Accept photo function
	const acceptPhoto = async () => {
		if (!capturedImageBlob || !capturedImageUrl) return;

		try {
			setIsSaving(true);

			// Check if side view image already exists
			const existingImage = await indexedDBManager.getLatestUserImage('side');

			if (existingImage && existingImage.id) {
				// Delete existing image first
				await indexedDBManager.deleteUserImage(existingImage.id);
				// Revoke the old object URL to free memory
				indexedDBManager.revokeObjectUrl(existingImage.imageUrl);
			}

			// Save new image to IndexedDB
			const imageId = await indexedDBManager.saveUserImage(capturedImageBlob, 'side');

			console.log('Side view image saved to IndexedDB with ID:', imageId);

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
			return;
		}
		stopDetection();
		return () => {
			stopCamera();
		};
	}, [isPhotoTaken]);

	// Start pose detection when camera is ready
	useEffect(() => {
		if (videoRef.current && !isPhotoTaken) {
			startDetection(imagePath);
		}
	}, [startDetection, isPhotoTaken, imagePath, videoRef]);

	// Track how long the pose has been stable and start countdown
	useEffect(() => {
		let interval: NodeJS.Timeout;

		if (isPhotoTaken) return;

		if (isValidPose) {
			interval = setInterval(() => {
				poseStableTimeRef.current = poseStableTimeRef.current + 0.1;
				if (poseStableTimeRef.current >= 2.0) {
					// Pose has been stable for 2 seconds, start countdown
					if (!isCountingDown) {
						setIsCountingDown(true);
					}
					poseStableTimeRef.current = 2.0;
				}
			}, 100);
		} else {
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
		<div className='h-full flex flex-col'>
			<div className='w-full max-w-md grow rounded-2xl mx-auto mb-4 flex items-center justify-center overflow-hidden relative '>
				{/* Countdown overlay */}
				{isCountingDown && isValidPose && (
					<div className='absolute inset-0 flex items-center justify-center z-50'>
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
						<SidePose
							className={cn(
								'w-full object-cover h-[80%]',
								!isValidPose ? 'text-white' : 'text-[#4FBF67]'
							)}
						/>
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
					<canvas
						id='pose-canvas'
						className='absolute inset-0 w-full h-full pointer-events-none z-[39]'
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

			<div className='h-[92px] flex flex-col'>
				{/* Instruction text - shown when photo is not taken */}
				<div className={`text-center ${isPhotoTaken ? 'hidden' : ''}`}>
					<p className='text-[#1B1D21] text-[16px] leading-[24px] p-4 text-center'>
						{t('getUserModelImage.steps.sideView.instruction')}
					</p>
				</div>
				<div className={`grow ${isPhotoTaken ? 'hidden' : ''}`}></div>

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
							className='bg-gradient h-[44px] text-white text-[16px] leading-[24px]'
							onClick={acceptPhoto}
							disabled={isSaving}
						>
							{t('common.accept')}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SideViewStep;
