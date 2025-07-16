export interface PoseValidationZone {
	colors: [number, number, number][];
	keypointIndices: number[];
	name: string;
}

export interface PixelData {
	x: number;
	y: number;
	color: [number, number, number];
}

export interface PoseImageInfo {
	width: number;
	height: number;
	pixelMap: Map<string, PixelData>;
}

export class PoseImageReader {
	private imageData: PoseImageInfo | null = null;
	private poseValidationZones: PoseValidationZone[] = [];
	private imagePath = '';

	constructor(poseValidationZones: PoseValidationZone[], imagePath: string) {
		this.poseValidationZones = poseValidationZones;
		this.imagePath = imagePath;
	}

	async loadPoseImage(): Promise<void> {
		try {
			console.log('Loading pose image binary data from:', this.imagePath);

			// Load image data in main thread
			const imageData = await this.loadPoseImageInMainThread();

			this.imageData = imageData;

			console.log('Pose image binary data loaded successfully');
			console.log('Total pixels extracted:', imageData.pixelMap.size);
		} catch (error) {
			console.error('Failed to load pose image binary data:', error);
			throw error;
		}
	}

	getPixelColor(x: number, y: number): [number, number, number] | null {
		if (!this.imageData) {
			return null;
		}

		const key = `${Math.round(x)},${Math.round(y)}`;
		const pixel = this.imageData.pixelMap.get(key);
		return pixel ? pixel.color : null;
	}

	getAllPixels(): PixelData[] {
		return this.imageData ? Array.from(this.imageData.pixelMap.values()) : [];
	}

	getImageInfo(): { width: number; height: number } | null {
		if (!this.imageData) {
			return null;
		}
		return {
			width: this.imageData.width,
			height: this.imageData.height
		};
	}

	// Get pixels with specific colors (for validation zones)
	getPixelsByColor(targetColor: [number, number, number]): PixelData[] {
		if (!this.imageData) {
			return [];
		}

		const result: PixelData[] = [];
		this.imageData.pixelMap.forEach((pixel) => {
			if (
				pixel.color[0] === targetColor[0] &&
				pixel.color[1] === targetColor[1] &&
				pixel.color[2] === targetColor[2]
			) {
				result.push(pixel);
			}
		});
		return result;
	}

	// Get validation zone coordinates
	getValidationZoneCoordinates(): {
		[key: string]: PixelData[];
	} {
		const result: { [key: string]: PixelData[] } = {};
		this.poseValidationZones.forEach((zone) => {
			result[zone.name] = [];
			zone.colors.forEach((color) => {
				result[zone.name].push(...this.getPixelsByColor(color));
			});
		});
		return result;
	}

	// Get all unique colors in the image
	getUniqueColors(): [number, number, number][] {
		if (!this.imageData) {
			return [];
		}

		const colorSet = new Set<string>();
		const colors: [number, number, number][] = [];

		this.imageData.pixelMap.forEach((pixel: PixelData) => {
			const colorKey = `${pixel.color[0]},${pixel.color[1]},${pixel.color[2]}`;
			if (!colorSet.has(colorKey)) {
				colorSet.add(colorKey);
				colors.push(pixel.color);
			}
		});

		return colors.sort((a, b) => {
			// Sort by brightness
			const brightnessA = a[0] + a[1] + a[2];
			const brightnessB = b[0] + b[1] + b[2];
			return brightnessA - brightnessB;
		});
	}

	private async loadPoseImageInMainThread(): Promise<PoseImageInfo> {
		console.log('Loading pose image in main thread from:', this.imagePath);

		const response = await fetch(this.imagePath);
		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
		}

		const arrayBuffer = await response.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);

		// Parse PNG header to get image dimensions
		const imageInfo = this.parsePNGHeader(uint8Array);
		if (!imageInfo) {
			throw new Error('Failed to parse PNG header');
		}

		console.log('PNG dimensions:', imageInfo.width, 'x', imageInfo.height);

		// Extract pixel data using a more complete PNG decoder
		const pixelMap = await this.decodePNGData(uint8Array, imageInfo.width, imageInfo.height);

		return {
			width: imageInfo.width,
			height: imageInfo.height,
			pixelMap
		};
	}

	private parsePNGHeader(data: Uint8Array): { width: number; height: number } | null {
		// PNG signature: 89 50 4E 47 0D 0A 1A 0A
		const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

		for (let i = 0; i < pngSignature.length; i++) {
			if (data[i] !== pngSignature[i]) {
				console.error('Invalid PNG signature');
				return null;
			}
		}

		// IHDR chunk contains width and height (bytes 16-23)
		// Width: bytes 16-19 (big endian)
		// Height: bytes 20-23 (big endian)
		const width = (data[16] << 24) | (data[17] << 16) | (data[18] << 8) | data[19];
		const height = (data[20] << 24) | (data[21] << 16) | (data[22] << 8) | data[23];

		return { width, height };
	}

	private async decodePNGData(data: Uint8Array, width: number, height: number): Promise<Map<string, PixelData>> {
		const pixelMap = new Map<string, PixelData>();

		// Create a temporary canvas to decode the PNG data
		// This is the most reliable way to get pixel data from PNG
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Could not get canvas context');
		}

		// Create ImageBitmap from the binary data
		const blob = new Blob([data], { type: 'image/png' });
		const imageBitmap = await createImageBitmap(blob);

		canvas.width = imageBitmap.width;
		canvas.height = imageBitmap.height;
		ctx.drawImage(imageBitmap, 0, 0);

		// Get pixel data
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		// Convert to our PixelData format
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const index = (y * width + x) * 4;
				const r = imageData.data[index];
				const g = imageData.data[index + 1];
				const b = imageData.data[index + 2];
				const a = imageData.data[index + 3];

				// Only include non-transparent pixels
				if (a > 0) {
					const key = `${Math.round(x)},${Math.round(y)}`;
					pixelMap.set(key, {
						x,
						y,
						color: [r, g, b]
					});
				}
			}
		}

		return pixelMap;
	}

	// Cleanup method
	cleanup(): void {
		// No cleanup needed for main thread processing
	}
}
