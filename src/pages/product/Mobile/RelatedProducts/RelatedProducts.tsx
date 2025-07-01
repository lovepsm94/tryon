import { useProduct } from '@/contexts/ProductContext';
import productData from '@/pages/home/productData.json';
import ProductItem from '@/pages/home/ProductItem';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';

function RelatedProducts() {
	const { t } = useTranslation();
	const { id } = useParams();
	const { currentProduct } = useProduct();
	return (
		<div className='mt-6'>
			<p className='text-[26px] leading-[38px] font-medium text-black-900'>{t('common.youMightAlsoLike')}</p>

			<div className='mt-4 md:mt-8'>
				<Swiper spaceBetween={16} slidesPerView='auto' className='h-full'>
					{productData
						.filter((product) => product.id !== Number(id) && product.category === currentProduct?.category)
						.map((product, index) => (
							<SwiperSlide key={index} className='!w-[auto]'>
								<ProductItem
									{...product}
									className='w-[160px] md:w-[220px] overflow-hidden inline-block'
								/>
							</SwiperSlide>
						))}
				</Swiper>
			</div>
		</div>
	);
}

export default RelatedProducts;
