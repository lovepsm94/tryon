import ProductItem from '@/pages/home/ProductItem';
import React from 'react';
import productData from './productData.json';
import cn from '@/utils/cn';

const Products = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement> & { category?: 'men' | 'women' }>(
	({ className, category, ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={cn(
					'px-4 md:px-[52px] py-[48px] md:py-[76px] grid grid-cols-2 md:grid-cols-4 gap-6 bg-white',
					className
				)}
				{...props}
			>
				{productData
					.filter((product) => (category ? product.category === category : true))
					.map((product) => (
						<ProductItem key={product.name} {...product} />
					))}
			</div>
		);
	}
);

Products.displayName = 'Products';

export default Products;
