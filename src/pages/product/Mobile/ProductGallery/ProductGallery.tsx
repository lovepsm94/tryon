import React, { useMemo } from 'react';
import { Swiper, SwiperSlide, useSwiper } from 'swiper/react';
import 'swiper/css';
import { ReactComponent as NextIcon } from '@/assets/next.svg';
import cn from '@/utils/cn';
import { useParams } from 'react-router-dom';
import productData from '@/pages/home/productData.json';

const NextButton = ({ className }: { className?: string }) => {
	const swiper = useSwiper();
	return (
		<div
			className={cn(
				'flex items-center justify-center rounded-full w-10 h-10 text-black-900 bg-white shadow-[0px_8px_16px_0px_#00000009] cursor-pointer',
				className
			)}
			onClick={() => swiper.slideNext()}
		>
			<NextIcon className='w-[18px] h-[18px]' />
		</div>
	);
};

const PrevButton = ({ className }: { className?: string }) => {
	const swiper = useSwiper();
	return (
		<div
			className={cn(
				'flex items-center justify-center rounded-full w-10 h-10 text-black-900 bg-white shadow-[0px_8px_16px_0px_#00000009] cursor-pointer',
				className
			)}
			onClick={() => swiper.slidePrev()}
		>
			<NextIcon className='w-[18px] h-[18px] rotate-180' />
		</div>
	);
};

function ProductGallery() {
	const { id } = useParams();

	const currentProduct = useMemo(() => {
		return productData.find((product) => product.id === Number(id));
	}, [id]);

	if (!currentProduct) return null;

	return (
		<Swiper className='relative h-[457px]' loop slidesPerView={1} spaceBetween={10}>
			<PrevButton className='absolute left-0 top-1/2 -translate-y-1/2 z-40' />
			<NextButton className='absolute right-0 top-1/2 -translate-y-1/2 z-40' />
			{[currentProduct.image, currentProduct.product].map((image) => (
				<SwiperSlide key={image}>
					<img src={image} className='w-full h-full object-contain object-[center_center]' alt='' />
				</SwiperSlide>
			))}
		</Swiper>
	);
}

export default ProductGallery;
