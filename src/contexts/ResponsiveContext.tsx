import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ResponsiveContextType {
	isMobile: boolean;
}

const ResponsiveContext = createContext<ResponsiveContextType>({ isMobile: false });

export const useResponsive = () => useContext(ResponsiveContext);

interface ResponsiveProviderProps {
	children: ReactNode;
}

export const ResponsiveProvider = ({ children }: ResponsiveProviderProps) => {
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

	useEffect(() => {
		const checkMobile = () => {
			// md breakpoint is typically 768px
			setIsMobile(window.innerWidth < 768);
		};

		// Check on mount
		checkMobile();

		// Add event listener
		window.addEventListener('resize', checkMobile);

		// Cleanup
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	return <ResponsiveContext.Provider value={{ isMobile }}>{children}</ResponsiveContext.Provider>;
};
