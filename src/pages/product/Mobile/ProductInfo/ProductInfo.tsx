import React, { useMemo } from 'react';
import Rating from '@/components/Rating';
import { useParams } from 'react-router-dom';
import productData from '@/pages/home/productData.json';
import { useTranslation } from 'react-i18next';

const description =
	'この製品は、高品質なコットン素材で作られており、触り心地が柔らかく、着用時も快適です。シンプルなデザインで、カジュアルながらも独自の印象を与えます。普段使いはもちろん、ストリートファッションや特別な日のコーディネートにもおすすめです。';

const reviews = 2;

function ProductInfo() {
	const { id } = useParams();
	const { t } = useTranslation();

	const currentProduct = useMemo(() => {
		return productData.find((product) => product.id === Number(id));
	}, [id]);

	if (!currentProduct) return null;

	return (
		<div className='border-b border-black-200 pb-2'>
			<p className='font-medium text-[30px] md:text-[34px] leading-[38px] mt-4 md:mt-0 text-black-900'>
				{currentProduct.name}
			</p>
			<div className='flex items-center mt-1 gap-2'>
				<Rating rating={currentProduct.rating} />
				<p className='text-[12px] leading-[18px] text-black-600'>{t('common.review', { count: reviews })}</p>
			</div>
			<p className='text-[14px] leading-5 text-[#3E3E59] mt-2 md:mt-3'>{description}</p>

			<div className='flex items-center mt-2 gap-3'>
				<p className='text-[24px] md:text-[26px] leading-[32px] md:leading-[40px] text-black-900 font-medium'>{`¥${currentProduct.price.toLocaleString('en-US')}`}</p>
				<p className='text-[16px] leading-[24px] md:leading-[26px] text-black-400 line-through'>
					{`¥${currentProduct.oldPrice.toLocaleString('en-US')}`}
				</p>
			</div>
		</div>
	);
}

export default ProductInfo;
