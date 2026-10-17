import { useTranslation } from 'next-i18next';
import React, { useEffect, useState } from 'react';
import { Stack, Alert, CircularProgress, IconButton } from '@mui/material';
import Link from 'next/link';
import { Direction } from '../../enums/common.enum';
import EastIcon from '@mui/icons-material/East';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Keyboard, Navigation } from 'swiper/modules';
import { Car } from '../../types/car/car';
import { CarsInquiry } from '../../types/car/car.input';
import TrendCarCard from './TrendCarCard';
import { useMutation, useQuery } from '@apollo/client';
import { GET_CARS } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { LIKE_TARGET_CAR } from '../../../apollo/user/mutation';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import { Message } from '../../enums/common.enum';

interface TrendCarsProps {
	initialInput: CarsInquiry;
}

const TrendCars = (props: TrendCarsProps) => {
 const { t } = useTranslation('common');
	const { initialInput } = props;
	const [trendCars, setTrendCars] = useState<Car[]>([]);

	/** APOLLO REQUESTS **/
	const [likeTargetCar] = useMutation(LIKE_TARGET_CAR, { fetchPolicy: 'no-cache', ignoreResults: true });

	const {
		loading: getCarsLoading,
		data: getCarsData,
		error: getCarsError,
	} = useQuery(GET_CARS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setTrendCars((data?.getCars?.list ?? []).filter((car: Car) => car.carLikes >= 1 && car.carViews >= 2));
		},
	});
useEffect(() => {
		if (!getCarsData?.getCars?.list) return;
		setTrendCars((previous) => previous.map((car) => getCarsData.getCars.list.find((item: Car) => item._id === car._id) ?? car));
	}, [getCarsData]);
/** HANDLERS **/
	const likeCarHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);

			// execute likeTargetCar Mutation
			await likeTargetCar({
				variables: { input: id },
			});

		} catch (err: any) {

			sweetMixinErrorAlert(err.message).then();
		}
	};

	 return (
  <Stack component="section" className="trend-cars trending-cars-section" aria-labelledby="trending-cars-heading">
   <Stack className="container">
    <Stack className="info-box">
     <div className="left">
      <h2 id="trending-cars-heading">{t('Most Loved Cars')}</h2>
      <p>{t('Discover the cars our community loves')}</p>
     </div>
     <div className="loved-actions">
     <Link className="trending-view-all" href={{ pathname: '/car', query: { input: JSON.stringify({ ...initialInput, page: 1, limit: 9 }) } }}>
      {t('View All')} <EastIcon fontSize="small" />
     </Link>
      <div className="loved-controls">
       <IconButton className="swiper-loved-prev" aria-label={t('Previous cars')} disabled={!trendCars.length || !!getCarsError}><ArrowBackIosNewIcon /></IconButton>
       <IconButton className="swiper-loved-next" aria-label={t('Next cars')} disabled={!trendCars.length || !!getCarsError}><ArrowForwardIosIcon /></IconButton>
      </div>
     </div>
    </Stack>
    <Stack className="card-box">
     {getCarsLoading && !getCarsData ? <CircularProgress aria-label={t('Loading cars')} /> :
      getCarsError ? <Alert severity="error">{t('Cars could not be loaded. Please try again.')}</Alert> :
      trendCars.length === 0 ? <div className="empty-list">{t('No trending cars yet.')}</div> :
      <Swiper className="trend-car-swiper" slidesPerView={1.15} spaceBetween={16}
       breakpoints={{ 600: { slidesPerView: 2, spaceBetween: 20 }, 1440: { slidesPerView: 4, spaceBetween: 24 } }}
       navigation={{ prevEl: '.swiper-loved-prev', nextEl: '.swiper-loved-next' }} watchOverflow
       modules={[Navigation, Keyboard, A11y]} keyboard={{ enabled: true, onlyInViewport: true }}
       a11y={{ prevSlideMessage: t('Previous cars'), nextSlideMessage: t('Next cars') }}>
       {trendCars.map((car) => (
        <SwiperSlide key={car._id} className="trend-car-slide">
         <TrendCarCard car={car} likeCarHandler={likeCarHandler} />
        </SwiperSlide>
       ))}
      </Swiper>}
    </Stack>
   </Stack>
  </Stack>
 );
};

TrendCars.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'carLikes',
		direction: Direction.DESC,
		search: {},
	},
};

export default TrendCars;
