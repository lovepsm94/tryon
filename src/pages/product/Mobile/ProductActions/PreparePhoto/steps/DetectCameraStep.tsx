import cn from '@/utils/cn';
import { SensorSmoother } from '@/utils/sensorSmoothing';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const isIOS =
	/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

interface DetectCameraStepProps {
	onStepComplete: () => void;
}

const DetectCameraStep: React.FC<DetectCameraStepProps> = ({ onStepComplete }) => {
	const dotRef = useRef<HTMLDivElement>(null);
	const circleRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const [uprightTime, setUprightTime] = useState(0);
	const [isUpright, setIsUpright] = useState(false);
	const { t } = useTranslation();

	// Initialize sensor smoother with balanced preset
	const sensorSmoother = useRef(
		new SensorSmoother({ alpha: 0.05, deadZone: 0.2, velocityDamping: 0.1, maxVelocity: 10 })
	);

	const handleMotion = useCallback((event: DeviceMotionEvent) => {
		if (event.accelerationIncludingGravity) {
			const { x, y } = event.accelerationIncludingGravity;
			const threshold = 0.5;
			const maxAcceleration = 9.8;

			const rawX = x ?? 0;
			let rawY = y ?? 0;

			if (isIOS) {
				rawY = -rawY;
			}

			// Apply smoothing using the utility class
			const smoothed = sensorSmoother.current.smooth(rawX, rawY, Date.now());

			// If smoothing returns null, skip this update (throttled)
			if (!smoothed) return;

			const dotX = Math.max(-maxAcceleration, Math.min(maxAcceleration, smoothed.x));
			const dotY = Math.max(-maxAcceleration, Math.min(maxAcceleration, smoothed.y));

			if (dotRef.current && containerRef.current && circleRef.current) {
				const containerRect = containerRef.current.getBoundingClientRect();
				const containerWidth = containerRect.width;
				const containerHeight = containerRect.height;
				const dotSize = dotRef.current.getBoundingClientRect().width;
				const circleSize = circleRef.current.getBoundingClientRect().width;

				const calculateXPosition = () => {
					if (Math.abs(dotX) > threshold) {
						if (dotX > 0) {
							const xPercent = (Math.abs(dotX) - maxAcceleration) / (maxAcceleration - threshold) / 100;
							const xPosition =
								((containerWidth - circleSize) / 2) * xPercent * 100 + containerWidth - dotSize;
							return xPosition;
						}
						if (dotX < 0) {
							const xPercent = (maxAcceleration - Math.abs(dotX)) / (maxAcceleration - threshold) / 100;
							const xPosition = (containerWidth / 2 - circleSize / 2) * xPercent * 100;
							return xPosition;
						}
					} else {
						const xPercent = (dotX / threshold) * 100;
						const xPosition = (xPercent / 100) * (circleSize - dotSize) + (containerWidth - dotSize) / 2;
						return xPosition;
					}
				};

				const calculateYPosition = () => {
					if (dotY >= 0) {
						if (maxAcceleration - dotY > threshold) {
							const yPercent = (dotY / (maxAcceleration - threshold)) * 100;
							const yPosition = ((yPercent / 100) * (containerHeight - circleSize)) / 2;
							return yPosition;
						} else {
							const yPercent = ((maxAcceleration - dotY) / threshold) * 100;
							const yPosition =
								containerHeight / 2 - dotSize / 2 - ((yPercent / 100) * (circleSize - dotSize)) / 2;
							return yPosition;
						}
					} else {
						return containerHeight - dotSize;
					}
				};

				const xPosition = calculateXPosition();
				const yPosition = calculateYPosition();

				// Use requestAnimationFrame for smooth DOM updates
				requestAnimationFrame(() => {
					if (dotRef.current) {
						dotRef.current.style.transform = `translate(${xPosition}px, ${yPosition}px)`;
					}
				});
			}

			const isCurrentlyUpright =
				Math.abs(dotX) <= threshold && Math.abs(Math.abs(dotY) - maxAcceleration) <= threshold && dotY > 0;

			setIsUpright(isCurrentlyUpright);
		}
	}, []);

	// Timer effect to track how long the device stays upright
	useEffect(() => {
		if (isUpright) {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}

			timerRef.current = setInterval(() => {
				setUprightTime((prev) => {
					const newTime = prev + 0.1;
					if (newTime >= 2.0) {
						// Complete the step
						onStepComplete();
						return 0;
					}
					return newTime;
				});
			}, 100);
		} else {
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
			setUprightTime(0);
		}

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, [isUpright, onStepComplete]);

	useEffect(() => {
		window.addEventListener('devicemotion', handleMotion);

		return () => {
			window.removeEventListener('devicemotion', handleMotion);
		};
	}, [handleMotion]);

	return (
		<>
			<div className='flex grow relative h-[500px]' ref={containerRef}>
				<div
					className={cn(
						'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[1px] bg-[#808191] z-40',
						isUpright ? 'bg-gradient' : 'bg-[#808191]'
					)}
				/>
				<div
					className={cn(
						'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[250px] w-[1px] bg-[#808191] z-40',
						isUpright ? 'bg-gradient' : 'bg-[#808191]'
					)}
				/>
				<div
					ref={dotRef}
					className={cn(
						'absolute w-[50px] h-[50px] rounded-full transition-all duration-300 ease-out z-50',
						isUpright ? 'bg-gradient' : 'bg-[#444444]'
					)}
				></div>
				<div
					ref={circleRef}
					className={`absolute top-1/2 left-1/2 w-[120px] h-[120px] border-2 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-[30] ${
						isUpright ? 'border-gradient' : 'border-[#808191]'
					}`}
				></div>
			</div>
			{/* Progress bar */}
			<div className='mt-4 text-center'>
				<div className='w-full bg-black-100 rounded-full h-2 mx-auto'>
					<div
						className='bg-gradient h-2 rounded-full transition-all duration-100 ease-out'
						style={{ width: `${(Math.min(uprightTime, 2) / 2) * 100}%` }}
					></div>
				</div>
			</div>
			<p className='text-center text-[#1B1D21] mt-2 mb-4'>
				{t(`getUserModelImage.steps.detectCamera.instruction`)}
			</p>
		</>
	);
};

export default DetectCameraStep;
