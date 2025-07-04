import TabItem from '@/pages/product/Mobile/ProductTabs/TabItem';
import React from 'react';
import { useTranslation } from 'react-i18next';

function Information() {
	const { t } = useTranslation();
	const information = [
		'生地：デニム',
		'フィットタイプ：ルーズフィット',
		'特徴：調節可能なストラップ',
		'前後にポケット'
	];
	return (
		<TabItem
			label={t('common.information')}
			content={information.map((information, index) => (
				<div key={index} className='flex items-center gap-4'>
					<div className='w-[5px] h-[5px] rounded-full bg-black-900'></div>
					<p className='text-[14px] leading-[22px]'>{information}</p>
				</div>
			))}
		></TabItem>
	);
}

export default Information;
