import { PoseImageReader, PoseValidationZone } from './poseImageReader';

export const SIDE_POSE_VALIDATION_ZONES: PoseValidationZone[] = [
	{
		colors: [[1, 1, 1]],
		keypointIndices: [6], // right_shoulder
		name: 'shoulder'
	},
	{
		colors: [
			[4, 4, 4],
			[3, 3, 3]
		], // hip can be either color
		keypointIndices: [12], // right_hip
		name: 'hip'
	},
	{
		colors: [[3, 3, 3]],
		keypointIndices: [10], // right_wrist
		name: 'wrist'
	},
	{
		colors: [[6, 6, 6]],
		keypointIndices: [16], // right_ankle
		name: 'ankle'
	}
];

export const FRONT_POSE_VALIDATION_ZONES: PoseValidationZone[] = [
	{
		colors: [[1, 1, 1]],
		keypointIndices: [5, 6], // right_shoulder, left_shoulder
		name: 'shoulder'
	},
	{
		colors: [
			[4, 4, 4],
			[3, 3, 3],
			[2, 2, 2]
		], // hip can be either color
		keypointIndices: [11, 12], // right_hip, left_hip
		name: 'hip'
	},
	{
		colors: [[2, 2, 2]],
		keypointIndices: [9], // left_wrist
		name: 'left_wrist'
	},
	{
		colors: [[3, 3, 3]],
		keypointIndices: [10], // right_wrist
		name: 'right_wrist'
	},
	{
		colors: [[5, 5, 5]],
		keypointIndices: [15], // left_ankle
		name: 'left_ankle'
	},
	{
		colors: [[6, 6, 6]],
		keypointIndices: [16], // right_ankle
		name: 'right_ankle'
	}
];

export class PoseImageProcessor {
	private imageReader: PoseImageReader | null = null;
	private canvasWidth = 0;
	private canvasHeight = 0;
	private poseValidationZones: PoseValidationZone[] = [];
	private imagePath = '';

	constructor(
		canvasWidth: number,
		canvasHeight: number,
		poseValidationZones: PoseValidationZone[],
		imagePath: string
	) {
		this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;
		this.poseValidationZones = poseValidationZones;
		this.imagePath = imagePath;
	}

	async loadPoseImage(): Promise<void> {
		try {
			console.log('Loading pose image using binary reader from:', this.imagePath);

			this.imageReader = new PoseImageReader(this.poseValidationZones, this.imagePath);
			await this.imageReader.loadPoseImage();

			// Verify that the image was loaded successfully
			const imageInfo = this.imageReader.getImageInfo();
			if (imageInfo) {
				console.log(
					'Pose image binary data loaded successfully, dimensions:',
					imageInfo.width,
					'x',
					imageInfo.height
				);
			} else {
				console.error('Pose image loaded but imageInfo is null');
			}
		} catch (error) {
			console.error('Failed to load pose image:', error);
			throw error;
		}
	}

	// Check if pose image is loaded
	isPoseImageLoaded(): boolean {
		return this.imageReader !== null && this.imageReader.getImageInfo() !== null;
	}

	private getPixelColor(videoX: number, videoY: number): [number, number, number] | null {
		if (!this.imageReader) {
			return null;
		}

		const imageInfo = this.imageReader.getImageInfo();
		if (!imageInfo) {
			return null;
		}

		// Convert video coordinates to pose image coordinates
		const poseImageCoords = this.convertVideoToPoseImageCoordinates(videoX, videoY);
		if (!poseImageCoords) {
			return null;
		}

		const color = this.imageReader.getPixelColor(poseImageCoords.x, poseImageCoords.y);

		return color;
	}

