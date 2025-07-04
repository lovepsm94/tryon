import { ReactComponent as BagIcon } from '@/assets/bag.svg';
import { ReactComponent as Logo } from '@/assets/logo.svg';
import { ReactComponent as Search } from '@/assets/search.svg';
import LanguageSwitch from '@/components/LanguageSwitch';
import { paths } from '@/routes';
import cn from '@/utils/cn';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
	textColor?: string;
}

function Header({ textColor }: HeaderProps) {
	const { t } = useTranslation();
	const [isScrolled, setIsScrolled] = useState(false);
	const location = useLocation();
	const isHome = location.pathname === paths.home;
	const isMen = location.pathname === paths.men;
	const isWomen = location.pathname === paths.women;
	const navigate = useNavigate();

	useEffect(() => {
		const handleScroll = () => {
			const scrollTop = window.scrollY;
			setIsScrolled(scrollTop > 0);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<div
			className={cn(
				'h-[68px] px-[52px] flex items-center justify-between fixed top-0 left-0 right-0 z-50 transition-all duration-300',
				isScrolled ? 'bg-white/80 text-dark backdrop-blur-[20px] backdrop-saturate-[180%]' : 'bg-transparent',
				isScrolled ? 'text-dark' : 'text-white',
				textColor
			)}
		>
			<div className='flex items-center md:gap-4 gap-12'>
				<Link to={paths.home} className='font-medium text-[14px] leading-6 relative px-2 group'>
					{t('common.home')}
					<span
						className={cn(
							'block h-[2px] w-full mx-auto mt-1 origin-left transition-transform duration-300 bg-[currentColor]',
							isHome ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
						)}
					/>
				</Link>
				<Link to={paths.men} className='font-medium text-[14px] leading-6 relative px-2 group'>
					{t('common.men')}
					<span
						className={cn(
							'block h-[2px] w-full mx-auto mt-1 origin-left transition-transform duration-300 bg-[currentColor]',
							isMen ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
						)}
					/>
				</Link>
				<Link to={paths.women} className='font-medium text-[14px] leading-6 relative px-2 group'>
					{t('common.women')}
					<span
						className={cn(
							'block h-[2px] w-full mx-auto mt-1 origin-left transition-transform duration-300 bg-[currentColor]',
							isWomen ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
						)}
					/>
				</Link>
			</div>
			<Logo
				className={cn('absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 cursor-pointer')}
				onClick={() => navigate(paths.home)}
			/>
			<div className='flex items-center gap-5 justify-end'>
				<LanguageSwitch textColor={isScrolled ? 'dark' : 'white'} />
				<Search />
				<div className={cn('flex items-center gap-[2px] shrink-0')}>
					<BagIcon />
				</div>
			</div>
		</div>
	);
}

export default Header;
