import React from 'react';

interface TryonLoadingProps {
	size?: number;
	className?: string;
	isLoading?: boolean;
}

const TryonLoading: React.FC<TryonLoadingProps> = ({ size = 24, className = '', isLoading = false }) => {
	return (
		<>
			{isLoading && (
				<style>
					{`
						@keyframes rotate-y {
							0% {
								transform: rotateY(0deg);
							}
							25% {
								transform: rotateY(90deg);
							}
							50% {
								transform: rotateY(180deg);
							}
							75% {
								transform: rotateY(270deg);
							}
							100% {
								transform: rotateY(360deg);
							}
						}

						@keyframes rotate-y-reverse {
							0% {
								transform: rotateY(360deg);
							}
							25% {
								transform: rotateY(270deg);
							}
							50% {
								transform: rotateY(180deg);
							}
							75% {
								transform: rotateY(90deg);
							}
							100% {
								transform: rotateY(0deg);
							}
						}

						.tryon-big-star {
							animation: rotate-y 3s ease-in-out infinite;
							transform-origin: center;
							transform-style: preserve-3d;
						}

						.tryon-small-star {
							animation: rotate-y-reverse 0.9s ease-in-out infinite;
							transform-origin: center;
						}
					`}
				</style>
			)}
			<div className={`inline-block ${className}`}>
				<svg width={size} height={size} viewBox='0 0 22 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path
						d='M7.94464 3.70496C8.58721 1.82454 11.1854 1.76759 11.9473 3.53411L12.0117 3.70604L12.8789 6.24192C13.0776 6.82348 13.3987 7.35567 13.8206 7.80258C14.2425 8.24949 14.7553 8.60073 15.3245 8.8326L15.5577 8.91963L18.0935 9.7857C19.974 10.4283 20.0309 13.0265 18.2655 13.7883L18.0935 13.8528L15.5577 14.7199C14.9759 14.9185 14.4435 15.2396 13.9964 15.6615C13.5493 16.0834 13.1979 16.5963 12.9659 17.1655L12.8789 17.3976L12.0128 19.9346C11.3702 21.815 8.77203 21.872 8.01126 20.1065L7.94464 19.9346L7.07858 17.3987C6.87998 16.8169 6.55891 16.2845 6.13701 15.8374C5.71512 15.3903 5.20223 15.0389 4.63296 14.807L4.40086 14.7199L1.86498 13.8539C-0.0165127 13.2113 -0.0734623 10.6131 1.69306 9.85232L1.86498 9.7857L4.40086 8.91963C4.98243 8.72091 5.51462 8.39977 5.96153 7.97789C6.40843 7.556 6.75967 7.04318 6.99154 6.47401L7.07858 6.24192L7.94464 3.70496Z'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						className={isLoading ? 'tryon-big-star' : ''}
					/>

					<path
						d='M18.5749 1.94153e-07C18.7759 -2.53558e-07 18.9729 0.0563892 19.1435 0.16276C19.3141 0.269131 19.4514 0.421217 19.5398 0.601734L19.5914 0.727454L19.9675 1.82992L21.071 2.206C21.2725 2.27444 21.4491 2.40115 21.5785 2.57007C21.7078 2.73898 21.7841 2.9425 21.7977 3.15483C21.8113 3.36716 21.7615 3.57874 21.6547 3.76276C21.548 3.94678 21.3889 4.09495 21.1978 4.1885L21.071 4.24008L19.9686 4.61616L19.5925 5.7197C19.5239 5.92109 19.3971 6.09761 19.2282 6.22686C19.0592 6.35612 18.8556 6.43231 18.6433 6.44578C18.431 6.45924 18.2194 6.40937 18.0355 6.3025C17.8515 6.19562 17.7035 6.03654 17.61 5.84542L17.5584 5.7197L17.1823 4.61723L16.0788 4.24115C15.8773 4.17271 15.7007 4.046 15.5714 3.87708C15.442 3.70817 15.3657 3.50465 15.3521 3.29232C15.3385 3.07999 15.3883 2.86841 15.4951 2.68439C15.6019 2.50037 15.7609 2.3522 15.952 2.25865L16.0788 2.20707L17.1813 1.83099L17.5573 0.727454C17.6298 0.515155 17.7669 0.330856 17.9494 0.200398C18.1319 0.0699398 18.3506 -0.000134618 18.5749 1.94153e-07Z'
						fill='currentColor'
						className={isLoading ? 'tryon-small-star' : ''}
					/>
				</svg>
			</div>
		</>
	);
};

export default TryonLoading;
