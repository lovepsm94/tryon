import { useProduct } from '@/contexts/ProductContext';
import { useResponsive } from '@/contexts/ResponsiveContext';
import React, { useRef, useEffect, useState } from 'react';
import { UpperFitData, LowerFitData } from '@/utils/tryonApi';
import { Point, convertDataPointsToCanvas, drawEllipse, drawLine, drawBox, drawConnectingLine } from '@/utils/canvas';
import { useTranslation } from 'react-i18next';

const MARGIN = 16;

interface SizeGuideCanvasProps {
	width: number;
	height: number;
	imageUrl: string;
	upperFitData?: UpperFitData;
	lowerFitData?: LowerFitData;
	showDebugControls?: boolean;
	containerRef: React.RefObject<HTMLDivElement>;
	selectedSize: string | null;
}

interface ResultBox {
	x: number;
	y: number;
	label: string;
	value: string;
	start?: { x: number; y: number };
	isUpper?: boolean;
}

/**
 * Draw all result fitting boxes
 */
function drawResultBoxes(ctx: CanvasRenderingContext2D, boxes: ResultBox[], scale = 1, isMobile: boolean) {
	// Calculate box dimensions based on device type
	const boxWidth = (isMobile ? 100 : 140) / scale;
	const boxHeight = (isMobile ? 40 : 60) / scale;
	const radius = 8 / scale;

	boxes.forEach(({ x, y, label, value, start, isUpper }) => {
		// If there's a start point (end of path), draw connecting line
		if (start) {
			drawConnectingLine(ctx, start, x, y, boxWidth, boxHeight, isUpper || false, isMobile ? 8 : 24, scale);
		}

		// Draw box
		drawBox(ctx, x, y, boxWidth, boxHeight, radius, label, value, scale, isMobile);
	});
}

/**
 * Calculate scale factor and container dimensions
 */
function calculateScaleAndContainer(
	containerRef: React.RefObject<HTMLDivElement>,
	canvasWidth: number,
	canvasHeight: number
) {
	if (!containerRef.current) {
		return { scale: 1, containerWidth: 0, containerHeight: 0, offsetX: 0, offsetY: 0 };
	}

	const container = containerRef.current;
	const containerWidth = container.clientWidth;
	const containerHeight = container.clientHeight;

	// Calculate scale factors for object-cover behavior
	const scaleX = containerWidth / canvasWidth;
	const scaleY = containerHeight / canvasHeight;
	const scale = Math.max(scaleX, scaleY);

	// Calculate actual displayed dimensions
	const displayedWidth = canvasWidth * scale;
	const displayedHeight = canvasHeight * scale;

	// Calculate offset to center the image
	const offsetX = (containerWidth - displayedWidth) / 2;
	const offsetY = (containerHeight - displayedHeight) / 2;

	return {
		scale,
		containerWidth,
		containerHeight,
		displayedWidth,
		displayedHeight,
		offsetX,
		offsetY
	};
}

/**
 * Convert canvas coordinates to container coordinates
 */
function canvasToContainer(x: number, y: number, scale: number, offsetX: number, offsetY: number) {
	return {
		x: x * scale + offsetX,
		y: y * scale + offsetY
	};
}

/**
 * Convert container coordinates to canvas coordinates
 */
function containerToCanvas(x: number, y: number, scale: number, offsetX: number, offsetY: number) {
	return {
		x: (x - offsetX) / scale,
		y: (y - offsetY) / scale
	};
}

/**
 * Create result boxes from fitting data with proper positioning
 */
