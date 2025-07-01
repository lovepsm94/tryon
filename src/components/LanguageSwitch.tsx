import { ReactComponent as EnglishFlag } from '@/assets/english-flag.svg';
import { ReactComponent as JapaneseFlag } from '@/assets/japanese-flag.svg';
import { changeLanguage, getLanguage } from '@/locales';
import cn from '@/utils/cn';
import { useTranslation } from 'react-i18next';

function LanguageSwitch({ className, textColor }: { className?: string; textColor: 'dark' | 'white' }) {
	const { t } = useTranslation();
	const currentLanguage = getLanguage();
	const handleChangeLanguage = () => {
		currentLanguage === 'en' ? changeLanguage('ja') : changeLanguage('en');
	};

	return (
		<div className={cn('flex items-center gap-2', className)}>
			<button
				onClick={handleChangeLanguage}
				className={cn(
					'relative inline-flex h-8 w-24 items-center rounded-full bg-gray-200 border border-[transparent] transition-colors duration-300 ease-in-out focus:outline-none',
					textColor === 'dark' ? 'md:hover:border-dark/50' : 'md:hover:border-white/50'
				)}
			>
				<div className='relative w-full h-full flex items-center'>
					<span
						className={cn(
							'absolute text-[14px] leading-6 font-medium transform transition-all duration-300 ease-in-out language-switch',
							currentLanguage === 'ja' ? 'translate-x-[34px]' : 'translate-x-[20px]'
						)}
					>
						{currentLanguage === 'ja' ? t('common.english') : t('common.japanese')}
					</span>
					<div
						className={cn(
							'absolute transform transition-all duration-300 ease-in-out',
							currentLanguage === 'ja' ? 'left-[10px]' : 'left-[calc(100%-26px)]'
						)}
					>
						{currentLanguage === 'ja' ? <EnglishFlag /> : <JapaneseFlag className='w-[18px] h-[18px]' />}
					</div>
				</div>
			</button>
		</div>
	);
}

export default LanguageSwitch;
