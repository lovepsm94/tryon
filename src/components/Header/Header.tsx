import MobileHeader from '@/components/Header/MobileHeader';
import PCHeader from '@/components/Header/PCHeader';
import { useResponsive } from '@/contexts/ResponsiveContext';
import React from 'react';

interface HeaderProps {
	textColor?: string;
}

function Header({ textColor }: HeaderProps) {
	const { isMobile } = useResponsive();
	return isMobile ? <MobileHeader textColor={textColor} /> : <PCHeader textColor={textColor} />;
}

export default Header;
