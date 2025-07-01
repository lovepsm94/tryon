import React, { useMemo, useState } from 'react';
import Description from './Description';
import Information from './Information';
import Reviews from './Reviews';
import cn from '@/utils/cn';
import { useTranslation } from 'react-i18next';

function ProductTabs() {
	const [activeTab, setActiveTab] = useState(0);
	const [fade, setFade] = useState(true);
	const { t } = useTranslation();

	const tabs = useMemo(
		() => [
			{ label: t('common.description'), component: <Description /> },
			{ label: t('common.information'), component: <Information /> },
			{ label: t('common.reviews', { count: 2 }), component: <Reviews /> }
		],
		[t]
	);

	const handleTabChange = (idx: number) => {
		if (idx === activeTab) return;
		setFade(false);
		setTimeout(() => {
			setActiveTab(idx);
			setFade(true);
		}, 200);
	};

	return (
		<div className='flex gap-8 mt-12 pb-8 border-b border-black-200'>
			<div className='flex w-[200px] flex-col gap-6 text-left shrink-0'>
				{tabs.map((tab, idx) => (
					<div
						key={tab.label}
						className={cn(
							'text-[20px] leading-[28px] font-medium text-black-900 hover:text-black-900 cursor-pointer relative px-2 group',
							idx === activeTab ? 'text-black-900' : 'text-black-500'
						)}
						onClick={() => handleTabChange(idx)}
					>
						<p className='relative z-10 w-fit'>
							{tab.label}
							<span
								className={cn(
									'block h-[2px] w-full absolute left-0 -bottom-1 origin-left transition-transform duration-300 bg-black-900',
									idx === activeTab ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
								)}
							/>
						</p>
					</div>
				))}
			</div>
			<div
				className={cn(
					'transition-opacity duration-300 text-[#3E3E59]',
					fade ? 'opacity-100' : 'opacity-0 pointer-events-none'
				)}
			>
				{tabs[activeTab].component}
			</div>
		</div>
	);
}

export default ProductTabs;
