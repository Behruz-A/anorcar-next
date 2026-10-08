import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Keyboard, Navigation } from 'swiper';
import { useTranslation } from 'next-i18next';
import { CarsInquiry } from '../../types/car/car.input';
import { Direction } from '../../enums/common.enum';

// Navigation categories, not inventory records. Prices are USD, confirmed by the user.
const budgets = [
	{ label: 'Under $10K', maxPrice: 10000, image: 'budget-blue' },
	{ label: 'Under $20K', maxPrice: 20000, image: 'budget-orange' },
	{ label: 'Under $30K', maxPrice: 30000, image: 'budget-red' },
	{ label: 'Under $40K', maxPrice: 40000, image: 'budget-green' },
	{ label: 'Under $50K', maxPrice: 50000, image: 'budget-slate' },
	{ label: 'Under $75K', maxPrice: 75000, image: 'budget-yellow' },
	{ label: 'Under $100K', maxPrice: 100000, image: 'budget-white' },
	{ label: 'Any Budget', maxPrice: undefined, image: 'budget-silver' },
];

const BrowseByBudget = () => {
	const { t } = useTranslation('common');

	return (
		<Stack component="section" className="browse-by-budget" aria-labelledby="budget-heading">
			<Stack className="container budget-container">
				<Typography component="h2" id="budget-heading">{t('Browse by Budget')}</Typography>
				<Stack className="budget-cards">
					<Swiper className="budget-swiper" slidesPerView="auto" spaceBetween={18}
						breakpoints={{ 0: { slidesPerGroup: 1 }, 1201: { slidesPerGroup: 2 } }}
						modules={[Navigation, Keyboard, A11y]} keyboard={{ enabled: true, onlyInViewport: true }}
						navigation={{ prevEl: '.swiper-budget-prev', nextEl: '.swiper-budget-next' }}
						a11y={{ prevSlideMessage: t('Previous budgets'), nextSlideMessage: t('Next budgets') }}>
						{budgets.map((budget) => {
							const input: CarsInquiry = {
								page: 1, limit: 9, sort: 'carPrice', direction: Direction.ASC,
								search: budget.maxPrice === undefined ? {} : { pricesRange: { start: 0, end: budget.maxPrice } },
							};
							return (
								<SwiperSlide key={budget.image} className="budget-slide">
									<Link className="budget-card" passHref href={{ pathname: '/car', query: { input: JSON.stringify(input) } }}>
										<div className="budget-image">
											<Image src={`/img/car/budget/${budget.image}.png`} alt="" fill
												sizes="(max-width: 600px) 220px, (max-width: 1200px) 240px, 300px" />
										</div>
										<span>{t(budget.label)}</span>
									</Link>
								</SwiperSlide>
							);
						})}
					</Swiper>
					<Stack className="budget-controls">
						<IconButton className="swiper-budget-prev" aria-label={t('Previous budgets')}><ArrowBackIosNewIcon /></IconButton>
						<IconButton className="swiper-budget-next" aria-label={t('Next budgets')}><ArrowForwardIosIcon /></IconButton>
					</Stack>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default BrowseByBudget;
