import Rating from '@/components/Rating';
import { getLanguage } from '@/locales';
import dayjs from 'dayjs';

const reviews = [
	{
		id: 1,
		rating: 5,
		user: {
			name: 'Jaxson Aminoff',
			avatar: '/reviews/1.png'
		},
		comment:
			'最近このシャツを購入しましたが、自分の選択にとても満足しています！生地は柔らかく通気性が良いので、普段使いにぴったりです。フィット感もちょうどよく、きつすぎずゆるすぎず快適です。シンプルでありながらおしゃれなデザインも気に入っており、ジーンズやスカートとも合わせやすいです。',
		date: dayjs()
	},
	{
		id: 2,
		rating: 5,
		user: {
			name: 'James Schleifer',
			avatar: '/reviews/2.png'
		},
		comment:
			'最近このシャツを購入しましたが、自分の選択にとても満足しています！生地は柔らかく通気性が良いので、普段使いにぴったりです。フィット感もちょうどよく、きつすぎずゆるすぎず快適です。シンプルでありながらおしゃれなデザインも気に入っており、ジーンズやスカートとも合わせやすいです。',
		date: dayjs()
	}
];
function Reviews() {
	return (
		<>
			{reviews.map((review) => (
				<div key={review.id} className='border-b border-black-200 last:border-[transparent] mt-8 first:mt-4'>
					<div className='flex gap-4 items-center'>
						<img
							src={review.user.avatar}
							alt={review.user.name}
							className='w-[76px] h-[76px] rounded-full object-cover'
						/>
						<div>
							<p className='font-semibold text-[14px] leading-[22px] mb-[2px] text-black-900'>
								{review.user.name}
							</p>
							<p className='text-black-500 text-[12px] leading-5 mb-1'>
								{review.date.locale(getLanguage()).format('MMM DD, YYYY')}
							</p>
							<Rating rating={review.rating} />
						</div>
					</div>
					<p className='text-[16px] leading-[26px] mt-3 pb-8'>{review.comment}</p>
				</div>
			))}
		</>
	);
}

export default Reviews;
