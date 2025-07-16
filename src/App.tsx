import React from 'react';
import { ResponsiveProvider } from '@/contexts/ResponsiveContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import About from '@/pages/About';
import Home from '@/pages/home';
import Men from '@/pages/Men';
import Product from '@/pages/product';
import Women from '@/pages/Women';
import { createBrowserRouter, RouterProvider, ScrollRestoration, Outlet } from 'react-router';
import { initializeApp } from '@/utils/initializeApp';
import AccessDemoModal from '@/components/AccessDemoModal';

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

const AppContent = () => {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return null;
	}

	return (
		<>
			{!isAuthenticated && <AccessDemoModal />}
			<RouterProvider router={router} />
		</>
	);
};

function App() {
	// Initialize app when component mounts
	React.useEffect(() => {
		initializeApp();
	}, []);

	return (
		<AuthProvider>
			<ResponsiveProvider>
				<AppContent />
			</ResponsiveProvider>
		</AuthProvider>
	);
}

export default App;
