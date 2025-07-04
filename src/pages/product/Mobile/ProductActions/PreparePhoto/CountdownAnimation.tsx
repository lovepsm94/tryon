import React, { useState, useEffect } from 'react';

interface CountdownAnimationProps {
	initialCount?: number;
	onComplete?: () => void;
	className?: string;
	showRestartButton?: boolean;
	onRestart?: () => void;
	onCheckShow?: () => void;
}

const CountdownAnimation: React.FC<CountdownAnimationProps> = ({
	initialCount = 3,
	onComplete,
	className = '',
	onCheckShow
}) => {
	const [count, setCount] = useState(initialCount);
	const [isComplete, setIsComplete] = useState(false);
	const [showCheck, setShowCheck] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);
	const [fadeOut, setFadeOut] = useState(false);

	useEffect(() => {
		if (count > 0) {
			// Reset progress to 0 at the start of each count

			const timer = setTimeout(() => {
				setIsAnimating(true);
				setTimeout(() => {
					setCount((prev) => prev - 1);
					setIsAnimating(false);
				}, 300);
			}, 1000);
			return () => clearTimeout(timer);
		} else {
			setTimeout(() => {
				setIsComplete(true);
				setShowCheck(true);
				// Call onCheckShow callback when check mark starts showing
				if (onCheckShow) {
					onCheckShow();
				}
				// Start fade out after 1 second
				setTimeout(() => {
					setFadeOut(true);
					// Hide everything after fade animation completes
					setTimeout(() => {
						setShowCheck(false);
						// Call onComplete callback
						if (onComplete) {
							onComplete();
						}
					}, 800);
				}, 1000);
			}, 1000);
		}
	}, [count]);

	return (
		<>
			<div className='absolute inset-0 flex items-center justify-center z-50'>
				<div
					className={`relative w-64 h-64 flex items-center justify-center transition-all duration-700 ease-out ${className} ${
						fadeOut ? 'opacity-0 scale-75 blur-sm' : 'opacity-100 scale-100 blur-0'
					}`}
				>
					{/* Outer Circle */}
					<div
						className={`absolute w-[156px] h-[156px] rounded-full border-[6px] transition-all duration-700 ease-out ${
							isComplete ? 'border-[#4FBF67] shadow-lg scale-125' : 'border-white/80 shadow-lg'
						} ${fadeOut ? 'animate-pulse' : ''}`}
						style={{
							backdropFilter: 'blur(20px)'
						}}
					/>

					{/* Content */}
					<div className='relative z-10 flex items-center justify-center'>
						{!isComplete ? (
							<span
								className={`text-[94px] font-medium text-white transition-all duration-300 ease-out ${
									isAnimating ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
								}`}
								style={{
									textShadow: '0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(255, 255, 255, 0.3)',
									filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
								}}
							>
								{count}
							</span>
						) : showCheck ? (
							<div className='relative'>
								{/* Checkmark */}
								<svg
									className='w-20 h-20 text-[#4FBF67] animate-ping'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
									style={{
										filter: 'drop-shadow(0 0 20px rgba(79, 191, 103, 0.6))',
										animation: 'checkmarkDraw 0.8s ease-out 0.2s both'
									}}
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={3}
										d='M5 13l4 4L19 7'
										style={{
											strokeDasharray: '24',
											strokeDashoffset: showCheck ? '0' : '24',
											animation: showCheck ? 'checkmarkDraw 0.8s ease-out 0.2s both' : 'none'
										}}
									/>
								</svg>

								{/* Success glow effect */}
								<div
									className='absolute inset-0 rounded-full animate-ping'
									style={{
										background:
											'radial-gradient(circle, rgba(74, 222, 128, 0.4) 0%, transparent 70%)',
										animation: showCheck ? 'successPulse 1.5s ease-out' : 'none'
									}}
								/>
							</div>
						) : null}
					</div>
				</div>
			</div>

			<style>{`
				@keyframes checkmarkDraw {
					to {
						stroke-dashoffset: 0;
					}
				}

				@keyframes successPulse {
					0% {
						transform: scale(0.8);
						opacity: 0.8;
					}
					50% {
						transform: scale(1.2);
						opacity: 0.4;
					}
					100% {
						transform: scale(1.4);
						opacity: 0;
					}
				}
			`}</style>
		</>
	);
};

export default CountdownAnimation;
