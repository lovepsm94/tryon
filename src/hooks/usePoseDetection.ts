/* eslint-disable no-debugger */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { PoseTemplate } from '@/pages/product/Mobile/ProductActions/PreparePhoto/templates';

type Keypoint = poseDetection.Keypoint;

export interface PoseResult {
	landmarks?: Keypoint[];
	poseMatchScore?: number;
	isValidPose: boolean;
}

export interface UsePoseDetectionReturn {
	isDetecting: boolean;
	poseResult: PoseResult | null;
	startDetection: () => void;
	stopDetection: () => void;
	error: string | null;
	// drawKeypoints: (landmarks: Keypoint[]) => void;
	clearCanvas: () => void;
}

export const usePoseDetection = (
	videoRef: React.RefObject<HTMLVideoElement>,
	canvasRef: React.RefObject<HTMLCanvasElement>,
	poseTemplate: PoseTemplate,
	poseValidationConfig: {
		maxOffsetX: number;
		maxOffsetY: number;
	}
): UsePoseDetectionReturn => {
	const [isDetecting, setIsDetecting] = useState(false);
	const [poseResult, setPoseResult] = useState<PoseResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const isInitializedRef = useRef(false);

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
	// 		// Draw pose template
	// 		// const template = poseTemplate.keypoints;

	// 		// Scale only by height
	// 		// const scale = canvas.height / poseTemplate.height;
	// 		// const offsetX = (canvas.width - poseTemplate.width * scale) / 2;
	// 		// const offsetY = 0;

	// 		// // Draw template keypoints (red)
	// 		// template.forEach((keypoint) => {
	// 		// 	const x = keypoint.x * scale + offsetX;
	// 		// 	const y = keypoint.y * scale + offsetY;

	// 		// 	ctx.beginPath();
	// 		// 	ctx.arc(x, y, 4, 0, 2 * Math.PI);
	// 		// 	ctx.fillStyle = '#ff0000';
	// 		// 	ctx.fill();
	// 		// 	ctx.strokeStyle = '#ff0000';
	// 		// 	ctx.lineWidth = 2;
	// 		// 	ctx.stroke();
	// 		// });

	// 		// Draw keypoints (green)
	// 		landmarks.forEach((landmark) => {
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

	// 		// // Draw template connections color red
	// 		// ctx.strokeStyle = '#ff0000';
	// 		// ctx.lineWidth = 2;
	// 		// connections.forEach(([start, end]) => {
	// 		// 	const startPoint = template[start];
	// 		// 	const endPoint = template[end];

	// 		// 	if (startPoint && endPoint) {
	// 		// 		const x1 = startPoint.x * scale + offsetX;
	// 		// 		const y1 = startPoint.y * scale + offsetY;
	// 		// 		const x2 = endPoint.x * scale + offsetX;
	// 		// 		const y2 = endPoint.y * scale + offsetY;
	// 		// 		ctx.beginPath();
	// 		// 		ctx.moveTo(x1, y1);
	// 		// 		ctx.lineTo(x2, y2);
	// 		// 		ctx.stroke();
	// 		// 	}
	// 		// });
	// 	},
	// 	[canvasRef, videoRef, poseTemplate]
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
		(poses: poseDetection.Pose[]) => {
			const importantKeypoints = [5, 6, 9, 10, 11, 12, 15, 16]; // left shoulder, right shoulder, left elbow, right elbow, left hip, right hip, left ankle, right ankle;
			if (!poses || poses.length === 0) {
				setPoseResult({ isValidPose: false, landmarks: [], poseMatchScore: 0 });
				return;
			}

			const pose = poses[0];
			const landmarks = pose.keypoints;

			// Get video dimensions for ratio calculation
			const video = videoRef.current;
			if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
				setPoseResult({ isValidPose: false, landmarks: [], poseMatchScore: 0 });
				return;
			}

			// Scale only by height
			const scale = video.videoHeight / poseTemplate.height;
			const offsetX = (video.videoWidth - poseTemplate.width * scale) / 2;
			const offsetY = 0;

			// Get template keypoints
			const templateKeypoints = poseTemplate.keypoints;

			let passedPoints = 0;

			// Validate each important keypoint
			importantKeypoints.forEach((keypointIndex) => {
				const detectedKeypoint = landmarks[keypointIndex];
				const templateKeypoint = templateKeypoints[keypointIndex];

				if (!detectedKeypoint || !templateKeypoint || !detectedKeypoint.score) {
					return;
				}

				// Calculate template position in video coordinates (scale only by height, mirror horizontally)
				const templateX = video.videoWidth - (templateKeypoint.x * scale + offsetX);
				const templateY = templateKeypoint.y * scale + offsetY;

				// Calculate offset
				const offsetXVal = Math.abs(detectedKeypoint.x - templateX);
				const offsetYVal = Math.abs(detectedKeypoint.y - templateY);

				// Check if offset is within threshold
				if (offsetXVal <= poseValidationConfig.maxOffsetX && offsetYVal <= poseValidationConfig.maxOffsetY) {
					passedPoints++;
				}
			});

			// Calculate score as percentage of passed points
			const poseMatchScore = passedPoints;
			const isValidPose = passedPoints >= 6;

			const result: PoseResult = {
				isValidPose,
				landmarks,
				poseMatchScore
			};

			setPoseResult(result);
		},
		[poseTemplate, poseValidationConfig, videoRef]
	);

	// Initialize TensorFlow and Pose Detection
	const initializePose = useCallback(async () => {
		try {
			await tf.ready();

			detectorRef.current = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
				modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
				enableSmoothing: true,
				minPoseScore: 0.3
			});

			isInitializedRef.current = true;
			setError(null);
		} catch (err) {
			console.error('Failed to initialize pose detection:', err);
			setError('Không thể khởi tạo pose detection');
		}
	}, []);

	// Process video frame for pose detection

	// Start pose detection
	const startDetection = useCallback(async () => {
		if (!isInitializedRef.current) {
			await initializePose();
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
				if (!detectorRef.current || !videoRef.current) {
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

					const poses = await detectorRef.current.estimatePoses(video);

					analyzePose(poses);
					// if (poses && poses.length > 0) {
					// 	drawKeypoints(poses[0].keypoints);
					// } else {
					// 	clearCanvas();
					// }

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
	}, [videoRef]);

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
		};
	}, [stopDetection]);

	return {
		isDetecting,
		poseResult,
		startDetection,
		stopDetection,
		error,
		// drawKeypoints,
		clearCanvas
	};
};
