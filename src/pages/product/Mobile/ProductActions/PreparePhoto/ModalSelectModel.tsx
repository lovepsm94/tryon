import { Modal } from '@/components/ui';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactComponent as CloseIcon } from '@/assets/close.svg';
import { ReactComponent as Spinner } from '@/assets/spinner.svg';
import TryonLoading from '@/components/ui/TryonLoading';
import cn from '@/utils/cn';
import { tryonApiService } from '@/utils/tryonApi';
import { indexedDBManager } from '@/utils/indexedDBManager';
import { localStorageManager } from '@/utils/localStorageManager';

const modelsData = [
	{
		id: 1,
		name: 'Mai',
		height: 155,
		weight: 42,
		frontImage: '/tryon-models/mai_front.jpg',
		sideImage: '/tryon-models/mai_side.jpg'
	},
	{
		id: 2,
		name: 'Thanh',
		height: 169,
		weight: 69,
		frontImage: '/tryon-models/thanh_front.jpg',
		sideImage: '/tryon-models/thanh_side.jpg'
	},
	{
		id: 3,
		name: 'Quan',
		height: 175,
		weight: 75,
		frontImage: '/tryon-models/quan_front.jpg',
		sideImage: '/tryon-models/quan_side.jpg'
	}
] as const;

interface ModalSelectModelProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectModel: () => void;
}

function ModalSelectModel({ isOpen, onClose, onSelectModel }: ModalSelectModelProps) {
	const { t } = useTranslation();

	const [selectedModel, setSelectedModel] = useState<(typeof modelsData)[number] | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSelectModel = async () => {
		if (!selectedModel) return;
		setIsLoading(true);

		try {
			const [frontBlob, sideBlob] = await Promise.all([
				fetch(selectedModel.frontImage).then((res) => res.blob()),
				fetch(selectedModel.sideImage).then((res) => res.blob())
			]);

			const frontFile = new File([frontBlob], 'front_view.jpg', { type: 'image/jpeg' });
			const maskResult = await tryonApiService.getMaskPoints(frontFile);
			const frontId = await indexedDBManager.saveUserImage(frontBlob, 'front');
			await indexedDBManager.saveUserImage(sideBlob, 'side');

			if (maskResult && maskResult.masks) {
				await indexedDBManager.saveMaskPoints(
					frontId,
					maskResult.masks.upper,
					maskResult.masks.lower,
					maskResult.masks.full
				);
			}

			localStorageManager.saveUserData({
				weight: selectedModel.weight,
				height: selectedModel.height,
				type: 'model',
				selectedFrontImageId: frontId
			});

			onSelectModel();
			onClose();
		} catch (err) {
			console.error('Error fetching model images or saving mask:', err);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} contentClassName='w-[567px]'>
			<div className='p-6'>
				<h2 className='text-[24px] font-medium text-center mb-4'>{t('modalSelectModel.title')}</h2>
				<CloseIcon className='absolute top-4 right-4 cursor-pointer' onClick={onClose} />

				<p className='text-[14px] font-semibold text-[#3E3E59] mt-6'>{t('modalSelectModel.description1')}</p>
				<p className='text-[14px] text-[#3E3E59] mt-3'>{t('modalSelectModel.description2')}</p>
				<p className='text-black-900 text-[18px] mt-6'>{t('modalSelectModel.selectAModelToTryOn')}</p>
				<div className='grid grid-cols-3 mt-6 gap-6'>
					{modelsData.map((model) => (
						<div key={model.id} className=''>
							<img
								src={model.frontImage}
								alt={model.name}
								onClick={() => setSelectedModel(model)}
								className={cn(
									'w-full h-[222px] object-cover cursor-pointer',
									selectedModel?.id === model.id && 'border-gradient'
								)}
							/>
							<p className='text-black-900 font-medium mt-3'>{model.name}</p>
							<p className='text-[#3E3E59] text-[12px] mt-1'>
								{t('modalSelectModel.height')}
								<span className='font-medium'>{` ${model.height}cm`}</span>
							</p>
							<p className='text-[#3E3E59] text-[12px] mt-1'>
								{t('modalSelectModel.weight')}
								<span className='font-medium'>{` ${model.weight}kg`}</span>
							</p>
						</div>
					))}
				</div>
				<button
					className={cn(
						'w-full h-[52px] bg-gradient text-white border-0 outline-0 mt-6',
						selectedModel ? 'bg-gradient' : 'bg-[#808191]'
					)}
					onClick={handleSelectModel}
					disabled={isLoading}
				>
					<span className='flex items-center justify-center gap-2'>
						{isLoading ? <Spinner className='w-5 h-5' /> : <TryonLoading />}
						{isLoading ? (
							<span className='flex items-center justify-center gap-2'>{t('common.processing')}</span>
						) : (
							<span className='flex items-center justify-center gap-2'>
								{t('modalSelectModel.tryOnWithThisModel')}
							</span>
						)}
					</span>
				</button>
			</div>
		</Modal>
	);
}

export default ModalSelectModel;
