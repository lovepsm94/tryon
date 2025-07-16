import { ReactComponent as CloseIcon } from '@/assets/close.svg';
import Switch from '@/components/ui/Switch';
import { useProduct } from '@/contexts/ProductContext';
import SizeGuide from '@/pages/product/Mobile/ProductGallery/SizeGuide';
import TryonMaskLoading from '@/pages/product/Mobile/ProductGallery/TryonMaskLoading';
import { useTranslation } from 'react-i18next';

interface TryonResultProps {
	onClose?: () => void;
}

function TryonResult({ onClose }: TryonResultProps) {
	const { t } = useTranslation();
	const {
		tryonResult,
		setTryonResult,
		isTryonLoading,
		isShowSizeGuide,
		tryonImage,
		setIsShowSizeGuide,
		setSelectedSize,
		currentProduct
	} = useProduct();

	const bestFitSize = (() => {
		if (!tryonResult || !currentProduct) return null;
		const upperFitData = tryonResult.upperFitData;
		const lowerFitData = tryonResult.lowerFitData;
		const upperBestFitSize = upperFitData?.size;
		const lowerBestFitSize = lowerFitData?.size;
		if (currentProduct?.type === 'upper') {
			return upperBestFitSize;
		} else {
			return lowerBestFitSize;
		}
	})();

	const handleClose = () => {
		setIsShowSizeGuide(false);
		setTryonResult(null);
		onClose?.();
	};

	const handleHideSizeGuide = () => {
		setIsShowSizeGuide(false);
		setSelectedSize(bestFitSize || null);
	};

	const handleShowSizeGuide = () => {
		setIsShowSizeGuide(true);
		setSelectedSize(bestFitSize || null);
	};

	return (
		<div className='relative h-[550px] md:h-full bg-gray-50 overflow-hidden'>
			{/* Header with close button */}
			<div className='absolute top-4 right-4 z-50'>
				<button
					onClick={handleClose}
					className='flex items-center justify-center w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors'
				>
					<CloseIcon className='w-5 h-5' />
				</button>
			</div>

			{/* Tryon result image */}
			{(tryonResult?.tryonImage || tryonImage) && (
				<div className='w-full h-full'>
					<img
						src={tryonResult?.tryonImage || tryonImage || ''}
						alt={t('common.virtualTryOn')}
						className='w-full h-full object-cover object-center'
					/>
				</div>
			)}
			{isShowSizeGuide && <SizeGuide />}

			{/* Loading overlay */}
			{isTryonLoading && <TryonMaskLoading />}

			{tryonResult && !isTryonLoading && (
				<div
					className='absolute bottom-4 right-4 p-[6px] md:p-2 z-20 bg-white text-dark cursor-pointer flex gap-2 items-center rounded-xl'
					onClick={isShowSizeGuide ? handleHideSizeGuide : handleShowSizeGuide}
				>
					<p className='text-[12px] md:text-[14px] font-semibold'>{t('common.sizeGuide')}</p>
					<Switch value={isShowSizeGuide} />
				</div>
			)}
		</div>
	);
}

export default TryonResult;
