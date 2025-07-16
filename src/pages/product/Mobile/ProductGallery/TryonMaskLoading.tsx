import React, { useRef, useEffect, useState } from 'react';
import { indexedDBManager, UserImageDataWithUrl } from '@/utils/indexedDBManager';
import { localStorageManager } from '@/utils/localStorageManager';
import { useProduct } from '@/contexts/ProductContext';

interface Point {
	x: number;
	y: number;
}

const TryonMaskLoadingCanvas: React.FC = () => {
	const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
	const animationCanvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const gradientOffset = useRef(0);
	const [frontImageData, setFrontImageData] = useState<{
		imageUrl: string;
		width: number;
		height: number;
	} | null>(null);
	const [maskPoints, setMaskPoints] = useState<{
		upper: number[][];
		lower: number[][];
		full: number[][];
	} | null>(null);
	const [backgroundDrawn, setBackgroundDrawn] = useState(false);
	const { selectedProducts } = useProduct();

	// Load front image data and dimensions
	useEffect(() => {
		const loadFrontImageData = async () => {
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

				// Get front image data
				let imageData: UserImageDataWithUrl | null = null;
				if (selectedFrontImageId) {
					imageData = await indexedDBManager.getUserImage(selectedFrontImageId);
				} else {
					// Fallback to latest front image if no selection
					imageData = await indexedDBManager.getLatestUserImage('front');
				}

				if (imageData) {
					// Create a temporary image to get dimensions
					const img = new Image();
					img.onload = () => {
						setFrontImageData({
							imageUrl: imageData?.imageUrl || '',
							width: img.naturalWidth,
							height: img.naturalHeight
						});
					};
					img.src = imageData?.imageUrl || '';
				}
			} catch (error) {
				console.error('Error loading front image data:', error);
			}
		};

		loadFrontImageData();
	}, []);

	// Load mask points from IndexedDB
	useEffect(() => {
		const loadMaskPoints = async () => {
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

				// Get mask points for the selected image
				let maskPointsData;
				if (selectedFrontImageId) {
					maskPointsData = await indexedDBManager.getMaskPointsByImageId(selectedFrontImageId);
				} else {
					// Fallback to latest mask points if no selection
					maskPointsData = await indexedDBManager.getLatestMaskPoints();
				}

				if (maskPointsData) {
					setMaskPoints({
						upper: maskPointsData.upper,
						lower: maskPointsData.lower,
						full: maskPointsData.full
					});
				}
			} catch (error) {
				console.error('Error loading mask points:', error);
			}
		};

		loadMaskPoints();
	}, []);

	// Convert data points to canvas coordinates
	const convertDataPointsToCanvas = (
		dataPoints: number[][],
		originalSize: [number, number],
		canvasSize: [number, number]
	): Point[] => {
		const [originalWidth, originalHeight] = originalSize;
		const [canvasWidth, canvasHeight] = canvasSize;

		return dataPoints.map(([x, y]) => ({
			x: (x / originalWidth) * canvasWidth,
			y: (y / originalHeight) * canvasHeight
		}));
	};

	// Draw shape with gradient animation
	const drawShape = (ctx: CanvasRenderingContext2D, points: Point[]) => {
		if (!frontImageData || points.length < 3) return;

		// Create animated gradient
		const gradient = ctx.createLinearGradient(0, 0, frontImageData.width, frontImageData.height);

		// Define gradient colors
		const colors = [
			{ pos: 0, color: 'rgba(255, 166, 61, 0.6)' }, // #FFA63D
			{ pos: 0.25, color: 'rgba(255, 61, 119, 0.6)' }, // #FF3D77
			{ pos: 0.5, color: 'rgba(51, 138, 255, 0.6)' }, // #338AFF
			{ pos: 0.75, color: 'rgba(60, 240, 197, 0.6)' }, // #3CF0C5
			{ pos: 1, color: 'rgba(255, 166, 61, 0.6)' } // #FFA63D (repeat)
		];

		// Create smooth gradient with interpolation
		for (let i = 0; i < colors.length - 1; i++) {
			const currentColor = colors[i];
			const nextColor = colors[i + 1];

			// Create multiple transition steps between colors
			for (let j = 0; j < 5; j++) {
				const t = j / 5;
				const pos = (currentColor.pos + (nextColor.pos - currentColor.pos) * t + gradientOffset.current) % 1;

				// Interpolate color
				const rgb1 = currentColor.color.match(/\d+/g);
				const rgb2 = nextColor.color.match(/\d+/g);

				if (rgb1 && rgb2) {
					const r = Math.round(parseInt(rgb1[0]) * (1 - t) + parseInt(rgb2[0]) * t);
					const g = Math.round(parseInt(rgb1[1]) * (1 - t) + parseInt(rgb2[1]) * t);
					const b = Math.round(parseInt(rgb1[2]) * (1 - t) + parseInt(rgb2[2]) * t);

					const interpolatedColor = `rgba(${r}, ${g}, ${b}, 0.6)`;
					gradient.addColorStop(pos, interpolatedColor);
				}
			}
		}

		// Draw shape path
		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);

		for (let i = 1; i < points.length; i++) {
			ctx.lineTo(points[i].x, points[i].y);
		}

		ctx.closePath();

		// Fill with gradient
		ctx.fillStyle = gradient;
		ctx.fill();

		// Draw stroke with gradient
		const strokeGradient = ctx.createLinearGradient(0, 0, frontImageData.width, frontImageData.height);
		strokeGradient.addColorStop(0, '#FFA63D');
		strokeGradient.addColorStop(0.33, '#FF3D77');
		strokeGradient.addColorStop(0.66, '#338AFF');
		strokeGradient.addColorStop(1, '#3CF0C5');

		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 3;
		ctx.stroke();

		// Only draw connecting lines, no points
	};

	// Draw background image once
	const drawBackground = () => {
		const backgroundCanvas = backgroundCanvasRef.current;
		if (!backgroundCanvas || !frontImageData || backgroundDrawn) return;

		const ctx = backgroundCanvas.getContext('2d');
		if (!ctx) return;

		// Draw background image
		const img = new Image();
		img.onload = () => {
			ctx.drawImage(img, 0, 0, frontImageData.width, frontImageData.height);
			setBackgroundDrawn(true);
		};
		img.src = frontImageData.imageUrl;
	};

	// Animation loop - only update gradient effect
	const drawAnimation = () => {
		const animationCanvas = animationCanvasRef.current;
		if (!animationCanvas || !frontImageData) return;
		if (maskPoints) {
			let pointsToDraw: Point[] = [];

			if (selectedProducts.upper && selectedProducts.lower) {
				pointsToDraw = convertDataPointsToCanvas(
					maskPoints.full,
					[frontImageData.width, frontImageData.height],
					[frontImageData.width, frontImageData.height]
				);
			} else if (selectedProducts.upper && maskPoints.upper.length > 0) {
				pointsToDraw = convertDataPointsToCanvas(
					maskPoints.upper,
					[frontImageData.width, frontImageData.height],
					[frontImageData.width, frontImageData.height]
				);
			} else {
				pointsToDraw = convertDataPointsToCanvas(
					maskPoints.lower,
					[frontImageData.width, frontImageData.height],
					[frontImageData.width, frontImageData.height]
				);
			}

			const animate = () => {
				const ctx = animationCanvas.getContext('2d');
				if (!ctx) return;

				// Clear animation canvas
				ctx.clearRect(0, 0, frontImageData.width, frontImageData.height);

				// Draw mask points based on product type

				if (pointsToDraw.length > 0) {
					drawShape(ctx, pointsToDraw);
				}
				gradientOffset.current += 0.0017; // 60fps * 10s = 600 frames, 1/600 ≈ 0.0017
				if (gradientOffset.current > 1) {
					gradientOffset.current = 0;
				}
				animationRef.current = requestAnimationFrame(animate);
			};

			animate();
		}
	};

	// Start animation
	useEffect(() => {
		// Draw background first
		drawBackground();

		// Start animation loop
		drawAnimation();

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [frontImageData, maskPoints, selectedProducts]);

	return (
		<div className='relative w-full h-full'>
			{/* Background canvas - drawn once */}
			<canvas
				ref={backgroundCanvasRef}
				width={frontImageData?.width || 800}
				height={frontImageData?.height || 600}
				className='absolute inset-0 w-full h-full object-cover'
				style={{ zIndex: 1 }}
			/>
			{/* Animation canvas - updated continuously */}
			<canvas
				ref={animationCanvasRef}
				width={frontImageData?.width || 800}
				height={frontImageData?.height || 600}
				className='absolute inset-0 w-full h-full object-cover'
				style={{ zIndex: 2 }}
			/>
		</div>
	);
};

