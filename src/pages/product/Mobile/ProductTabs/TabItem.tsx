import React, { useState } from 'react';
import { ReactComponent as ArrowDownIcon } from '@/assets/arrow-down.svg';
import cn from '@/utils/cn';

interface TabItemProps {
	label: string;
	content: React.ReactNode;
}

function TabItem({ label, content }: TabItemProps) {
	const [isActive, setIsActive] = useState(false);

	return (
		<div>
			<div
				className={cn(
					'flex items-center justify-between cursor-pointer text-black-900 pt-[20px] pb-[12px] border-b border-black-200 transition-all duration-500 ease-in-out',
					isActive && 'border-black-900'
				)}
				onClick={() => setIsActive(!isActive)}
			>
				<p className='text-[18px] leading-[32px] font-medium'>{label}</p>
				<ArrowDownIcon
					className={cn('w-6 h-6 transition-transform duration-500 ease-in-out', isActive && 'rotate-180')}
				/>
			</div>
			<div
				className={cn(
					'overflow-hidden transition-all duration-500 ease-in-out',
					isActive ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
				)}
			>
				<div className='pt-4 text-[#3E3E59]'>{content}</div>
			</div>
		</div>
	);
}

export default TabItem;
