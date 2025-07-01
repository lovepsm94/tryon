import React from 'react';
import { ReactComponent as StarIcon } from '@/assets/star.svg';
import cn from '@/utils/cn';

function Rating({ rating, className }: { rating: number; className?: string }) {
	return (
		<div className={cn('flex items-center gap-[2px]', className)}>
			{Array.from({ length: rating }).map((_, index) => (
				<StarIcon key={index} className='text-[#FD7E14]' />
			))}
			{Array.from({ length: 5 - rating }).map((_, index) => (
				<StarIcon key={index} className='text-[#807E7E]' />
			))}
		</div>
	);
}

export default Rating;
