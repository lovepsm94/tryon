import { useProduct } from '@/contexts/ProductContext';
import cn from '@/utils/cn';
import { useState } from 'react';

function ProductGallery() {
	const { currentProduct } = useProduct();
	const [selectedImage, setSelectedImage] = useState(currentProduct?.image);
	if (!currentProduct) return null;
	return (
		<div className='w-full aspect-[590/786]'>
			<img src={selectedImage} alt='' className='w-full h-full object-cover object-[center_center]' />
			<div className='grid grid-cols-3 gap-3 mt-5'>
				{[currentProduct.image, currentProduct.product].map((image) => (
					<img
						key={image}
						src={image}
						alt=''
						onClick={() => setSelectedImage(image)}
						className={cn(
							'w-full h-full object-cover object-[center_center] cursor-pointer',
							selectedImage === image && 'border-gradient'
						)}
					/>
				))}
			</div>
		</div>
	);
}

export default ProductGallery;
