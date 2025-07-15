import { ReactComponent as UserSwitch } from '@/assets/user-switch.svg';
import Drawer from '@/components/ui/Drawer';
import Modal from '@/components/ui/Modal';
import { useResponsive } from '@/contexts/ResponsiveContext';
import { indexedDBManager } from '@/utils/indexedDBManager';
// import { localStorageManager } from '@/utils/localStorageManager';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function ClearPersonData() {
	const { t } = useTranslation();
	const { isMobile } = useResponsive();
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleContinue = async () => {
		try {
			setIsLoading(true);
			// Clear IndexedDB data (images)
			await indexedDBManager.clearAllData();
			// Clear localStorage data (weight/height)
			// localStorageManager.clearUserData();
		} catch (error) {
			console.error('Failed to clear user data:', error);
			// You might want to show an error message to the user here
		} finally {
			setIsOpen(false);
			setIsLoading(false);
		}
	};

	const content = (
		<div className='h-full flex flex-col p-6 pb-10 items-center md:p-0'>
			<p className='font-medium text-[24px] leading-[32px] text-black-900 text-center'>
				{t('common.switchUserToTryOn')}
			</p>
			<UserSwitch className='w-[48px] h-[48px] mt-5' />
			<p className='text-[16px] leading-[24px] font-semibold text-dark text-center mt-5'>
				{t('common.switchUserToTryOnDescription')}
			</p>
			<p className='text-[16px] text-[#3E3E59] leading-[20px] mt-3 text-center'>
				{t('common.switchUserToTryOnWarning')}
			</p>
			<div className='grid grid-cols-2 w-full mt-6 gap-4'>
				<button
					className='h-[52px] bg-[#808191] border-0 outline-0 text-white'
					onClick={() => setIsOpen(false)}
					disabled={isLoading}
				>
					{t('common.cancel')}
				</button>
				<button
					className='h-[52px] bg-gradient text-white border-0 outline-0 disabled:opacity-50'
					onClick={handleContinue}
					disabled={isLoading}
				>
					{t('common.continue')}
				</button>
			</div>
		</div>
	);

	return (
		<>
			<div
				className='flex items-center justify-center gap-2 mt-4 md:justify-start cursor-pointer'
				onClick={() => setIsOpen(true)}
			>
				<UserSwitch />
				<span className='text-gradient text-[14px] leading-[26px]'>{t('common.selectOtherPerson')}</span>
			</div>

			{isMobile ? (
				<Drawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
					{content}
				</Drawer>
			) : (
				<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} contentClassName='max-w-[540px] p-6'>
					{content}
				</Modal>
			)}
		</>
	);
}

export default ClearPersonData;
