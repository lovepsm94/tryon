import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Hero from '@/pages/home/Hero';
import Products from '@/pages/home/Products';
import { useRef } from 'react';

function Home() {
	const productsRef = useRef<HTMLDivElement>(null);
	return (
		<div className='w-full'>
			<Header />
			<Hero onClickDemoShop={() => productsRef.current?.scrollIntoView({ behavior: 'smooth' })} />
			<Products ref={productsRef} className='scroll-mt-[62px] md:scroll-mt-[68px]' />
			<Footer />
		</div>
	);
}

export default Home;
