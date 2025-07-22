import { useProduct } from '@/contexts/ProductContext';
import cn from '@/utils/cn';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const SizeItem = ({
	size,
	isSelected,
	onClick,
	disabled,
	isRecommended
}: {
	size: string;
	isSelected: boolean;
	onClick: () => void;
	disabled?: boolean;
	isRecommended?: boolean;
}) => {
	return (
		<div
			className={cn(
				'min-w-[36px] md:min-w-[40px] bg-white items-center justify-center text-black-900 cursor-pointer flex border-2 border-[transparent] border-black-300',
				disabled && 'cursor-default',
				isRecommended && 'border-gradient',
				isSelected && !isRecommended && 'border-[#064EF7]'
			)}
			onClick={disabled ? undefined : onClick}
		>
			<div
				className={cn(
					'flex items-center justify-center py-[4px] px-[10px] md:py-[8px] md:px-[15px]',
					isSelected && 'bg-[#064EF7] text-white'
				)}
			>
				<p>{size}</p>
			</div>
		</div>
	);
};

function ChangeSize() {
	const { t } = useTranslation();
	const { selectedSize, setSelectedSize, currentProduct, tryonResult } = useProduct();

	const [sizes, setSizes] = useState<string[]>([]);

	const handleSelectSize = (size: string) => {
		setSelectedSize(size);
	};

	useEffect(() => {
		if (!currentProduct) return;
		const sizeChart = currentProduct.sizeChart;
		if (!sizeChart) return;
		sizeChart
			.text()
			.then((text) => {
				const lines = text.split('\n');
				// Skip header row and extract size names
				const sizeNames = lines
					.slice(1)
					.map((line) => {
						const columns = line.split(',');
						return columns[0]; // First column contains size names
					})
					.filter((size) => size && size.trim()); // Filter out empty lines
				setSizes(sizeNames);
			})
			.catch((error) => {
				console.error('Error reading size chart:', error);
				setSizes([]);
			});
	}, [currentProduct]);

	if (!currentProduct) return null;

	return (
		<div className='pb-4'>
			<p className='font-semibold text-[14px] leading-[20px] text-black-600'>{t('common.size')}</p>
			<div className='flex items-center gap-2 mt-3 flex-wrap'>
				{sizes.map((size) => (
					<SizeItem
						key={size}
						size={size}
						isRecommended={(() => {
							if (currentProduct.type === 'upper') return tryonResult?.upperFitData?.size === size;
							return tryonResult?.lowerFitData?.size === size;
						})()}
						isSelected={selectedSize === size}
						onClick={() => handleSelectSize(size)}
					/>
				))}
			</div>
		</div>
	);
}

export default ChangeSize;
