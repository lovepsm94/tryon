import { useEffect, useRef, useState } from 'react';

interface UseWebcamReturn {
	videoRef: React.RefObject<HTMLVideoElement>;
	isLoading: boolean;
	error: string | null;
	startCamera: () => Promise<void>;
	stopCamera: () => void;
}

function requestCamera(constraints: MediaStreamConstraints = { video: true, audio: false }) {
	return new Promise((resolve, reject) => {
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices.getUserMedia(constraints).then(resolve).catch(reject);
		} else {
			const navAny = navigator as any;
			const getUserMedia =
				navAny.getUserMedia || navAny.webkitGetUserMedia || navAny.mozGetUserMedia || navAny.msGetUserMedia;
			if (getUserMedia) {
				getUserMedia.call(navigator, constraints, resolve, reject);
			} else {
				reject(new Error('getUserMedia is not supported in this browser.'));
			}
		}
	});
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
					width: { ideal: 1920, min: 1280 },
					height: { ideal: 1080, min: 720 },
					frameRate: { ideal: 30, min: 24 },
					aspectRatio: { ideal: 16 / 9 }
				},
				audio: false
			};

			const stream = (await requestCamera(constraints)) as MediaStream;
			streamRef.current = stream;
			if ('srcObject' in videoRef.current) {
				videoRef.current.srcObject = stream;
			} else {
				(videoRef.current as any).src = window.URL.createObjectURL(stream as any);
			}
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
