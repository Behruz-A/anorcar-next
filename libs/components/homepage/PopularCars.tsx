import { useTranslation } from 'next-i18next';
import React, { useState } from 'react';
import { Stack, Box, Alert, CircularProgress } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import PopularCarCard from './PopularCarCard';
import { Car } from '../../types/car/car';
import Link from 'next/link';
import { CarsInquiry } from '../../types/car/car.input';
import { GET_CARS } from '../../../apollo/user/query';
import { useQuery } from '@apollo/client';
import { T } from '../../types/common';

interface PopularCarsProps {
	initialInput: CarsInquiry;
}

const PopularCars = (props: PopularCarsProps) => {
 const { t } = useTranslation('common');
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [popularCars, setPopularCars] = useState<Car[]>([]);

	/** APOLLO REQUESTS **/

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
			setPopularCars(data?.getCars?.list);
		},
	});
if (getCarsLoading && !getCarsData) return <Stack sx={{ p: 3 }}><CircularProgress aria-label={t('Loading cars')} /></Stack>;
 if (getCarsError) return <Alert severity="error">{t('Cars could not be loaded. Please try again.')}</Alert>;
 	/** HANDLERS **/

	if (!popularCars) return null;

	if (device === 'mobile') {
		return (
			<Stack className={'popular-cars'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>{t("Popular cars")}</span>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'popular-car-swiper'}
							slidesPerView={'auto'}
							centeredSlides={true}
							spaceBetween={25}
							modules={[Autoplay]}
						>
							{popularCars.map((car: Car) => {
								return (
									<SwiperSlide key={car._id} className={'popular-car-slide'}>
										<PopularCarCard car={car} />
									</SwiperSlide>
								);
							})}
						</Swiper>
					</Stack>
				</Stack>
			</Stack>
		);
	} else {
		return (
			<Stack className={'popular-cars'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>{t("Popular cars")}</span>
							<p>{t("Popularity is based on views")}</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'more-box'}>
								<Link href={'/car'}>
									<span>{t("See All Categories")}</span>
								</Link>
								<img src="/img/icons/rightup.svg" alt="" />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'popular-car-swiper'}
							slidesPerView={'auto'}
							spaceBetween={25}
							modules={[Autoplay, Navigation, Pagination]}
							navigation={{
								nextEl: '.swiper-popular-next',
								prevEl: '.swiper-popular-prev',
							}}
							pagination={{
								el: '.swiper-popular-pagination',
							}}
						>
							{popularCars.map((car: Car) => {
								return (
									<SwiperSlide key={car._id} className={'popular-car-slide'}>
										<PopularCarCard car={car} />
									</SwiperSlide>
								);
							})}
						</Swiper>
					</Stack>
					<Stack className={'pagination-box'}>
						<WestIcon className={'swiper-popular-prev'} />
						<div className={'swiper-popular-pagination'}></div>
						<EastIcon className={'swiper-popular-next'} />
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

PopularCars.defaultProps = {
	initialInput: {
		page: 1,
		limit: 7,
		sort: 'carViews',
		direction: 'DESC',
		search: {},
	},
};

export default PopularCars;
