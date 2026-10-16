import React from 'react';
import Link from 'next/link';
import { Stack, Alert, Skeleton, IconButton } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Keyboard, Navigation, Pagination } from 'swiper';
import EastIcon from '@mui/icons-material/East';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { GET_CARS } from '../../../apollo/user/query';
import { Direction } from '../../enums/common.enum';
import { CarsInquiry } from '../../types/car/car.input';
import { Cars } from '../../types/car/car';
import RecentlyAddedCarCard from './RecentlyAddedCarCard';
import { LIKE_TARGET_CAR } from '../../../apollo/user/mutation';
import { CustomJwtPayload } from '../../types/customJwtPayload';
import { Message } from '../../enums/common.enum';
import { sweetMixinErrorAlert } from '../../sweetAlert';

interface RecentlyAddedCarsProps { initialInput: CarsInquiry; }

const RecentlyAddedCars = ({ initialInput }: RecentlyAddedCarsProps) => {
	const { t } = useTranslation('common');

	/** APOLLO REQUESTS **/
	// Like returns an unpopulated Car; keep its null joins out of listing cache.
	const [likeTargetCar] = useMutation(LIKE_TARGET_CAR, { fetchPolicy: 'no-cache' });
	const { loading, data, error, refetch } = useQuery<{ getCars: Cars }>(GET_CARS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
	});
	const recentCars = data?.getCars?.list ?? [];
	const likeCarHandler = async (user: CustomJwtPayload, id: string) => {
		try {
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetCar({ variables: { input: id } });
			await refetch();
		} catch (err: any) { await sweetMixinErrorAlert(err.message); }
	};

	return (
		<Stack component="section" className="recently-added-cars" aria-labelledby="recently-added-heading">
			<Stack className="container">
				<div className="recent-header">
				<div className="recent-heading">
					<h2 id="recently-added-heading">{t('Recently Added Cars')}</h2>
					<p>{t('Discover the latest vehicles on ANORCAR. Be the first to find your next car.')}</p>
				</div>
				<div className="recent-actions">
					<div className="recent-controls">
						<IconButton className="swiper-recent-prev" aria-label={t('Previous cars')} disabled={!recentCars.length || !!error}><ArrowBackIosNewIcon /></IconButton>
						<IconButton className="swiper-recent-next" aria-label={t('Next cars')} disabled={!recentCars.length || !!error}><ArrowForwardIosIcon /></IconButton>
					</div>
					<Link className="recent-view-all" href={{ pathname: '/car', query: { input: JSON.stringify({ ...initialInput, page: 1, limit: 9 }) } }}>
						{t('View All Cars')} <EastIcon fontSize="small" />
					</Link>
				</div>
				</div>
				{loading && !data ? <div className="recent-loading" role="status" aria-label={t('Loading cars')}>
					<span className="recent-loading-label">{t('Loading cars')}</span>
					<div className="recent-grid" aria-hidden="true">
						{Array.from({ length: 4 }, (_, index) => <div key={index} className="recent-car-card recent-car-placeholder">
							<div className="recent-car-image"><Skeleton variant="rectangular" animation={false} width="100%" height="100%" /></div>
							<div className="recent-car-info">
								<div className="recent-brand"><Skeleton variant="rectangular" animation={false} width="45%" height={22} /></div>
								<div className="recent-model-placeholder">
									<Skeleton variant="rectangular" animation={false} width="80%" height={20} />
									<Skeleton variant="rectangular" animation={false} width="55%" height={20} sx={{ marginTop: '6px' }} />
								</div>
								<div className="recent-price"><Skeleton variant="rectangular" animation={false} width={110} height={32} /></div>
								<div className="recent-specs">
									<span><Skeleton variant="rectangular" animation={false} width={56} height={22} /></span>
									<span><Skeleton variant="rectangular" animation={false} width="70%" height={22} /></span>
									<span className="recent-transmission"><Skeleton variant="rectangular" animation={false} width={110} height={22} /></span>
								</div>
								<div className="recent-location"><Skeleton variant="rectangular" animation={false} width={90} height={22} /></div>
							</div>
						</div>)}
					</div>
				</div> :
					error ? <Alert severity="error">{t('Cars could not be loaded. Please try again.')}</Alert> :
					recentCars.length === 0 ? <p className="recent-status">{t('No recently added cars yet.')}</p> :
					<>
						<Swiper className="recent-swiper" slidesPerView={1} slidesPerGroup={1} spaceBetween={16} watchOverflow
							breakpoints={{ 600: { slidesPerView: 2, slidesPerGroup: 2, spaceBetween: 20 }, 1440: { slidesPerView: 4, slidesPerGroup: 4, spaceBetween: 24 } }}
							modules={[Navigation, Pagination, Keyboard, A11y]} keyboard={{ enabled: true, onlyInViewport: true }}
							navigation={{ prevEl: '.swiper-recent-prev', nextEl: '.swiper-recent-next' }}
							pagination={{ el: '.recent-pagination', clickable: true }}
							a11y={{ prevSlideMessage: t('Previous cars'), nextSlideMessage: t('Next cars'), paginationBulletMessage: t('Go to slide {{index}}') }}>
							{recentCars.map((car) => <SwiperSlide className="recent-slide" key={car._id}><RecentlyAddedCarCard car={car} likeCarHandler={likeCarHandler} /></SwiperSlide>)}
						</Swiper>
						<div className="recent-pagination" />
					</>}
			</Stack>
		</Stack>
	);
};

RecentlyAddedCars.defaultProps = {
	initialInput: { page: 1, limit: 9, sort: 'createdAt', direction: Direction.DESC, search: {} },
};

export default RecentlyAddedCars;
