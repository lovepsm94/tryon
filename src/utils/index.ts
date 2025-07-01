export * from './cn';
export * from './sensorSmoothing';

/**
 * Check if the device supports motion sensors
 * @returns Promise<boolean> - true if device supports motion sensors, false otherwise
 */
export const checkMotionSensorSupport = (): Promise<boolean> => {
	return new Promise((resolve) => {
		// Check if DeviceMotionEvent is available
		if (!('DeviceMotionEvent' in window)) {
			resolve(false);
			return;
		}

		// For iOS, we need to request permission first
		if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
			(DeviceMotionEvent as any)
				.requestPermission()
				.then((permissionState: string) => {
					if (permissionState === 'granted') {
						checkMotionData(resolve);
					} else {
						resolve(false);
					}
				})
				.catch(() => {
					alert('Permission denied');
					// resolve(false);
				});
		} else {
			// For non-iOS devices, try to add a listener directly
			checkMotionData(resolve);
		}
	});
};

/**
 * Helper function to check for actual motion data
 */
const checkMotionData = (resolve: (value: boolean) => void) => {
	let readings: Array<{ x: number; y: number; z: number; timestamp: number }> = [];
	let hasValidData = false;

	const tempHandler = (event: DeviceMotionEvent) => {
		if (event.accelerationIncludingGravity) {
			const { x, y, z } = event.accelerationIncludingGravity;
			const timestamp = Date.now();

			// Check if we have valid acceleration data (not null/undefined)
			if (x !== null && y !== null && z !== null && !isNaN(x) && !isNaN(y) && !isNaN(z)) {
				readings.push({ x, y, z, timestamp });
				hasValidData = true;

				// Keep only recent readings (last 0.1 second)
				readings = readings.filter((reading) => timestamp - reading.timestamp < 100);

				// Check if we have enough readings and they show variation
				if (readings.length >= 3) {
					const xValues = readings.map((r) => r.x);
					const yValues = readings.map((r) => r.y);
					const zValues = readings.map((r) => r.z);

					// Calculate variance to see if values are changing
					const xVariance = calculateVariance(xValues);
					const yVariance = calculateVariance(yValues);
					const zVariance = calculateVariance(zValues);

					// If we have significant variation, it's likely a real sensor
					if (xVariance > 0.1 || yVariance > 0.1 || zVariance > 0.1) {
						window.removeEventListener('devicemotion', tempHandler);
						resolve(true);
						return;
					}
				}
			}
		}
	};

	window.addEventListener('devicemotion', tempHandler);

	// Timeout after 0.1 second
	setTimeout(() => {
		window.removeEventListener('devicemotion', tempHandler);
		// Only resolve true if we had valid data and some variation
		resolve(hasValidData && readings.length >= 2);
	}, 100);
};

/**
 * Calculate variance of an array of numbers
 */
const calculateVariance = (values: number[]): number => {
	if (values.length < 2) return 0;

	const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
	const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
	const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

	return variance;
};

export const updateFontFamily = (language: 'en' | 'ja') => {
	const root = document.documentElement;
	if (language === 'ja') {
		root.style.setProperty('--font-family', "'Noto Sans', 'Noto Sans JP'");
		root.style.setProperty('--language-switch-font', "'Be Vietnam Pro'");
	} else {
		root.style.setProperty('--font-family', "'Be Vietnam Pro'");
		root.style.setProperty('--language-switch-font', "'Noto Sans', 'Noto Sans JP'");
	}
};
