export interface Point {
	x: number;
	y: number;
}

export interface EllipseParams {
	centerX: number;
	centerY: number;
	radiusX: number;
	radiusY: number;
	angle: number;
}

/**
 * Apply uniform glow effect with consistent opacity, blur and width
 * @param ctx Canvas rendering context
 * @param path Path2D object to draw
 * @param scale Scale factor for line width
 */
export function applyGlowEffect(ctx: CanvasRenderingContext2D, path: Path2D) {
	const baseWidth = 3;
	const layers = 20; // Number of layers to create smooth blur effect

	// Create multiple layers with increasing opacity from outside to inside
	for (let i = layers - 1; i >= 0; i--) {
		ctx.save();
		const progress = i / (layers - 1);
		const width = baseWidth + baseWidth * 5 * (1 - progress); // From baseWidth to baseWidth * 4
		const opacity = 0.002 + 0.008 * progress;

		ctx.globalAlpha = opacity;
		ctx.strokeStyle = '#65FFED';
		ctx.lineWidth = width;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.stroke(path);
		ctx.restore();
	}

	// Draw main line with full opacity
	ctx.save();
	ctx.globalAlpha = 1.0;
	ctx.strokeStyle = '#65FFED';
	ctx.lineWidth = baseWidth;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.stroke(path);
	ctx.restore();
}

/**
 * Convert coordinates from data to canvas coordinates
 */
export function convertDataPointsToCanvas(
	dataPoints: Record<string, number[][]>,
	imageSize: [number, number],
	canvasSize: [number, number]
): { paths: Point[][]; measurementTypes: string[] } {
	const [imageWidth, imageHeight] = imageSize;
	const [canvasWidth, canvasHeight] = canvasSize;
	const paths: Point[][] = [];
	const measurementTypes: string[] = [];

	// Process each measurement type (Shoulder, Sleeve, Width for upper; Waist, Hip, Inseam for lower)
	Object.entries(dataPoints).forEach(([type, measurementPoints]) => {
		if (Array.isArray(measurementPoints) && measurementPoints.length > 0) {
			const path: Point[] = [];
			measurementPoints.forEach((point: number[]) => {
				if (point.length >= 2) {
					// Convert from image coordinates to canvas coordinates
					const x = (point[0] / imageWidth) * canvasWidth;
					const y = (point[1] / imageHeight) * canvasHeight;
					path.push({ x, y });
				}
			});
			if (path.length > 0) {
				paths.push(path);
				measurementTypes.push(type);
			}
		}
	});

	return { paths, measurementTypes };
}

/**
 * Calculate total length of the path
 */
export function calculatePathLength(points: Point[]): number {
	let totalLength = 0;
	for (let i = 0; i < points.length - 1; i++) {
		const dx = points[i + 1].x - points[i].x;
		const dy = points[i + 1].y - points[i].y;
		totalLength += Math.sqrt(dx * dx + dy * dy);
	}
	return totalLength;
}

/**
 * Calculate ellipse parameters from 2 focal points
 */
export function calculateEllipseFromFoci(points: Point[]): EllipseParams | null {
	if (points.length !== 2) return null;

	const [f1, f2] = points;

	// Calculate distance between 2 focal points
	const distance = Math.sqrt((f2.x - f1.x) ** 2 + (f2.y - f1.y) ** 2);

	// Center of ellipse is midpoint of 2 focal points
	const centerX = (f1.x + f2.x) / 2;
	const centerY = (f1.y + f2.y) / 2;

	const majorAxis = distance; // 2a
	const minorAxis = distance * 0.2; // 2b - make it flatter

	// Calculate ellipse rotation angle
	const angle = Math.atan2(f2.y - f1.y, f2.x - f1.x);

	return {
		centerX,
		centerY,
		radiusX: majorAxis / 2,
		radiusY: minorAxis / 2,
		angle
	};
}

/**
 * Draw ellipse with multi-layer glow effect
 */
export function drawEllipse(ctx: CanvasRenderingContext2D, points: Point[], progress: number) {
	if (progress <= 0 || points.length !== 2) return;

	const ellipse = calculateEllipseFromFoci(points);
	if (!ellipse) return;

	const { centerX, centerY, radiusX, radiusY, angle } = ellipse;

	// Calculate end angle based on progress (from left to right, bottom half only)
	const startAngle = 0; // Start from right point (0 degrees)
	const endAngle = Math.PI * progress; // End at left point (180 degrees)
	const maxEndAngle = Math.PI; // Maximum limit is 180 degrees (left point)

	const actualEndAngle = Math.min(endAngle, maxEndAngle);

	// Create ellipse path
	const ellipsePath = new Path2D();
	ellipsePath.ellipse(centerX, centerY, radiusX, radiusY, angle, startAngle, actualEndAngle);

	// Apply glow effect
	applyGlowEffect(ctx, ellipsePath);
}