const TryonMaskLoading: React.FC = () => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [selectedImageData, setSelectedImageData] = useState<{
		imageUrl: string;
		width: number;
		height: number;
	} | null>(null);

	// Load selected front image data
	useEffect(() => {
		const loadSelectedImageData = async () => {
			try {
				// Get selected front image ID from localStorage
				let selectedFrontImageId: number | null = null;
				try {
					const userData = localStorageManager.getUserData();
					console.log(userData, 'userData');
					if (userData && userData.selectedFrontImageId) {
						selectedFrontImageId = userData.selectedFrontImageId;
					}
				} catch (error) {
					console.warn('Could not retrieve selected front image ID from localStorage:', error);
				}

				// Get selected image data
				let imageData: UserImageDataWithUrl | null = null;
				if (selectedFrontImageId) {
					imageData = await indexedDBManager.getUserImage(selectedFrontImageId);
				} else {
					// Fallback to latest front image if no selection
					imageData = await indexedDBManager.getLatestUserImage('front');
				}

				console.log(imageData, 'imageData2');
				if (imageData) {
					// Create a temporary image to get dimensions
					const img = new Image();
					img.onload = () => {
						console.log('onLoad');
						setSelectedImageData({
							imageUrl: imageData?.imageUrl || '',
							width: img.naturalWidth,
							height: img.naturalHeight
						});
						document.body.removeChild(img);
					};
					img.style.display = 'none';
					document.body.appendChild(img);
					img.src = imageData?.imageUrl || '';
				}
			} catch (error) {
				console.error('Error loading selected image data:', error);
			}
		};

		loadSelectedImageData();
	}, []);

	if (!selectedImageData) return null;

	return (
		<div ref={containerRef} className='absolute inset-0 z-[70]'>
			<TryonMaskLoadingCanvas />
		</div>
	);
};

export default TryonMaskLoading;
