import { Modal, NumberInput } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import cn from '@/utils/cn';
import { useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

function AccessDemoModal() {
	const [accessCode, setAccessCode] = useState<number | undefined>(undefined);
	const [isError, setIsError] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const { t } = useTranslation();
	const { verifyAccessCode, isAuthenticated } = useAuth();
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setTimeout(() => {
			inputRef.current?.focus();
		}, 300);
	}, []);

	const handleVerifyAccessCode = async () => {
		if (!accessCode) {
			setIsError(true);
			return;
		}

		setIsLoading(true);
		const success = await verifyAccessCode(accessCode);
		setIsLoading(false);

		if (!success) {
			setIsError(true);
		}
	};

	const handleChangeAccessCode = (value: number | undefined) => {
		setIsError(false);
		setAccessCode(value);
	};

	if (isAuthenticated) {
		return null;
	}

	return (
		<Modal isOpen={true} contentClassName='md:w-[421px]'>
			<div className='py-4 px-6'>
				<p className='font-medium text-[20px] leading-[32px] text-center'>{t('common.accessDemoModalTitle')}</p>
				<p className='mt-8 text-[14px] font-semibold'>{t('common.enterYourAccessCode')}</p>
				<NumberInput
					ref={inputRef}
					maxLength={6}
					value={accessCode}
					onChange={handleChangeAccessCode}
					className='text-center py-[13px] text-[16px] leading-[28px] bg-black-100 mt-2'
					textAlign='center'
					shouldHandleBlur={false}
				/>
				{isError && <p className='mt-1 text-[12px] text-[#FF6628]'>{t('common.accessDemoModalError')}</p>}
				<button
					className={cn(
						'w-full h-[52px]  text-white border-0 outline-0 mt-4',
						String(accessCode).length < 6 ? 'bg-[#808191]' : 'bg-gradient'
					)}
					onClick={handleVerifyAccessCode}
					disabled={isLoading || String(accessCode).length < 6}
				>
					<span className='flex items-center justify-center gap-2'>{t('common.access')}</span>
				</button>
				<p className='mt-4 text-[12px] md:text-[14px] text-[#808191]'>
					<Trans
						i18nKey='common.accessDemoModalDescription'
						components={{
							a: (
								<a
									href='https://bccii.co.jp/contact-us'
									target='_blank'
									rel='noreferrer'
									className='!text-[#477EFF]'
								/>
							)
						}}
					/>
				</p>
			</div>
		</Modal>
	);
}

export default AccessDemoModal;
