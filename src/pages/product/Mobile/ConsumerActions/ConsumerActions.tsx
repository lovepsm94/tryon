import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReactComponent as HeartIcon } from '@/assets/heart.svg';
import { ReactComponent as HelpIcon } from '@/assets/help.svg';
import { ReactComponent as ShareIcon } from '@/assets/share.svg';

function ConsumerActions() {
	const { t } = useTranslation();
	return (
		<div className='flex items-center gap-8 mt-5 pb-[20px] text-black-900'>
			<div className='flex items-center gap-1'>
				<HeartIcon className='w-[18px] h-[18px]' />
				<p className='font-medium text-[14px] leading-[20px]'>{t('common.wishlist')}</p>
			</div>
			<div className='flex items-center gap-1'>
				<HelpIcon className='w-[18px] h-[18px]' />
				<p className='font-medium text-[14px] leading-[20px]'>{t('common.askQuestion')}</p>
			</div>
			<div className='flex items-center gap-1'>
				<ShareIcon className='w-[18px] h-[18px]' />
				<p className='font-medium text-[14px] leading-[20px]'>{t('common.share')}</p>
			</div>
		</div>
	);
}

export default ConsumerActions;
