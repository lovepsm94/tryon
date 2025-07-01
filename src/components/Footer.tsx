import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

function Footer() {
	const { t } = useTranslation();
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_, setState] = useState({});

	useEffect(() => {
		setState({});
	}, [t]);

	return (
		<div className='px-4 md:px-[50px] h-[100px] text-[#3E3E59]'>
			<div className='flex flex-col md:flex-row h-full items-center justify-center md:justify-between border-t border-t-[#E4E4E4]'>
				<p className='text-[14px] leading-[22px]'>© 2025 Tryonic AI.</p>
				<div className='text-[14px] leading-[22px]'>
					<Trans
						i18nKey='common.footerRight'
						values={{ company: 'BCC IT Innovation Co., Ltd.' }}
						components={{
							a: (
								<a
									href='https://bccii.co.jp'
									className='bg-gradient-to-r from-[#6B25E0] to-[#2C44EF] bg-clip-text !text-[transparent] no-underline'
									target='_blank'
									rel='noreferrer'
								>
									BCC IT Innovation Co., Ltd.
								</a>
							)
						}}
					/>
				</div>
			</div>
		</div>
	);
}

export default Footer;
