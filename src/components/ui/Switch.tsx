import cn from '@/utils/cn';
import { HTMLAttributes, forwardRef } from 'react';

interface SwitchProps extends Omit<HTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size'> {
	value?: boolean;
	onChange?: (value: boolean) => void;
	disabled?: boolean;
	error?: boolean;
	errorText?: string;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	({ value = false, onChange, className, style, error, errorText, disabled = false, ...restProps }, ref) => {
		const handleToggle = () => {
			if (disabled) return;
			onChange?.(!value);
		};

		const sizeClasses = {
			track: 'w-[36px] h-[20px]',
			thumb: 'w-[16px] h-[16px]',
			thumbTranslate: 'translate-x-[18px]'
		};

		const trackClasses = cn(
			sizeClasses.track,
			'relative inline-flex flex-shrink-0 rounded-full transition-colors ease-in-out duration-200',
			{
				'bg-[#4FBF67]': value,
				'bg-[#E4E4E4]': !value,
				'opacity-60 cursor-not-allowed': disabled
			}
		);

		const thumbClasses = cn(
			sizeClasses.thumb,
			'absolute top-[2px] pointer-events-none inline-block rounded-full bg-[white] shadow transform transition ease-in-out duration-200',
			{
				[sizeClasses.thumbTranslate]: value,
				'translate-x-[2px]': !value
			}
		);

		return (
			<button
				onClick={handleToggle}
				disabled={disabled}
				className={cn(trackClasses, className)}
				role='switch'
				aria-checked={value}
				aria-disabled={disabled}
				style={style}
			>
				<input ref={ref} {...restProps} className='hidden' />
				<span aria-hidden='true' className={thumbClasses} />
			</button>
		);
	}
);

Switch.displayName = 'Switch';

export default Switch;
