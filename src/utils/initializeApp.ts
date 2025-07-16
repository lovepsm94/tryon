/**
 * Initialize app-wide utilities and caches
 */
export function initializeApp(): void {
	// Check webcam availability without requesting permissions
	async function checkWebcamAvailability(): Promise<{ available: boolean; state: string }> {
		try {
			// Check if getUserMedia is supported
			if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
				return { available: false, state: 'unsupported' };
			}

			// Enumerate devices to check for video input devices
			const devices = await navigator.mediaDevices.enumerateDevices();
			console.log(devices);
			const videoDevices = devices.filter((device) => device.kind === 'videoinput');
			console.log(videoDevices, 'videoDevices');

			if (videoDevices.length === 0) {
				return { available: false, state: 'no-devices' };
			}

			// Check camera permission status using permissions API
			let permissionState = 'prompt'; // default state
			try {
				const permissionResult = await navigator.permissions.query({ name: 'camera' as PermissionName });
				permissionState = permissionResult.state; // 'granted', 'denied', or 'prompt'
				console.log('Camera permission state:', permissionState);
			} catch (permissionError) {
				console.warn('Permissions API not supported, falling back to device labels');
				// Fallback: check if we have permission by looking at device labels
				const hasPermission = videoDevices.some((device) => device.label && device.label.length > 0);
				permissionState = hasPermission ? 'granted' : 'denied';
			}

			return {
				available: true,
				state: permissionState // Only permission states: 'granted', 'denied', 'prompt'
			};
		} catch (error) {
			console.warn('Could not enumerate devices:', error);
			return { available: false, state: 'error' };
		}
	}

	// Main initialization flow
	async function startInitialization(): Promise<void> {
		console.log('Checking webcam availability...');

		const webcamStatus = await checkWebcamAvailability();
		console.log('Webcam status:', webcamStatus);

		if (webcamStatus.available) {
			// When available is true, state will be a permission state
			switch (webcamStatus.state) {
				case 'granted':
					console.log('Webcam is available and permission granted');
					break;
				case 'denied':
					console.log('Webcam detected but permission denied');
					break;
				case 'prompt':
					console.log('Webcam detected but permission not requested');
					break;
				default:
					console.log('Webcam detected with unknown permission state:', webcamStatus.state);
			}
		} else {
			// When available is false, state indicates why webcam is not available
			switch (webcamStatus.state) {
				case 'no-devices':
					console.log('No webcam detected');
					break;
				case 'unsupported':
					console.log('Media devices not supported');
					break;
				case 'error':
					console.log('Error checking webcam availability');
					break;
				default:
					console.log('Unknown webcam status:', webcamStatus.state);
			}
		}

		console.log('App initialized');
	}

	// Start the initialization
	startInitialization();
}
