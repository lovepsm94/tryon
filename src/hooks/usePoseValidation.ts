import { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { PoseImageProcessor } from '@/utils/poseImageProcessor';
import { PoseValidationZone } from '@/utils/poseImageReader';

type Keypoint = poseDetection.Keypoint;

export interface PoseResult {
	landmarks?: Keypoint[];
	poseMatchScore?: number;
	isValidPose: boolean;
}

export interface UsePoseValidationReturn {
	isDetecting: boolean;
	isValidPose: boolean;
	startDetection: (imagePath: string) => Promise<void>;
	stopDetection: () => void;
	error: string | null;
	initializePoseMask: (imagePath: string) => Promise<void>;
	drawValidationZones: (imagePath: string) => void;
}

export const usePoseValidation = (
	videoRef: React.RefObject<HTMLVideoElement>,
	canvasRef: React.RefObject<HTMLCanvasElement>,
	poseValidationZones: PoseValidationZone[]
): UsePoseValidationReturn => {
	const [isDetecting, setIsDetecting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isValidPose, setIsValidPose] = useState(false);
	const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const isInitializedRef = useRef(false);
	const poseProcessorRef = useRef<Record<string, PoseImageProcessor>>({});

	const imagePathRef = useRef<string>('');

	const drawValidationZones = useCallback(
		(imagePath: string) => {
			const canvas = document.getElementById('pose-canvas') as HTMLCanvasElement;
			alert('drawValidationZones');
			const video = videoRef.current;
			if (!canvas || !video) return;

			const isPortrait = video.videoHeight > video.videoWidth;

			// For mobile portrait, we need to handle the orientation differently
			// The pose images are designed for landscape orientation
			let effectiveWidth = video.videoWidth;
			let effectiveHeight = video.videoHeight;

			if (isPortrait) {
				// On mobile portrait, swap dimensions to match pose image orientation
				// This assumes pose images are designed for landscape orientation
				effectiveWidth = video.videoHeight;
				effectiveHeight = video.videoWidth;
			}
			canvas.width = effectiveWidth;
			canvas.height = effectiveHeight;

			const ctx = canvas.getContext('2d');
			if (!ctx) return;

			if (poseProcessorRef.current[imagePath]) {
				poseProcessorRef.current[imagePath].drawAllValidationZones(ctx);
			}
		},
		[videoRef]
	);

	// const drawKeypoints = useCallback(
	// 	(landmarks: Keypoint[]) => {
	// 		if (!canvasRef?.current || !videoRef?.current || !landmarks || landmarks.length === 0) {
	// 			return;
	// 		}

	// 		const canvas = canvasRef.current;
	// 		const ctx = canvas.getContext('2d');
	// 		const video = videoRef.current;

	// 		if (!ctx) {
	// 			return;
	// 		}

	// 		canvas.width = video.videoWidth;
	// 		canvas.height = video.videoHeight;

	// 		// Clear canvas
	// 		ctx.clearRect(0, 0, canvas.width, canvas.height);

	// 		// Draw detected keypoints (green)
	// 		landmarks.forEach((landmark) => {
	// 			if (!landmark.score || landmark.score < 0.3) return;

	// 			const x = landmark.x;
	// 			const y = landmark.y;

	// 			ctx.beginPath();
	// 			ctx.arc(x, y, 4, 0, 2 * Math.PI);
	// 			ctx.fillStyle = '#00ff00';
	// 			ctx.fill();
	// 			ctx.strokeStyle = '#00ff00';
	// 			ctx.lineWidth = 2;
	// 			ctx.stroke();
	// 		});

	// 		// Draw connections between keypoints (skeleton)
	// 		const connections = [
	// 			[0, 1],
	// 			[0, 2],
	// 			[1, 3],
	// 			[2, 4], // Head
	// 			[5, 6],
	// 			[5, 11],
	// 			[6, 12],
	// 			[11, 12], // Torso
	// 			[5, 7],
	// 			[7, 9], // Left arm
	// 			[6, 8],
	// 			[8, 10], // Right arm
	// 			[11, 13],
	// 			[13, 15], // Left leg
	// 			[12, 14],
	// 			[14, 16] // Right leg
	// 		];

	// 		ctx.strokeStyle = '#00ff00';
	// 		ctx.lineWidth = 2;

	// 		connections.forEach(([start, end]) => {
	// 			const startPoint = landmarks[start];
	// 			const endPoint = landmarks[end];

	// 			if (
	// 				startPoint &&
	// 				endPoint &&
	// 				startPoint.score &&
	// 				endPoint.score &&
	// 				startPoint.score > 0.3 &&
	// 				endPoint.score > 0.3
	// 			) {
	// 				ctx.beginPath();
	// 				ctx.moveTo(startPoint.x, startPoint.y);
	// 				ctx.lineTo(endPoint.x, endPoint.y);
	// 				ctx.stroke();
	// 			}
	// 		});
	// 	},
	// 	[canvasRef, videoRef]
	// );

	// Clear canvas
	const clearCanvas = useCallback(() => {
		if (!canvasRef?.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}
	}, [canvasRef]);

	const analyzePose = useCallback(
		(humanVideo: poseDetection.Pose[], imagePath: string) => {
			if (!humanVideo || humanVideo.length === 0) {
				setIsValidPose(false);
				clearCanvas();
				return;
			}
			if (imagePathRef.current !== imagePath) {
				return;
			}

			const pose = humanVideo[0];
			const landmarks = pose.keypoints;

			// Get video dimensions
			const video = videoRef.current;
			if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
				setIsValidPose(false);
				return;
			}

			// Initialize pose processor if not already done
			if (!poseProcessorRef.current[imagePath] || imagePathRef.current !== imagePath) {
				return;
			}

			// Validate pose using the landmarks
			const isValid = poseProcessorRef.current[imagePath].validatePose(landmarks);
			setIsValidPose(isValid);

			// Draw keypoints for visualization
			// drawKeypoints(landmarks);
		},
		[videoRef, clearCanvas]
	);

	// Initialize Pose Detection
	const initializePoseMask = useCallback(
		async (imagePath: string) => {
			if (poseProcessorRef.current[imagePath]) {
				return;
			}
			const video = videoRef.current;

			if (video && video.videoWidth > 0 && video.videoHeight > 0) {
				poseProcessorRef.current = {
					...poseProcessorRef.current,
					[imagePath]: new PoseImageProcessor(
						video.videoWidth,
						video.videoHeight,
						poseValidationZones,
						imagePath
					)
				};

				// Load pose image data
				await poseProcessorRef.current[imagePath].loadPoseImage();
			}
		},
		[videoRef, poseValidationZones]
	);

	// Initialize TensorFlow
	const initializePoseDetection = useCallback(async () => {
		if (isInitializedRef.current) {
			console.log('Pose detection already initialized');
			return;
		}
		try {
			console.log('Initializing pose detection...');
			await tf.ready();

			detectorRef.current = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
				modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
				minPoseScore: 0.3
			});

			isInitializedRef.current = true;
			setError(null);
		} catch (err) {
			console.error('Failed to initialize pose detection:', err);
			setError('Failed to initialize pose detection');
		}
	}, []);

	// Start pose detection
	const startDetection = useCallback(
		async (imagePath: string) => {
			imagePathRef.current = imagePath;
			await initializePoseDetection();
			await initializePoseMask(imagePath);
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}

			if (detectorRef.current && videoRef.current) {
				const video = videoRef.current;

				// Wait for video to be ready
				if (video.readyState < 2) {
					await new Promise<void>((resolve) => {
						const handleCanPlay = () => {
							video.removeEventListener('canplay', handleCanPlay);
							resolve();
						};
						video.addEventListener('canplay', handleCanPlay);
					});
				}

				// Ensure video is playing
				if (video.paused) {
					try {
						await video.play();
					} catch (err) {
						console.error('Failed to play video:', err);
						setError('Không thể phát video');
						return;
					}
				}

				setIsDetecting(true);
				setError(null);

				const processFrame = async () => {
					if (!detectorRef.current || !videoRef.current || imagePathRef.current !== imagePath) {
						return;
					}

					try {
						const video = videoRef.current;

						if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
							animationFrameRef.current = requestAnimationFrame(processFrame);
							return;
						}

						// Ensure video is playing
						if (video.paused) {
							await video.play();
						}

						const humanVideo = await detectorRef.current.estimatePoses(video);
						analyzePose(humanVideo, imagePath);

						// Continue processing frames
						animationFrameRef.current = requestAnimationFrame(processFrame);
					} catch (err) {
						console.error('Error processing frame:', err);
						setError('Lỗi xử lý video');
						// Stop detection on error
						setIsDetecting(false);
					}
				};

				processFrame();
			}
		},
		[videoRef, initializePoseMask, initializePoseDetection, analyzePose]
	);

	// Stop pose detection
	const stopDetection = useCallback(() => {
		setIsDetecting(false);
		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
			animationFrameRef.current = null;
		}
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopDetection();
			// Cleanup pose processors
			Object.values(poseProcessorRef.current).forEach((processor) => {
				processor.cleanup();
			});
		};
	}, [stopDetection]);

	return {
		isDetecting,
		isValidPose,
		startDetection,
		stopDetection,
		initializePoseMask,
		drawValidationZones,
		error
	};
};
