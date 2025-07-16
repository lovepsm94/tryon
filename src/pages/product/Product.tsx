import { ProductProvider } from '@/contexts/ProductContext';
import { useResponsive } from '@/contexts/ResponsiveContext';
import CameraPoseButton from '@/pages/product/CameraPoseButton';
import MobileProductContent from '@/pages/product/Mobile';
import PCProductContent from '@/pages/product/PC';

function Product() {
	const { isMobile } = useResponsive();

	return (
		<>
			<ProductProvider>
				{isMobile ? <MobileProductContent /> : <PCProductContent />}
				<CameraPoseButton />
			</ProductProvider>
		</>
	);
}

export default Product;
