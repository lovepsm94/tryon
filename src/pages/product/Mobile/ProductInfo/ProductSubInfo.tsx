import React from 'react';
import { useTranslation } from 'react-i18next';

const productSubInfo = {
	sku: 'PTS-002',
	category: 'Pants',
	tags: ['Loose', 'Modern', 'Sale', 'Denim']
};

function ProductSubInfo() {
	const { t } = useTranslation();
	return (
		<div className='flex flex-col gap-2 mt-6 pb-6 border-b border-black-200'>
			<div className='flex items-center'>
				<p className='w-[120px] text-black-500 text-[12px] leading-[20px] uppercase'>{t('common.sku')}</p>
				<p className='text-[12px] leading-[20px] text-black-900'>{productSubInfo.sku}</p>
			</div>
			<div className='flex items-center'>
				<p className='w-[120px] text-black-500 text-[12px] leading-[20px] uppercase'>{t('common.category')}</p>
				<p className='text-[12px] leading-[20px] text-black-900'>{productSubInfo.category}</p>
			</div>
			<div className='flex items-center'>
				<p className='w-[120px] text-black-500 text-[12px] leading-[20px] uppercase'>{t('common.tags')}</p>
				<p className='text-[12px] leading-[20px] text-black-900'>{productSubInfo.tags.join(', ')}</p>
			</div>
		</div>
	);
}

export default ProductSubInfo;
