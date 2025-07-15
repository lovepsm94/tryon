import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import NumberInput from '@/components/ui/NumberInput';
import { localStorageManager } from '@/utils/localStorageManager';

interface WeightHeightInputProps {
	onCancel: () => void;
	onContinue: () => void;
}

function WeightHeightInput({ onCancel, onContinue }: WeightHeightInputProps) {
	const { t } = useTranslation();
	const [weight, setWeight] = useState<number>(50);
	const [height, setHeight] = useState<number>(165);
	const [isSaving, setIsSaving] = useState(false);

	// Load existing user data when component mounts
	useEffect(() => {
		try {
			const existingUserData = localStorageManager.getUserData();
			if (existingUserData) {
				if (existingUserData.weight) {
					setWeight(existingUserData.weight);
				}
				if (existingUserData.height) {
					setHeight(existingUserData.height);
				}
			}
		} catch (error) {
			console.error('Error loading existing user data:', error);
		}
	}, []);

	const handleContinue = async () => {
		if (!weight || !height) {
			// Show error or validation message
			return;
		}

		try {
			setIsSaving(true);

			// Check if user data already exists
			const existingUserData = localStorageManager.getUserData();

			if (existingUserData) {
				// Update existing user data
				localStorageManager.updateUserData({
					weight,
					height
				});
				console.log('User data updated in localStorage');
			} else {
				// Create new user data
				localStorageManager.saveUserData({
					weight,
					height
				});
				console.log('User data saved to localStorage');
			}

			// Continue to next step
			onContinue();
		} catch (error) {
			console.error('Error saving user data to localStorage:', error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className='h-full flex flex-col items-center p-6'>
			<p className='font-medium text-[24px] leading-[32px] text-black-900 text-center'>
				{t('common.enterYourWeightAndHeight')}
			</p>
			<NumberInput
				onChange={(value) => setWeight(value || 50)}
				className='mt-6 w-full md:mt-10'
				placeholder={t('common.enterWeight')}
				unit='kg'
				defaultValue={weight}
			/>
			<NumberInput
				onChange={(value) => setHeight(value || 165)}
				className='mt-6  w-full'
				placeholder={t('common.enterHeight')}
				unit='cm'
				defaultValue={height}
			/>
			<div className='grid grid-cols-2 w-full mt-6 gap-4'>
				<button
					className='h-[52px] bg-[#808191] border-0 outline-0 text-white'
					onClick={onCancel}
					disabled={isSaving}
				>
					{t('common.cancel')}
				</button>
				<button
					className='h-[52px] bg-gradient text-white border-0 outline-0'
					onClick={handleContinue}
					disabled={isSaving}
				>
					{t('common.continue')}
				</button>
			</div>
		</div>
	);
}

export default WeightHeightInput;