/**
 * Draw line with multi-layer glow effect
 */
export function drawLine(ctx: CanvasRenderingContext2D, points: Point[], progress: number) {
	if (progress <= 0 || points.length < 2) return;

	// Create path for current line
	const linePath = new Path2D();
	linePath.moveTo(points[0].x, points[0].y);

	let currentLength = 0;
	const totalLength = calculatePathLength(points);
	const targetLength = totalLength * progress;

	for (let i = 0; i < points.length - 1; i++) {
		const dx = points[i + 1].x - points[i].x;
		const dy = points[i + 1].y - points[i].y;
		const segmentLength = Math.sqrt(dx * dx + dy * dy);

		if (currentLength + segmentLength <= targetLength) {
			linePath.lineTo(points[i + 1].x, points[i + 1].y);
		} else {
			const segmentProgress = (targetLength - currentLength) / segmentLength;
			const endX = points[i].x + dx * segmentProgress;
			const endY = points[i].y + dy * segmentProgress;
			linePath.lineTo(endX, endY);
			break;
		}
		currentLength += segmentLength;
	}

	// Apply glow effect
	applyGlowEffect(ctx, linePath);
}

/**
 * Draw a box with gradient and text
 */
export function drawBox(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
	label: string,
	value: string,
	scale = 1,
	isMobile = true
) {
	// Box background: linear-gradient
	const angleRad = (77.19 * Math.PI) / 180;
	const gradX = x + Math.cos(angleRad) * width;
	const gradY = y + Math.sin(angleRad) * height;
	const bgGrad = ctx.createLinearGradient(x, y, gradX, gradY);
	bgGrad.addColorStop(0.0984, 'rgba(182, 183, 255, 0.4)');
	bgGrad.addColorStop(0.9992, 'rgba(255, 255, 255, 0.4)');

	ctx.save();
	ctx.fillStyle = bgGrad;
	ctx.beginPath();
	ctx.moveTo(x, y + radius);
	ctx.arcTo(x, y, x + width, y, radius);
	ctx.arcTo(x + width, y, x + width, y + height, radius);
	ctx.arcTo(x + width, y + height, x, y + height, radius);
	ctx.arcTo(x, y + height, x, y, radius);
	ctx.closePath();
	ctx.fill();

	// Box border: linear-gradient from #65FFED to #37A6F0
	const borderGrad = ctx.createLinearGradient(x + width, y + height, x, y);
	borderGrad.addColorStop(0, '#65FFED');
	borderGrad.addColorStop(1, '#37A6F0');
	ctx.strokeStyle = borderGrad;
	ctx.lineWidth = 2;
	ctx.stroke();

	// Draw text with scaled font size
	ctx.textAlign = 'center';
	ctx.fillStyle = '#1B1D21B2';
	ctx.font = `${10 / scale}px Be Vietnam Pro`;
	const labelOffset = isMobile ? 6 : 7; // 6px for mobile, 12px for PC
	ctx.fillText(label, x + width / 2, y + height / 2 - labelOffset / scale);
	ctx.fillStyle = '#1B1D21';
	ctx.font = `${14 / scale}px Be Vietnam Pro`;
	const valueOffset = isMobile ? 14 : 15; // 14px for mobile, 20px for PC
	ctx.fillText(value, x + width / 2, y + height / 2 + valueOffset / scale);
	ctx.restore();
}

/**
 * Draw connecting line between path and box
 */
export function drawConnectingLine(
	ctx: CanvasRenderingContext2D,
	startPoint: Point,
	boxX: number,
	boxY: number,
	boxWidth: number,
	boxHeight: number,
	isUpper: boolean,
	connectorLength = 24,
	scale = 1
) {
	const yBox = boxY + boxHeight / 2; // Center of box vertically
	let xBox, joint;

	// Calculate scaled connector length to achieve desired display size
	const scaledConnectorLength = connectorLength / scale;

	if (isUpper) {
		// For upper fit data: connect from right side
		xBox = boxX + boxWidth; // Right edge of box
		joint = { x: xBox + scaledConnectorLength, y: yBox };
	} else {
		// For lower fit data: connect from left side
		xBox = boxX; // Left edge of box
		joint = { x: xBox - scaledConnectorLength, y: yBox };
	}

	ctx.save();
	ctx.strokeStyle = '#37A6F0';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(startPoint.x, startPoint.y);
	ctx.lineTo(joint.x, joint.y);
	ctx.lineTo(xBox, yBox);
	ctx.stroke();
	ctx.restore();
}
