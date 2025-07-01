import Rating from '@/components/Rating';
import cn from '@/utils/cn';
import { Link } from 'react-router-dom';

interface ProductItemProps {
	id: number;
	name: string;
	price: number;
	oldPrice: number;
	rating: number;
	image: string;
	showRating?: boolean;
	className?: string;
}

function ProductItem({ id, name, price, oldPrice, rating, image, showRating = true, className }: ProductItemProps) {
	return (
		<Link to={`/product/${id}`} className={cn('text-black-900', className)}>
			<img src={image} alt='' className='w-full' />
			{showRating && (
				<div className='flex items-center gap-[2px] mt-3'>
					<Rating rating={rating} />
				</div>
			)}
			<p className='text-[14px] md:text-[16px] font-medium leading-6 md:leading-7 mt-1'>{name}</p>
			<div className='flex items-center mt-1 gap-3 text-[12px] leading-[20px] md:text-[14px] md:leading-[22px]'>
				<p className='font-semibold'>{`¥${price.toLocaleString('en-US')}`}</p>
				<p className='font-normal text-black-400 line-through'>{`¥${oldPrice.toLocaleString('en-US')}`}</p>
			</div>
		</Link>
	);
}

export default ProductItem;
