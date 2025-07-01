import { ReactComponent as Logo } from '@/assets/logo.svg';
import LanguageSwitch from '@/components/LanguageSwitch';
import { paths } from '@/routes';
import cn from '@/utils/cn';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface MobileHeaderProps {
	textColor?: string;
}

function MobileHeader({ textColor }: MobileHeaderProps) {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isOpenMenu, setIsOpenMenu] = useState(false);
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const isMen = location.pathname === paths.men;
	const isWomen = location.pathname === paths.women;
	const isHome = location.pathname === paths.home;

	useEffect(() => {
		const handleScroll = () => {
			const scrollTop = window.scrollY;
			setIsScrolled(scrollTop > 0);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	useEffect(() => {
		if (isOpenMenu) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}

		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpenMenu]);

	return (
		<div
			className={cn(
				'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
				isOpenMenu
					? 'bg-white/80 text-dark backdrop-blur-[20px] backdrop-saturate-[180%]'
					: isScrolled
						? 'bg-white/80 text-dark backdrop-blur-[20px] backdrop-saturate-[180%]'
						: 'bg-[transparent]',
				isOpenMenu || isScrolled ? 'text-dark' : 'text-white',
				textColor,
				isOpenMenu ? 'h-screen' : 'h-[62px]'
			)}
		>
			<div className='h-[62px] p-4 flex items-center justify-between'>
				<Logo className='w-[131px] cursor-pointer' onClick={() => navigate(paths.home)} />
				<div className='flex items-center gap-4'>
					<LanguageSwitch textColor={isScrolled ? 'dark' : 'white'} />
					<button
						className='relative w-5 h-5 flex flex-col justify-center items-center'
						onClick={() => setIsOpenMenu(!isOpenMenu)}
					>
						<span
							className={cn(
								'w-4 h-[2px] bg-[currentColor] transition-all duration-300',
								isOpenMenu ? 'rotate-45 translate-y-[1px]' : '-translate-y-[2px]'
							)}
						/>
						<span
							className={cn(
								'w-4 h-[2px] bg-[currentColor] transition-all duration-300',
								isOpenMenu ? '-rotate-45 -translate-y-[1px]' : 'translate-y-[2px]'
							)}
						/>
					</button>
				</div>
			</div>
			<div
				className={cn(
					'overflow-hidden transition-all duration-300',
					isOpenMenu ? 'h-[calc(100vh-62px)] opacity-100' : 'h-0 opacity-0'
				)}
			>
				<div className='flex flex-col h-full justify-center gap-[40px] px-[38px] pb-[62px] text-dark'>
					<Link
						to={paths.home}
						className={cn('text-[24px] leading-6', isHome && 'text-gradient')}
						onClick={() => setIsOpenMenu(false)}
					>
						{t('common.home')}
					</Link>
					<Link
						to={paths.men}
						className={cn('text-[24px] leading-6', isMen && 'text-gradient')}
						onClick={() => setIsOpenMenu(false)}
					>
						{t('common.men')}
					</Link>
					<Link
						to={paths.women}
						className={cn('text-[24px] leading-6', isWomen && 'text-gradient')}
						onClick={() => setIsOpenMenu(false)}
					>
						{t('common.women')}
					</Link>
				</div>
			</div>
		</div>
	);
}

export default MobileHeader;
