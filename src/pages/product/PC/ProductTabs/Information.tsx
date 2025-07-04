function Information() {
	const information = [
		'生地：デニム',
		'フィットタイプ：ルーズフィット',
		'特徴：調節可能なストラップ',
		'前後にポケット'
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
