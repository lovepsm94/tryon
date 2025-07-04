import { ResponsiveProvider } from '@/contexts/ResponsiveContext';
import About from '@/pages/About';
import Home from '@/pages/home';
import Men from '@/pages/Men';
import Product from '@/pages/product';
import Women from '@/pages/Women';
import { createBrowserRouter, RouterProvider, ScrollRestoration, Outlet } from 'react-router';

const RootLayout = () => (
	<>
		<ScrollRestoration />
		<Outlet />
	</>
);

const router = createBrowserRouter([
	{
		path: '/',
		element: <RootLayout />,
		children: [
			{
				index: true,
				element: <Home />
			},
			{
				path: 'about',
				element: <About />
			},
			{
				path: 'product/:id',
				element: <Product />
			},
			{
				path: 'men',
				element: <Men />
			},
			{
				path: 'women',
				element: <Women />
			}
		]
	}
]);

function App() {
	console.log('qưeqwe');
	return (
		<ResponsiveProvider>
			<RouterProvider router={router} />
		</ResponsiveProvider>
	);
}

export default App;
