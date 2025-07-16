import React, { useState, forwardRef } from 'react';
import cn from '@/utils/cn';

interface NumberInputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue'> {
	unit?: string;
	onChange?: (value: number | undefined) => void;
	value?: number | undefined;
	textAlign?: 'left' | 'center';
	defaultValue?: number | undefined;
	shouldHandleBlur?: boolean;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
	(
		{
			unit = '',
			min = 0,
			max = 200,
			className,
			onChange,
			placeholder,
			value,
			defaultValue,
			textAlign = 'left',
			shouldHandleBlur = true,
			...props
		},
		ref
	) => {
		const [internalValue, setInternalValue] = useState<number | undefined>(value ?? defaultValue);

		const isControlled = value !== undefined;
		const count = isControlled ? value : internalValue;

		const handleChange = (newValue: number | undefined) => {
			if (!isControlled) {
				setInternalValue(newValue);
			}
			if (onChange) {
				onChange(newValue);
			}
		};

		const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const val = e.target.value;
			// Only allow digits (0-9) and empty string
			if (/^[0-9]*$/.test(val)) {
				if (val === '') {
					handleChange(undefined);
				} else {
					const num = parseInt(val, 10);
					handleChange(num);
				}
			}
		};

		const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
			if (!shouldHandleBlur) return;
			if (props.onBlur) {
				props.onBlur(e);
			}
			if (count === undefined) return;

			let valueToSet = count;
			if (valueToSet < Number(min)) {
				valueToSet = Number(min);
			} else if (valueToSet > Number(max)) {
				valueToSet = Number(max);
			}

			if (valueToSet !== count) {
				handleChange(valueToSet);
			}
		};

		return (
			<div
				className={cn(
					'flex items-center justify-between rounded-lg bg-black-100 p-4 text-black-900',
					className
				)}
			>
				<input
					ref={ref}
					type='text'
					inputMode='numeric'
					className={cn(
						'w-full bg-[transparent] text-[16px] font-medium leading-6 text-black-900 outline-none placeholder:font-medium placeholder:text-[#808191] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none',
						textAlign === 'center' && 'text-center'
					)}
					value={count ?? ''}
					onChange={handleManualInputChange}
					onBlur={handleBlur}
					maxLength={15}
					placeholder={placeholder}
					{...props}
				/>
				{unit && <span className='pl-2 text-[16px] font-medium leading-6'>{unit}</span>}
			</div>
		);
	}
);

NumberInput.displayName = 'NumberInput';

export default NumberInput;
