import Rating from '@/components/Rating';
import { getLanguage } from '@/locales';
import TabItem from '@/pages/product/Mobile/ProductTabs/TabItem';
import dayjs from 'dayjs';
import React from 'react';
import { useTranslation } from 'react-i18next';

const reviews = [
	{
		id: 1,
		rating: 5,
		user: {
			name: 'Jaxson Aminoff',
			avatar: '/reviews/1.png'
		},
		comment:
			'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupt et quas molestias excepturi sint non provident, sunt in culpa qui officia animi, id est laborum et dolorum fuga.',
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
			'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupt et quas molestias excepturi sint non provident, sunt in culpa qui officia animi, id est laborum et dolorum fuga.',
		date: dayjs()
	}
];
function Reviews() {
	const { t } = useTranslation();
	return (
		<TabItem
			label={t('common.reviews', { count: 2 })}
			content={reviews.map((review) => (
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
		/>
	);
}

export default Reviews;
