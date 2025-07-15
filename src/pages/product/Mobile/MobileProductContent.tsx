import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { useProduct } from '@/contexts/ProductContext';
import ConsumerActions from '@/pages/product/Mobile/ConsumerActions';
import ProductActions from '@/pages/product/Mobile/ProductActions';
import ProductGallery, { TryonResult } from '@/pages/product/Mobile/ProductGallery';
import ProductInfo, { ProductSubInfo } from '@/pages/product/Mobile/ProductInfo';
import ProductTabs from '@/pages/product/Mobile/ProductTabs';
import ProductVariants from '@/pages/product/Mobile/ProductVariants';
import RelatedProducts from '@/pages/product/Mobile/RelatedProducts';

function MobileProductContent() {
	const { tryonResult, isLoadingSizeChart, isTryonLoading } = useProduct();
	if (isLoadingSizeChart) return null;

	return (
		<div className='mt-[62px]'>
			<Header textColor='text-dark' />
			<div className='px-4 pb-8'>
				{tryonResult || isTryonLoading ? <TryonResult /> : <ProductGallery />}
				<ProductInfo />
				<ProductActions />
				<ProductVariants />
				<ProductSubInfo />
				<ConsumerActions />
				<ProductTabs />
				<RelatedProducts />
			</div>
			<Footer />
		</div>
	);
}

export default MobileProductContent;
