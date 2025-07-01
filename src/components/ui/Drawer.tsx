import { ReactNode, useEffect, useState, TouchEvent } from 'react';
import cn from '@/utils/cn';

interface DrawerProps {
	isOpen?: boolean;
	onClose: () => void;
	children?: ReactNode;
	showOverlay?: boolean;
	contentClassName?: string;
}

const Drawer = ({ isOpen, onClose, contentClassName, children, showOverlay = true }: DrawerProps) => {
	const [touchStart, setTouchStart] = useState<number | null>(null);
	const [touchY, setTouchY] = useState(0);
	const [isClosing, setIsClosing] = useState(false);
	const [lastTouchY, setLastTouchY] = useState(0);
	const [lastTouchTime, setLastTouchTime] = useState(0);
	const SWIPE_THRESHOLD = 300;
	const VELOCITY_THRESHOLD = 0.5; // pixels per millisecond

	useEffect(() => {
		if (isOpen) {
			// style html and body to overflow hidden
			document.body.style.overflow = 'hidden';
			setIsClosing(false);
		} else {
			document.body.style.overflow = 'unset';
		}

		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

	const handleTouchStart = (e: TouchEvent) => {
		setTouchStart(e.touches[0].clientY);
		setLastTouchY(e.touches[0].clientY);
		setLastTouchTime(Date.now());
	};

	const handleTouchMove = (e: TouchEvent) => {
		if (touchStart === null) return;

		const currentTouch = e.touches[0].clientY;
		const currentTime = Date.now();
		const diff = currentTouch - touchStart;
		// const velocity = (currentTouch - lastTouchY) / (currentTime - lastTouchTime);

		// Only allow downward swipe
		if (diff > 0) {
			setTouchY(diff);
		}

		setLastTouchY(currentTouch);
		setLastTouchTime(currentTime);
	};

	const handleTouchEnd = () => {
		const currentTime = Date.now();
		const velocity = (lastTouchY - (touchStart || 0)) / (currentTime - lastTouchTime);

		if (touchY > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
			setIsClosing(true);
			setTimeout(() => {
				onClose();
			}, 300); // Match with transition duration
		} else {
			// Reset position if not swiped enough
			setTouchY(0);
		}
		setTouchStart(null);
		setTouchY(0);
	};

	const handleClose = () => {
		setIsClosing(true);
		setTimeout(() => {
			onClose();
		}, 300);
	};

	return (
		<>
			<div
				className={cn(
					'fixed inset-0 bg-dark z-40 transition-all duration-300 ease-out',
					isOpen ? 'bg-opacity-50 visible' : 'bg-opacity-0 invisible',
					showOverlay ? 'bg-opacity-50' : 'bg-opacity-0'
				)}
				onClick={handleClose}
			/>

			<div
				className={cn(
					'fixed bottom-0 left-0 w-full bg-white shadow-2xl z-50 transform transition-all duration-300 ease-out rounded-t-2xl',
					contentClassName,
					isOpen && !isClosing ? 'translate-y-0 opacity-100' : 'translate-y-full'
				)}
				style={{
					transform: isOpen && !isClosing ? `translateY(${touchY}px)` : 'translateY(100%)',
					transition: touchStart !== null ? 'none' : 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
				}}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				<div className='overflow-y-auto h-full'>{children}</div>
			</div>
		</>
	);
};

export default Drawer;
