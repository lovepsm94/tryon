function Information() {
	const information = [
		'Fabric: Denim',
		'Fit type: Loose fit',
		'Feature: Adjustable straps',
		'Front and back pockets'
	];
	return (
		<>
			{information.map((information, index) => (
				<div key={index} className='flex items-center gap-4'>
					<div className='w-[5px] h-[5px] rounded-full bg-black-900'></div>
					<p className='text-[16px] leading-[30px]'>{information}</p>
				</div>
			))}
		</>
	);
}

export default Information;
