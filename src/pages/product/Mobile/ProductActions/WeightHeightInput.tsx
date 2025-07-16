import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import NumberInput from '@/components/ui/NumberInput';
import { localStorageManager } from '@/utils/localStorageManager';
import cn from '@/utils/cn';

interface WeightHeightInputProps {
	onCancel: () => void;
	onContinue: () => void;
}

function WeightHeightInput({ onCancel, onContinue }: WeightHeightInputProps) {
	const { t } = useTranslation();
	const [weight, setWeight] = useState<number>();
	const [height, setHeight] = useState<number>();
	const [isSaving, setIsSaving] = useState(false);

	const isInvalid = !weight || !height;

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
		let _weight = weight;
		let _height = height;
		if (weight < 30) {
			_weight = 30;
		}
		if (weight > 140) {
			_weight = 140;
		}
		if (height < 140) {
			_height = 140;
		}
		if (height > 200) {
			_height = 200;
		}

		try {
			setIsSaving(true);

			// Check if user data already exists
			const existingUserData = localStorageManager.getUserData();

			if (existingUserData) {
				// Update existing user data
				localStorageManager.updateUserData({
					weight: _weight,
					height: _height
				});
				console.log('User data updated in localStorage');
			} else {
				// Create new user data
				localStorageManager.saveUserData({
					weight: _weight,
					height: _height
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
			<p className='font-medium text-[22px] leading-[32px] text-black-900 text-center'>
				{t('common.enterYourWeightAndHeight')}
			</p>
			<NumberInput
				onChange={(value) => setWeight(value || undefined)}
				className='mt-6 w-full md:mt-10'
				placeholder={t('common.enterWeight')}
				unit='kg'
				max={140}
				min={30}
				value={weight}
			/>
			<NumberInput
				onChange={(value) => setHeight(value || undefined)}
				className='mt-6  w-full'
				placeholder={t('common.enterHeight')}
				unit='cm'
				min={140}
				max={200}
				value={height}
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
					className={cn('h-[52px] text-white border-0 outline-0', isInvalid ? 'bg-[#808191]' : 'bg-gradient')}
					onClick={handleContinue}
					disabled={isSaving || isInvalid}
				>
					{t('common.continue')}
				</button>
			</div>
		</div>
	);
}

export default WeightHeightInput;
