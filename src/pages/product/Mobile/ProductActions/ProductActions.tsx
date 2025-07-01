import ChangeCount from '@/pages/product/Mobile/ProductActions/ChangeCount';
import ChangeSize from '@/pages/product/Mobile/ProductActions/ChangeSize';
import ClearPersonData from '@/pages/product/Mobile/ProductActions/ClearPersonData';
import VirtualTryon from '@/pages/product/Mobile/ProductActions/VirtualTryon';

function ProductActions() {
	return (
		<div className='mt-2 pb-[14px] border-b border-black-200'>
			<ChangeSize />
			<ChangeCount />
			<VirtualTryon />
			<ClearPersonData />
		</div>
	);
}

export default ProductActions;
