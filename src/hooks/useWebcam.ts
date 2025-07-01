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
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: 'user'
				}
			});

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
