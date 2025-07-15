import React from 'react';
import { ReactComponent as PhotoGuide } from '@/assets/photo-guide.svg';
import { useTranslation } from 'react-i18next';

interface PhotoGuideStepProps {
	onContinue: () => void;
}
const PhotoGuideStep: React.FC<PhotoGuideStepProps> = ({ onContinue }) => {
	const { t } = useTranslation();
	return (
		<div className='flex flex-col h-full py-6'>
			<div className='flex-grow flex items-center justify-center'>
				<PhotoGuide />
			</div>
			<p className='text-center text-[#1B1D21] mt-2 mb-4'>
				{t(`getUserModelImage.steps.photoGuide.instruction`)}
			</p>
			<button
				className='bg-gradient h-[40px] text-white font-semibold mt-2 mb-8 md:mb-0 backdrop:blur-sm'
				onClick={onContinue}
			>
				{t('common.gotIt')}
			</button>
		</div>
	);
};

export default PhotoGuideStep;
