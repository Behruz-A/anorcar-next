import { useTranslation } from 'next-i18next';
import React, { useState } from 'react';
import { Stack, Box, Alert, CircularProgress } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import TopCarCard from './TopCarCard';
import { CarsInquiry } from '../../types/car/car.input';
import { Car } from '../../types/car/car';
import { useMutation, useQuery } from '@apollo/client';
import { GET_CARS } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { LIKE_TARGET_CAR } from '../../../apollo/user/mutation';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { Message } from '../../enums/common.enum';

interface TopCarsProps {
	initialInput: CarsInquiry;
}

const TopCars = (props: TopCarsProps) => {
 const { t } = useTranslation('common');
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [topCars, setTopCars] = useState<Car[]>([]);

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
			setTopCars(data?.getCars?.list);
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

	if (device === 'mobile') {
		return (
			<Stack className={'top-cars'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>{t("Top cars")}</span>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'top-car-swiper'}
							slidesPerView={'auto'}
							centeredSlides={true}
							spaceBetween={15}
							modules={[Autoplay]}
						>
							{topCars.map((car: Car) => {
								return (
									<SwiperSlide className={'top-car-slide'} key={car?._id}>
										<TopCarCard car={car} likeCarHandler={likeCarHandler} />
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
			<Stack className={'top-cars'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>{t("Top cars")}</span>
							<p>{t("Check out our Top Cars")}</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'pagination-box'}>
								<WestIcon className={'swiper-top-prev'} />
								<div className={'swiper-top-pagination'}></div>
								<EastIcon className={'swiper-top-next'} />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'top-car-swiper'}
							slidesPerView={'auto'}
							spaceBetween={15}
							modules={[Autoplay, Navigation, Pagination]}
							navigation={{
								nextEl: '.swiper-top-next',
								prevEl: '.swiper-top-prev',
							}}
							pagination={{
								el: '.swiper-top-pagination',
							}}
						>
							{topCars.map((car: Car) => {
								return (
									<SwiperSlide className={'top-car-slide'} key={car?._id}>
										<TopCarCard car={car} likeCarHandler={likeCarHandler} />
									</SwiperSlide>
								);
							})}
						</Swiper>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

TopCars.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'carRank',
		direction: 'DESC',
		search: {},
	},
};

export default TopCars;
