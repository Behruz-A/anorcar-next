import { useTranslation } from 'next-i18next';
import React, { useState } from 'react';
import { Stack, Alert, CircularProgress } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Link from 'next/link';
import { Direction } from '../../enums/common.enum';
import EastIcon from '@mui/icons-material/East';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Keyboard } from 'swiper';
import { Car } from '../../types/car/car';
import { CarsInquiry } from '../../types/car/car.input';
import TrendCarCard from './TrendCarCard';
import { useMutation, useQuery } from '@apollo/client';
import { GET_CARS } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { LIKE_TARGET_CAR } from '../../../apollo/user/mutation';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { Message } from '../../enums/common.enum';

interface TrendCarsProps {
	initialInput: CarsInquiry;
}

const TrendCars = (props: TrendCarsProps) => {
 const { t } = useTranslation('common');
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [trendCars, setTrendCars] = useState<Car[]>([]);

	/** APOLLO REQUESTS **/
	const [likeTargetCar] = useMutation(LIKE_TARGET_CAR);

	const {
		loading: getCarsLoading,
		data: getCarsData,
		error: getCarsError,
		refetch: getCarsRefetch,
	} = useQuery(GET_CARS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setTrendCars((data?.getCars?.list ?? []).filter((car: Car) => car.carLikes >= 1 && car.carViews >= 2));
		},
	});
/** HANDLERS **/
	const likeCarHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);

			// execute likeTargetCar Mutation
			await likeTargetCar({
				variables: { input: id },
			});
			await getCarsRefetch({ input: initialInput });
			// execute getCarsRefetch

			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeCarHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	 return (
  <Stack component="section" className="trend-cars trending-cars-section" aria-labelledby="trending-cars-heading">
   <Stack className="container">
    <Stack className="info-box">
     <div className="left">
      <h2 id="trending-cars-heading">{t('Trending Cars')}</h2>
      <p>{t('Trend is based on likes')}</p>
     </div>
     <Link className="trending-view-all" href={{ pathname: '/car', query: { input: JSON.stringify({ ...initialInput, page: 1, limit: 9 }) } }}>
      {t('View All')} <EastIcon fontSize="small" />
     </Link>
    </Stack>
    <Stack className="card-box">
     {getCarsLoading && !getCarsData ? <CircularProgress aria-label={t('Loading cars')} /> :
      getCarsError ? <Alert severity="error">{t('Cars could not be loaded. Please try again.')}</Alert> :
      trendCars.length === 0 ? <div className="empty-list">{t('No trending cars yet.')}</div> :
      <Swiper className="trend-car-swiper" slidesPerView="auto" spaceBetween={device === 'mobile' ? 16 : 24}
       modules={[Keyboard, A11y]} keyboard={{ enabled: true, onlyInViewport: true }}>
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
