import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import cn from '@/utils/cn';

interface ModalProps {
	isOpen: boolean;
	onClose?: () => void;
	children: React.ReactNode;
	contentClassName?: string;
}

const Modal = ({ isOpen, onClose, children, contentClassName }: ModalProps) => {
	const modalRef = useRef<HTMLDivElement>(null);
	const [isClosing, setIsClosing] = useState(false);
	const [shouldRender, setShouldRender] = useState(false);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setShouldRender(true);
			setIsClosing(false);
			// Trigger fade in after component is mounted
			requestAnimationFrame(() => {
				setIsVisible(true);
			});
		} else {
			// Start fade out animation
			setIsClosing(true);
			setIsVisible(false);

			// Wait for animation to complete before unmounting
			const timer = setTimeout(() => {
				setShouldRender(false);
				setIsClosing(false);
			}, 500); // Match with transition duration

			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	useEffect(() => {
		const handleEsc = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				handleClose();
			}
		};

		if (isVisible) {
			document.addEventListener('keydown', handleEsc);
			document.body.style.overflow = 'hidden';
			// Prevent iOS Safari bounce scroll
			document.body.style.position = 'fixed';
			document.body.style.width = '100%';
			document.body.style.top = `-${window.scrollY}px`;
		}

		return () => {
			document.removeEventListener('keydown', handleEsc);
			// Restore original scroll position and overflow
			const scrollY = document.body.style.top;
			document.body.style.position = '';
			document.body.style.width = '';
			document.body.style.top = '';
			document.body.style.overflow = 'unset';
			window.scrollTo(0, parseInt(scrollY || '0') * -1);
		};
	}, [isVisible]);

	const handleClose = () => {
		if (!onClose) return;
		if (!isClosing) {
			setIsClosing(true);
			setIsVisible(false);
			setTimeout(() => {
				onClose?.();
			}, 500); // Match with transition duration
		}
	};

	const handleBackdropClick = () => {
		handleClose();
	};

	const content: React.ReactNode = (
		<div
			className={cn(
				'fixed inset-0 z-[9000] flex items-center justify-center p-4 transition-opacity duration-500 ease-out',
				isVisible ? 'opacity-100' : 'opacity-0',
				isVisible ? 'pointer-events-auto' : 'pointer-events-none'
			)}
			onClick={handleBackdropClick}
		>
			{/* Backdrop */}
			<div
				className={cn(
					'fixed inset-0 bg-black-900 transition-opacity duration-500 ease-out z-40',
					isVisible ? 'bg-opacity-50' : 'bg-opacity-0'
				)}
			/>

			{/* Modal */}
			<div
				ref={modalRef}
				className={cn(
					'relative bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-auto transform transition-all duration-500 ease-out z-50',
					contentClassName,
					isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
				)}
				role='dialog'
				aria-modal='true'
				onClick={(e) => e.stopPropagation()}
			>
				{children}
			</div>
		</div>
	);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return shouldRender ? createPortal(content as any, document.body) : null;
};

export default Modal;