	private convertVideoToPoseImageCoordinates(videoX: number, videoY: number): { x: number; y: number } | null {
		if (!this.imageReader) {
			return null;
		}

		const imageInfo = this.imageReader.getImageInfo();
		if (!imageInfo) {
			return null;
		}

		// Calculate scale to make pose image height 80% of canvas height
		const scale = (this.canvasHeight * 0.8) / imageInfo.height;
		const scaledWidth = imageInfo.width * scale;
		const offsetX = (this.canvasWidth - scaledWidth) / 2;
		const offsetY = (this.canvasHeight - imageInfo.height * scale) / 2;

		// Convert from video coordinates to pose image coordinates
		// Note: Video is mirrored, so we need to flip the X coordinate back
		const imageX = (this.canvasWidth - videoX - offsetX) / scale;
		const imageY = (videoY - offsetY) / scale;

		// Check if coordinates are within image bounds
		if (imageX < 0 || imageX >= imageInfo.width || imageY < 0 || imageY >= imageInfo.height) {
			return null;
		}

		return { x: imageX, y: imageY };
	}

	private isColorMatch(color1: [number, number, number], color2: [number, number, number]): boolean {
		return color1[0] === color2[0] && color1[1] === color2[1] && color1[2] === color2[2];
	}

	validateKeypoint(keypoint: { x: number; y: number }, zone: PoseValidationZone): boolean {
		const pixelColor = this.getPixelColor(Math.round(keypoint.x), Math.round(keypoint.y));
		if (!pixelColor) {
			console.log(`No pixel color found for keypoint at (${keypoint.x}, ${keypoint.y}) in zone ${zone.name}`);
			return false;
		}

		// Check if pixel color matches any of the zone colors
		const colorMatch = zone.colors.some((color) => this.isColorMatch(pixelColor, color));
		if (colorMatch) {
			console.log('Color match for zone', zone.name);
			return true;
		}

		console.log(
			`Color mismatch for zone ${zone.name}: got [${pixelColor.join(', ')}], expected one of [${zone.colors.map((c) => c.join(', ')).join(' or')}]`
		);
		return false;
	}

	validatePose(keypoints: Array<{ x: number; y: number; score?: number }>): boolean {
		if (!this.imageReader) {
			console.error('Pose image not loaded - imageReader is null');
			return false;
		}

		const imageInfo = this.imageReader.getImageInfo();
		if (!imageInfo) {
			console.error('Pose image not loaded - imageInfo is null');
			return false;
		}

		// // Check if all required keypoints exist and have good scores
		// const requiredKeypoints = [5, 6, 9, 10, 11, 12, 15, 16];
		// const allKeypointsExist = requiredKeypoints.every((index) => {
		// 	const keypoint = keypoints[index];
		// 	return keypoint && keypoint.score;
		// });

		// if (!allKeypointsExist) {
		// 	console.log('Not all required keypoints exist or have good scores');
		// 	return false;
		// }

		// Validate each zone
		for (const zone of this.poseValidationZones) {
			const zoneValid = zone.keypointIndices.every((keypointIndex) => {
				const keypoint = keypoints[keypointIndex];
				if (!keypoint) return false;

				const isValid = this.validateKeypoint(keypoint, zone);
				if (!isValid) {
					console.log(`Zone ${zone.name} (keypoint ${keypointIndex}) failed validation`);
				}
				return isValid;
			});

			console.log('zoneValid', zoneValid);

			if (!zoneValid) {
				return false;
			}
		}

		console.log('All pose validation zones passed');
		return true;
	}

	// Method to get validation zones for debugging/visualization
	getValidationZones(): PoseValidationZone[] {
		return this.poseValidationZones;
	}

	// Cleanup method to terminate the worker
	cleanup(): void {
		if (this.imageReader) {
			this.imageReader.cleanup();
		}
	}

