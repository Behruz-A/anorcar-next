import { useTranslation } from 'next-i18next';
import React, { useState } from 'react';
import { Stack, Box, Alert, CircularProgress } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
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
			setTrendCars(data?.getCars?.list);
		},
	});
if (getCarsLoading && !getCarsData) return <Stack sx={{ p: 3 }}><CircularProgress aria-label={t('Loading cars')} /></Stack>;
 if (getCarsError) return <Alert severity="error">{t('Cars could not be loaded. Please try again.')}</Alert>;
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

	if (trendCars) console.log('trendCars: +++++', trendCars);
	if (!trendCars) return null;

	if (device === 'mobile') {
		return (
			<Stack className={'trend-cars'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>{t("Trend Cars")}</span>
					</Stack>
					<Stack className={'card-box'}>
						{trendCars.length === 0 ? (
							<Box component={'div'} className={'empty-list'}>{t("Trends Empty")}</Box>
						) : (
							<Swiper
								className={'trend-car-swiper'}
								slidesPerView={'auto'}
								centeredSlides={true}
								spaceBetween={15}
								modules={[Autoplay]}
							>
								{trendCars.map((car: Car) => {
									return (
										<SwiperSlide key={car._id} className={'trend-car-slide'}>
											{<TrendCarCard car={car} likeCarHandler={likeCarHandler} />}
										</SwiperSlide>
									);
								})}
							</Swiper>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	} else {
		return (
			<Stack className={'trend-cars'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>{t("Trend Cars")}</span>
							<p>{t("Trend is based on likes")}</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'pagination-box'}>
								<WestIcon className={'swiper-trend-prev'} />
								<div className={'swiper-trend-pagination'}></div>
								<EastIcon className={'swiper-trend-next'} />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						{trendCars.length === 0 ? (
							<Box component={'div'} className={'empty-list'}>{t("Trends Empty")}</Box>
						) : (
							<Swiper
								className={'trend-car-swiper'}
								slidesPerView={'auto'}
								spaceBetween={15}
								modules={[Autoplay, Navigation, Pagination]}
								navigation={{
									nextEl: '.swiper-trend-next',
									prevEl: '.swiper-trend-prev',
								}}
								pagination={{
									el: '.swiper-trend-pagination',
								}}
							>
								{trendCars.map((car: Car) => {
									return (
										<SwiperSlide key={car._id} className={'trend-car-slide'}>
											<TrendCarCard car={car} likeCarHandler={likeCarHandler} />
										</SwiperSlide>
									);
								})}
							</Swiper>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

TrendCars.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'carLikes',
		direction: 'DESC',
		search: {},
	},
};

export default TrendCars;