function createResultBoxes(
	fitData: UpperFitData | LowerFitData,
	paths: Point[][],
	types: string[],
	containerRef: React.RefObject<HTMLDivElement>,
	canvasWidth: number,
	canvasHeight: number,
	isUpper: boolean,
	selectedSize: string | null,
	isMobile: boolean
): ResultBox[] {
	const boxes: ResultBox[] = [];
	const { scale, containerWidth, containerHeight, offsetX, offsetY } = calculateScaleAndContainer(
		containerRef,
		canvasWidth,
		canvasHeight
	);
	const margin = MARGIN;

	// Calculate available space for boxes
	const availableHeight = containerHeight - margin * 2;

	// Determine box positioning strategy in canvas coordinates
	let canvasBoxX: number;
	if (isUpper) {
		// Upper boxes on the left side - convert margin to canvas coordinates
		const containerLeftX = margin;
		canvasBoxX = containerToCanvas(containerLeftX, 0, scale, offsetX, offsetY).x;
	} else {
		// Lower boxes on the right side - calculate right edge in container, then convert to canvas
		const containerRightX = containerWidth - (isMobile ? 100 : 140) - margin;
		canvasBoxX = containerToCanvas(containerRightX, 0, scale, offsetX, offsetY).x;
	}

	const colSizeIndex = fitData.measure.columns.findIndex((col) => col === 'Size');
	fitData.measure.columns.forEach((col, colIdx) => {
		if (col === 'Size') return;

		const pathIdx = types.findIndex((type) => type === col);
		if (pathIdx !== -1 && fitData.measure.data[colIdx]) {
			const sizeData = fitData.measure.data.find((value) => value[colSizeIndex] === selectedSize);

			const value = sizeData?.[colIdx];
			const path = paths[pathIdx];
			if (path && value) {
				// For waist and hip, use end point; for others, use start point
				const boxPos = col === 'Waist' || col === 'Hip' ? path[path.length - 1] : path[0];

				// Ensure boxPos exists and has valid coordinates
				if (!boxPos || typeof boxPos.x !== 'number' || typeof boxPos.y !== 'number') {
					return;
				}

				// Calculate Y position in container coordinates
				const containerBoxPos = canvasToContainer(boxPos.x, boxPos.y, scale, offsetX, offsetY);
				let containerBoxY = containerBoxPos.y - 12;

				// Adjust Y position based on measurement type
				if (isUpper) {
					if (col === 'Shoulder') containerBoxY = containerBoxY - 50;
					if (col === 'Width') containerBoxY = containerBoxY + 35;
				} else {
					if (col === 'Waist') containerBoxY = containerBoxY - 50;
					if (col === 'Hip') containerBoxY = containerBoxY + 20;
					if (col === 'Inseam') containerBoxY = containerBoxY + 70;
				}

				// Ensure box stays within container bounds
				containerBoxY = Math.max(margin, Math.min(containerBoxY, availableHeight - (isMobile ? 40 : 60)));

				// Convert back to canvas coordinates
				const canvasBoxY = containerToCanvas(0, containerBoxY, scale, offsetX, offsetY).y;

				boxes.push({
					x: canvasBoxX,
					y: canvasBoxY,
					label: col,
					value,
					start: { x: boxPos.x, y: boxPos.y },
					isUpper
				});
			}
		}
	});

	return boxes;
}

