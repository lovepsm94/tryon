import React, { useState } from 'react';
import { ReactComponent as MinusIcon } from '@/assets/minus.svg';
import { ReactComponent as AddIcon } from '@/assets/add.svg';
import cn from '@/utils/cn';

function ChangeCount() {
	const [count, setCount] = useState(1);
	const handleMinus = () => {
		if (count > 1) {
			setCount(count - 1);
		}
	};
	const handleAdd = () => {
		setCount(count + 1);
	};
	return (
		<div className='p-4 flex bg-black-100 justify-between'>
			<MinusIcon
				className={cn('cursor-pointer', count === 1 && 'opacity-50 cursor-default')}
				onClick={handleMinus}
			/>
			<p className='text-[16px] leading-[24px] text-black-900 font-medium'>{count}</p>
			<AddIcon className='cursor-pointer' onClick={handleAdd} />
		</div>
	);
}

export default ChangeCount;