	// Convert pose image coordinates to real video coordinates
	convertPoseImageToVideoCoordinates(imageX: number, imageY: number): { x: number; y: number } | null {
		if (!this.imageReader) {
			return null;
		}

		const imageInfo = this.imageReader.getImageInfo();
		if (!imageInfo) {
			return null;
		}

		// Calculate scale to make pose image height 80% of canvas height
		const scale = (this.canvasHeight * 0.8) / imageInfo.height;
		const scaledWidth = imageInfo.width * scale;
		const offsetX = (this.canvasWidth - scaledWidth) / 2;
		const offsetY = (this.canvasHeight - imageInfo.height * scale) / 2;

		// Convert from pose image coordinates to video coordinates
		// Note: Video is mirrored, so we need to flip the X coordinate
		const videoX = this.canvasWidth - (imageX * scale + offsetX);
		const videoY = imageY * scale + offsetY;

		return { x: videoX, y: videoY };
	}

	// Draw all validation zones in different colors for better distinction
	drawAllValidationZones(ctx: CanvasRenderingContext2D): void {
		if (!this.imageReader) {
			console.warn('Pose image not loaded, cannot draw validation zones');
			return;
		}

		const zones = this.imageReader.getValidationZoneCoordinates();

		console.log('Validation zones to draw:', zones);

		// Define different colors for each zone
		const zoneColors = {
			shoulder: { fill: 'rgba(255, 0, 0, 0.8)', stroke: 'rgba(255, 0, 0, 1)' }, // Red
			hip: { fill: 'rgba(0, 255, 0, 0.8)', stroke: 'rgba(0, 255, 0, 1)' }, // Green
			wrist: { fill: 'rgba(0, 0, 255, 0.8)', stroke: 'rgba(0, 0, 255, 1)' }, // Blue
			ankle: { fill: 'rgba(255, 255, 0, 0.8)', stroke: 'rgba(255, 255, 0, 1)' }, // Yellow
			left_wrist: { fill: 'rgba(255, 0, 255, 0.8)', stroke: 'rgba(255, 0, 255, 1)' }, // Magenta
			right_wrist: { fill: 'rgba(0, 255, 255, 0.8)', stroke: 'rgba(0, 255, 255, 1)' }, // Cyan
			left_ankle: { fill: 'rgba(255, 165, 0, 0.8)', stroke: 'rgba(255, 165, 0, 1)' }, // Orange
			right_ankle: { fill: 'rgba(128, 0, 128, 0.8)', stroke: 'rgba(128, 0, 128, 1)' } // Purple
		};

		ctx.lineWidth = 1;

		// Draw each validation zone
		Object.entries(zones).forEach(([zoneName, pixels]) => {
			if (pixels.length === 0) {
				console.log(`No pixels found for zone: ${zoneName}`);
				return;
			}

			// Get color for this zone, default to red if not defined
			const colors = zoneColors[zoneName as keyof typeof zoneColors] || zoneColors.shoulder;
			ctx.fillStyle = colors.fill;
			ctx.strokeStyle = colors.stroke;

			console.log(`Drawing ${pixels.length} pixels for zone: ${zoneName} with color ${colors.fill}`);

			// Draw each pixel in the zone
			pixels.forEach((pixel, index) => {
				const videoCoords = this.convertPoseImageToVideoCoordinates(pixel.x, pixel.y);
				if (videoCoords) {
					// Draw a larger rectangle for each pixel to make it more visible
					const pixelSize = 8; // Increased size for better visibility
					ctx.fillRect(videoCoords.x - pixelSize / 2, videoCoords.y - pixelSize / 2, pixelSize, pixelSize);
					ctx.strokeRect(videoCoords.x - pixelSize / 2, videoCoords.y - pixelSize / 2, pixelSize, pixelSize);

					// Log first few pixels for debugging
					if (index < 5) {
						console.log(
							`Pixel ${index}: image(${pixel.x}, ${pixel.y}) -> video(${videoCoords.x}, ${videoCoords.y})`
						);
					}
				} else {
					console.log(`Failed to convert coordinates for pixel (${pixel.x}, ${pixel.y}) in zone ${zoneName}`);
				}
			});
		});

		console.log('All validation zones drawn with different colors');
	}
}
