import { useEffect, useRef, useState } from 'react';

interface UseWebcamReturn {
	videoRef: React.RefObject<HTMLVideoElement>;
	isLoading: boolean;
	error: string | null;
	startCamera: () => Promise<void>;
	stopCamera: () => void;
}

export const useWebcam = (): UseWebcamReturn => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const startCamera = async () => {
		if (!videoRef.current) return;

		setIsLoading(true);
		setError(null);

		try {
			const constraints = {
				video: {
					facingMode: 'user',
					// Request highest possible resolution
					width: { ideal: 1920, min: 1280 },
					height: { ideal: 1080, min: 720 },
					// Request highest possible frame rate for better quality
					frameRate: { ideal: 30, min: 24 },
					// Request high quality video
					aspectRatio: { ideal: 16 / 9 }
				}
			};

			const stream = await navigator.mediaDevices.getUserMedia(constraints);

			streamRef.current = stream;
			videoRef.current.srcObject = stream;
			videoRef.current.style.transform = 'scaleX(-1)';

			await videoRef.current.play();
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
			setError(errorMessage);
			console.error('Camera access error:', err);
		} finally {
			setIsLoading(false);
		}
	};

	const stopCamera = () => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null;
			videoRef.current.style.transform = '';
		}
	};

	useEffect(() => {
		return () => {
			stopCamera();
		};
	}, []);

	return {
		videoRef,
		isLoading,
		error,
		startCamera,
		stopCamera
	};
};
