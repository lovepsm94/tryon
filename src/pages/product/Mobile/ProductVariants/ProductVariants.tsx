import { Product, useProduct } from '@/contexts/ProductContext';
import productData from '@/pages/home/productData.json';
import cn from '@/utils/cn';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import 'swiper/css';
import { Swiper, SwiperSlide } from 'swiper/react';

function ProductVariants() {
	const { t } = useTranslation();
	const { currentProduct, selectedVariant, setSelectedVariant } = useProduct();

	const variants = useMemo(() => {
		if (!currentProduct) return [];

		return productData.filter(
			(product) =>
				product.id !== currentProduct.id &&
				product.category === currentProduct.category &&
				product.type !== currentProduct.type
		) as Product[];
	}, [currentProduct]);

	const handleVariantClick = (variant: Product) => {
		setSelectedVariant(selectedVariant?.id === variant.id ? null : variant);
	};

	return (
		<div className='mt-4'>
			<p className='text-[14px] leading-[26px] text-black-900 mb-4'>{t('common.productVariantsTitle')}</p>
			<div className='pb-4 border-b border-black-200'>
				<Swiper slidesPerView='auto' spaceBetween={8}>
					{variants.map((variant, index) => (
						<SwiperSlide key={index} className='!w-auto'>
							<div
								className={cn(
									'w-[140px] h-[200px] flex items-center justify-center cursor-pointer overflow-hidden',
									selectedVariant?.id === variant.id && 'border-2 border-gradient'
								)}
								onClick={() => handleVariantClick(variant)}
							>
								<img
									src={variant.product}
									alt={`Variant ${index + 1}`}
									className='!max-h-full h-full w-full object-cover max-w-[unset]'
								/>
							</div>
						</SwiperSlide>
					))}
				</Swiper>
			</div>
		</div>
	);
}

export default ProductVariants;
