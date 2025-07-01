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
					At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
					deleniti atque corrupti quos dolores et quas molestias excepturi sint non providen.
				</p>
			}
		></TabItem>
	);
}

export default Description;
