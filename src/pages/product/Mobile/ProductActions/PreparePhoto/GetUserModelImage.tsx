// import { ReactComponent as CloseIcon } from '@/assets/close.svg';
import Modal from '@/components/ui/Modal';
import { useResponsive } from '@/contexts/ResponsiveContext';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DetectCameraStep, FrontViewStep, PhotoGuideStep, SideViewStep } from './steps';
import { checkMotionSensorSupport } from '@/utils';
import { indexedDBManager } from '@/utils/indexedDBManager';
import { ReactComponent as CloseIcon } from '@/assets/close.svg';
import cn from '@/utils/cn';

type PhotoStep = 'detectCamera' | 'photoGuide' | 'sideView' | 'frontView';

interface GetUserModelImageProps {
	onCancel: () => void;
	onContinue: () => void;
}

const steps: PhotoStep[] = ['photoGuide', 'detectCamera', 'sideView', 'frontView'];

const GetUserModelImage: React.FC<GetUserModelImageProps> = ({ onCancel, onContinue }) => {
	const { t } = useTranslation();
	const { isMobile } = useResponsive();
	const [currentStep, setCurrentStep] = useState<PhotoStep>('photoGuide');
	const [showContent, setShowContent] = useState(true);

	const currentStepIndex = steps.indexOf(currentStep);

	useEffect(() => {
		if (isMobile) {
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = 'unset';
			};
		}
	}, [isMobile]);

	const handleStepComplete = useCallback(async () => {
		try {
			// Step 1: Photo Guide -> Check motion sensor support
			if (currentStep === 'photoGuide') {
				const hasMotionSensor = await checkMotionSensorSupport();
				if (hasMotionSensor) {
					setCurrentStep('detectCamera');
				} else {
					// Check if side view already exists before going to side view
					const existingSideView = await indexedDBManager.getLatestUserImageBlob('side');
					if (existingSideView) {
						setCurrentStep('frontView');
					} else {
						setCurrentStep('sideView');
					}
				}
				return;
			}

			// Step 2: Detect Camera -> Go to side view (or skip if exists)
			if (currentStep === 'detectCamera') {
				const existingSideView = await indexedDBManager.getLatestUserImageBlob('side');
				if (existingSideView) {
					setCurrentStep('frontView');
				} else {
					setCurrentStep('sideView');
				}
				return;
			}

			// Step 3: Side View -> Go to front view
			if (currentStep === 'sideView') {
				setCurrentStep('frontView');
				return;
			}

			// Step 4: Front View -> Complete the process
			if (currentStep === 'frontView') {
				onContinue();
				return;
			}
		} catch (error) {
			console.error('Error in handleStepComplete:', error);
			// Fallback: try to continue to next step
			const nextStepIndex = currentStepIndex + 1;
			if (nextStepIndex < steps.length) {
				setCurrentStep(steps[nextStepIndex]);
			} else {
				onContinue();
			}
		}
	}, [currentStep, currentStepIndex, onContinue]);

	const handleClose = useCallback(() => {
		if (isMobile) {
			setShowContent(false);
			// Wait for fade-out animation to complete before calling onCancel
			setTimeout(() => {
				onCancel();
			}, 500);
		} else {
			onCancel();
		}
	}, [onCancel, isMobile]);

	const renderStepContent = () => {
		switch (currentStep) {
			case 'photoGuide':
				return <PhotoGuideStep onContinue={handleStepComplete} />;
			case 'detectCamera':
				return <DetectCameraStep onStepComplete={handleStepComplete} />;
			case 'sideView':
				return <SideViewStep onContinue={handleStepComplete} />;
			case 'frontView':
				return <FrontViewStep onContinue={handleStepComplete} />;
			default:
				return null;
		}
	};

	const content = (
		<div
			className={`h-full flex flex-col mx-auto max-w-md ${isMobile ? 'transition-opacity duration-500 ease-out' : ''} ${showContent ? 'opacity-100' : 'opacity-0'}`}
		>
			<h2 className='text-[18px] font-medium text-center mb-4 mt-4'>
				{t(`getUserModelImage.steps.${currentStep}.title`)}
			</h2>
			<CloseIcon className='absolute top-4 right-4 cursor-pointer' onClick={handleClose} />

			{/* Step content */}
			{renderStepContent()}
		</div>
	);

	if (isMobile) {
		return <div className='p-4 fixed top-0 left-0 bottom-0 right-0 bg-white z-50 select-none'>{content}</div>;
	}

	return (
		<Modal
			isOpen={true}
			onClose={handleClose}
			contentClassName={cn('md:h-screen rounded-none', currentStep === 'photoGuide' && '!h-[600px]')}
		>
			{content}
		</Modal>
	);
};

export default GetUserModelImage;
