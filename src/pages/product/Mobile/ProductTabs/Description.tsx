import TabItem from '@/pages/product/Mobile/ProductTabs/TabItem';
import React from 'react';
import { useTranslation } from 'react-i18next';

function Description() {
	const { t } = useTranslation();
	return (
		<TabItem
			label={t('common.description')}
			content={
				<p className='text-[14px] leading-[22px]'>
					この製品は、高品質なコットン素材で作られており、触り心地が柔らかく、着用時も快適です。シンプルなデザインで、カジュアルながらも独自の印象を与えます。普段使いはもちろん、ストリートファッションや特別な日のコーディネートにもおすすめです。
				</p>
			}
		></TabItem>
	);
}

export default Description;
