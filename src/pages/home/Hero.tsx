import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReactComponent as DemoShop } from '@/assets/demo-shop.svg';

function Hero({ onClickDemoShop }: { onClickDemoShop: () => void }) {
	const { t } = useTranslation();
	return (
		<div className='relative w-full h-[600px] xl:h-[unset] xl:aspect-[106/45] overflow-hidden'>
			<video
				className='w-full h-full object-cover scale-[1.4] xl:scale-100'
				src='/hero.mp4'
				autoPlay
				playsInline
				muted
				loop
			/>
			<div className='text-[36px] md:text-[40px] md:leading-[54px] xl:text-[65px] leading-[48px] xl:leading-[82px] text-white bg-dark/50 absolute inset-0 flex flex-col items-center text-center'>
				<p className='text-center px-4 xl:px-0 md:max-w-[851px] font-medium mt-[150px]'>
					{t('common.bannerTitle')}
				</p>
				<DemoShop
					className='w-[90px] h-[90px] md:w-[142px] md:h-[142px] mt-[30px] md:mt-auto md:mb-[60px] cursor-pointer'
					onClick={onClickDemoShop}
				/>
			</div>
		</div>
	);
}

export default Hero;