const SizeGuideCanvas: React.FC<SizeGuideCanvasProps> = ({
	width,
	height,
	imageUrl,
	upperFitData,
	lowerFitData,
	selectedSize,
	containerRef
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isAnimating, setIsAnimating] = useState(false);
	const [progress, setProgress] = useState(0);
	const animationSpeed = 5;
	const { isMobile } = useResponsive();

	/**
	 * Draw all size guide lines
	 */
	const drawSizeGuide = (ctx: CanvasRenderingContext2D) => {
		const resultBoxes: ResultBox[] = [];
		const allPathEnds: { x: number; y: number }[] = [];

		// Draw upper fit data lines
		let upperPaths: Point[][] = [];
		let upperTypes: string[] = [];
		if (upperFitData?.data_points && upperFitData.measure) {
			const converted = convertDataPointsToCanvas(upperFitData.data_points, [width, height], [width, height]);
			upperPaths = converted.paths;
			upperTypes = converted.measurementTypes;

			upperPaths.forEach((path, index) => {
				const measurementType = upperTypes[index];
				if (measurementType === 'Width' && path.length === 2) {
					drawEllipse(ctx, path, progress);
				} else if (path.length > 1) {
					drawLine(ctx, path, progress);
				}
				if (path.length > 0) {
					allPathEnds.push(path[path.length - 1]);
				}
			});
		}

		// Draw lower fit data lines
		let lowerPaths: Point[][] = [];
		let lowerTypes: string[] = [];
		if (lowerFitData?.data_points && lowerFitData.measure) {
			const converted = convertDataPointsToCanvas(lowerFitData.data_points, [width, height], [width, height]);
			lowerPaths = converted.paths;
			lowerTypes = converted.measurementTypes;

			lowerPaths.forEach((path, index) => {
				const measurementType = lowerTypes[index];
				if ((measurementType === 'Waist' || measurementType === 'Hip') && path.length === 2) {
					drawEllipse(ctx, path, progress);
				} else if (path.length > 1) {
					drawLine(ctx, path, progress);
				}
				if (path.length > 0) {
					allPathEnds.push(path[path.length - 1]);
				}
			});
		}

		// Create result boxes for upper fit data
		if (upperFitData?.data_points && upperFitData.measure) {
			const upperBoxes = createResultBoxes(
				upperFitData,
				upperPaths,
				upperTypes,
				containerRef,
				width,
				height,
				true,
				selectedSize,
				isMobile
			);
			resultBoxes.push(...upperBoxes);
		}

		// Create result boxes for lower fit data
		if (lowerFitData?.data_points && lowerFitData.measure) {
			const lowerBoxes = createResultBoxes(
				lowerFitData,
				lowerPaths,
				lowerTypes,
				containerRef,
				width,
				height,
				false,
				selectedSize,
				isMobile
			);
			resultBoxes.push(...lowerBoxes);
		}

		// Draw all fitting boxes when animation completes
		if (progress >= 1) {
			const { scale } = calculateScaleAndContainer(containerRef, width, height);
			drawResultBoxes(ctx, resultBoxes, scale, isMobile);
		}
	};

	// Animation loop
	useEffect(() => {
		if (!isAnimating) return;

		const animate = () => {
			setProgress((prev) => {
				const newProgress = prev + animationSpeed / 100;
				if (newProgress >= 1) {
					setIsAnimating(false);
					return 1;
				}
				return newProgress;
			});
		};

		const interval = setInterval(animate, 16); // ~60fps
		return () => clearInterval(interval);
	}, [isAnimating, animationSpeed]);

	// Draw background image once
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Clear canvas and draw background image
		ctx.clearRect(0, 0, width, height);
		const img = new Image();
		img.onload = () => {
			ctx.drawImage(img, 0, 0, width, height);
		};
		img.src = imageUrl;
	}, [width, height, imageUrl, selectedSize]);

	// Draw lines when progress changes
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		drawSizeGuide(ctx);
	}, [progress, upperFitData, lowerFitData, selectedSize]);

	// Start animation when component mounts
	useEffect(() => {
		setIsAnimating(true);
		setProgress(0);
	}, [upperFitData, lowerFitData, selectedSize]);

	return <canvas ref={canvasRef} width={width} height={height} className='w-full h-full object-cover' />;
};

function SizeGuide() {
	const { tryonResult, currentProduct, selectedSize } = useProduct();
	const containerRef = useRef<HTMLDivElement>(null);

	const { t } = useTranslation();
	if (!tryonResult || !currentProduct) return null;

	// Use actual image size from tryonResult if available
	const [imageWidth, imageHeight] = tryonResult.imageSize || [800, 600];

	// Only show upper fit data if current product is upper type
	const upperFitData = currentProduct.type === 'upper' ? tryonResult.upperFitData : undefined;
	// Only show lower fit data if current product is lower type
	const lowerFitData = currentProduct.type === 'lower' ? tryonResult.lowerFitData : undefined;

	return (
		<div ref={containerRef} className='absolute inset-0 '>
			<SizeGuideCanvas
				width={imageWidth}
				height={imageHeight}
				imageUrl={tryonResult.tryonImage}
				upperFitData={upperFitData}
				lowerFitData={lowerFitData}
				containerRef={containerRef}
				selectedSize={selectedSize}
			/>
			<div className='absolute bottom-0 left-0 w-fit py-2 px-4 rounded-tr-[16px] border-gradient z-[60px] flex flex-col gap-4 bg-white -translate-y-full'>
				{tryonResult.upperFitData && (
					<div className='flex flex-col gap-[2px]'>
						<p className='font-medium text-[14px] leading-[20px] text-[#808191]'>{t('common.upper')}</p>
						<p className='font-medium text-[14px] leading-[20px] text-dark'>
							{t('common.bestFit', { size: tryonResult.upperFitData.size })}
						</p>
					</div>
				)}
				{tryonResult.lowerFitData && (
					<div className='flex flex-col gap-[2px]'>
						<p className='font-medium text-[14px] leading-[20px] text-[#808191]'>{t('common.lower')}</p>
						<p className='font-medium text-[14px] leading-[20px] text-dark'>
							{t('common.bestFit', { size: tryonResult.lowerFitData.size })}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

export default SizeGuide;
