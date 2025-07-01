import React from 'react';
import { useTranslation } from 'react-i18next';
import { useProduct } from '@/contexts/ProductContext';
import { ReactComponent as CloseIcon } from '@/assets/close.svg';
import { TryonLoading } from '@/components/ui';

interface TryonResultProps {
	onClose?: () => void;
}

function TryonResult({ onClose }: TryonResultProps) {
	const { t } = useTranslation();
	const { tryonResultImage, setTryonResultImage, isTryonLoading } = useProduct();

	const handleClose = () => {
		setTryonResultImage(null);
		onClose?.();
	};

	if (!tryonResultImage) return null;

	return (
		<div className='relative h-[457px] md:h-full bg-gray-50 rounded-lg overflow-hidden'>
			{/* Header with close button */}
			<div className='absolute top-4 right-4 z-10'>
				<button
					onClick={handleClose}
					className='flex items-center justify-center w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors'
				>
					<CloseIcon className='w-5 h-5' />
				</button>
			</div>

			{/* Tryon result image */}
			<div className='w-full h-full flex items-center justify-center'>
				<img
					src={tryonResultImage}
					alt={t('common.virtualTryOn')}
					className='w-full h-full object-cover object-center'
				/>
			</div>

			{/* Loading overlay */}
			{isTryonLoading && (
				<div className='absolute inset-0 bg-gradient opacity-90 flex items-center justify-center z-20'></div>
			)}
			{isTryonLoading && (
				<div className='absolute inset-0 rounded-lg p-6 flex flex-col items-center gap-4 justify-center text-white z-30'>
					<TryonLoading isLoading={true} />
					<p className='text-gray-700 font-medium text-center'>{t('common.processingYourVirtualTryOn')}</p>
				</div>
			)}
		</div>
	);
}

export default TryonResult;
