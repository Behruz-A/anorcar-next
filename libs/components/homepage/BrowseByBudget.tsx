import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Keyboard, Navigation } from 'swiper/modules';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { GET_CAR_BUDGET_COUNTS } from '../../../apollo/user/query';
import { Cars } from '../../types/car/car';
import { carBudgets, budgetCarsInquiry } from '../../carBudgets';

const budgetVariables = Object.fromEntries(carBudgets.map((budget) => [
	budget.key, { ...budgetCarsInquiry(budget.maxPrice), limit: 1 },
]));

const BrowseByBudget = () => {
	const { t } = useTranslation('common');
	const { data, loading } = useQuery<Record<string, Pick<Cars, 'metaCounter'>>>(GET_CAR_BUDGET_COUNTS, {
		variables: budgetVariables,
		fetchPolicy: 'cache-and-network',
		errorPolicy: 'all',
		context: { skipGlobalError: true },
	});

	return (
		<Stack component="section" className="browse-by-budget" aria-labelledby="budget-heading">
			<Stack className="container budget-container">
				<Stack className="budget-header">
					<Stack className="budget-heading-copy">
						<Typography component="h2" id="budget-heading">{t('Browse by Budget')}</Typography>
						<Typography component="p">{t('Find a car that fits your budget.')}</Typography>
					</Stack>
					<Stack className="budget-controls">
						<IconButton className="swiper-budget-prev" aria-label={t('Previous budgets')}><ArrowBackIosNewIcon /></IconButton>
						<IconButton className="swiper-budget-next" aria-label={t('Next budgets')}><ArrowForwardIosIcon /></IconButton>
					</Stack>
				</Stack>
				<Stack className="budget-cards">
					<Swiper className="budget-swiper" slidesPerView="auto" spaceBetween={18}
						breakpoints={{ 0: { slidesPerGroup: 1 }, 1201: { slidesPerGroup: 2 } }}
						modules={[Navigation, Keyboard, A11y]} keyboard={{ enabled: true, onlyInViewport: true }} watchOverflow
						navigation={{ prevEl: '.swiper-budget-prev', nextEl: '.swiper-budget-next' }}
						a11y={{ prevSlideMessage: t('Previous budgets'), nextSlideMessage: t('Next budgets') }}>
						{carBudgets.map((budget) => {
							const input = budgetCarsInquiry(budget.maxPrice);
							const counters = data?.[budget.key]?.metaCounter;
							const total = counters ? counters[0]?.total ?? 0 : undefined;
							return (
								<SwiperSlide key={budget.image} className="budget-slide">
									<Link className="budget-card" passHref href={{ pathname: '/car', query: { input: JSON.stringify(input) } }}>
										<div className="budget-image">
											<Image src={`/img/car/budget/${budget.image}.png`} alt="" fill
												sizes="(max-width: 600px) 210px, (max-width: 1200px) 245px, (max-width: 1808px) 20vw, 322px" />
										</div>
										<span><strong>{t(budget.label)}</strong>
											<small aria-busy={loading}>{typeof total === 'number' ? t('Cars available', { count: total }) : loading ? '…' : '—'}</small>
										</span>
									</Link>
								</SwiperSlide>
							);
						})}
					</Swiper>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default BrowseByBudget;
