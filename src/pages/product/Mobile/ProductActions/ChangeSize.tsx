import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import cn from '@/utils/cn';

const sizes = ['S', 'M', 'L', 'XL', '2XL'];

const SizeItem = ({ size, isSelected, onClick }: { size: string; isSelected: boolean; onClick: () => void }) => {
	return (
		<div
			className={cn(
				'py-[4px] md:py-[8px] min-w-[36px] px-[10px] md:min-w-[40px] md:px-[15px] bg-white items-center justify-center text-black-900 cursor-pointer flex border-2 border-[transparent]',
				isSelected && 'text-gradient border-gradient rounded'
			)}
			onClick={onClick}
		>
			<p className='text-gradient'>{size}</p>
		</div>
	);
};

function ChangeSize() {
	const { t } = useTranslation();
	const [selectedSize, setSelectedSize] = useState<(typeof sizes)[number]>('M');
	return (
		<div className='pb-4'>
			<p className='font-semibold text-[14px] leading-[20px] text-black-600'>{t('common.size')}</p>
			<div className='flex items-center gap-2 mt-3'>
				{sizes.map((size) => (
					<SizeItem
						key={size}
						size={size}
						isSelected={selectedSize === size}
						onClick={() => setSelectedSize(size)}
					/>
				))}
			</div>
		</div>
	);
}

export default ChangeSize;
