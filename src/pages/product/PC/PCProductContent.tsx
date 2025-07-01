import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { useProduct } from '@/contexts/ProductContext';
import ConsumerActions from '@/pages/product/Mobile/ConsumerActions';
import ProductActions from '@/pages/product/Mobile/ProductActions';
import { TryonResult } from '@/pages/product/Mobile/ProductGallery';
import ProductInfo, { ProductSubInfo } from '@/pages/product/Mobile/ProductInfo';
import ProductVariants from '@/pages/product/Mobile/ProductVariants';
import RelatedProducts from '@/pages/product/Mobile/RelatedProducts';
import ProductGallery from '@/pages/product/PC/ProductGallery';
import ProductTabs from '@/pages/product/PC/ProductTabs';

function PCProductContent() {
	const { tryonResultImage } = useProduct();

	return (
		<>
			<div className='md:px-6 lg:px-10 xl:px-[166px] md:py-6 lg:py-[52px]  mt-[68px]'>
				<Header textColor='text-dark' />
				<div className='flex md:gap-8 lg:gap-[72px]'>
					<div className='w-1/2 max-w-[700px] shrink-0'>
						{tryonResultImage ? <TryonResult /> : <ProductGallery />}
					</div>
					<div className='grow min-w-0'>
						<ProductInfo />
						<ProductActions />
						<ProductVariants />
						<ProductSubInfo />
						<ConsumerActions />
					</div>
				</div>
				<ProductTabs />
				<RelatedProducts />
			</div>

			<Footer />
		</>
	);
}

export default PCProductContent;
