import { useTranslation } from 'next-i18next';
import { imageUrl } from '../../config';
import { carLabel } from '../../car';
import React from 'react';
import { Stack, Typography, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Car } from '../../types/car/car';
import Link from 'next/link';
import { formatterStr } from '../../utils';
import { REACT_APP_API_URL, topCarRank } from '../../config';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import IconButton from '@mui/material/IconButton';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';

interface CarCardType {
	car: Car;
	likeCarHandler?: any;
	myFavorites?: boolean;
	recentlyVisited?: boolean;
}

const CarCard = (props: CarCardType) => {
 const { t } = useTranslation('common');
	const { car, likeCarHandler, myFavorites, recentlyVisited } = props;
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const imagePath: string = car?.carImages[0]
		? imageUrl(car?.carImages[0])
		: '/img/car/hero.svg';

	{
		return (
			<Stack className="card-config">
				<Stack className="top">
					<Link
						href={{
							pathname: '/car/detail',
							query: { id: car?._id },
						}}
					>
						<img src={imagePath} alt="" />
					</Link>
					{car && car?.carRank > topCarRank && (
						<Box component={'div'} className={'top-badge'}>
							<img src="/img/icons/electricity.svg" alt="" />
							<Typography>{t("TOP")}</Typography>
						</Box>
					)}
					<Box component={'div'} className={'price-box'}>
						<Typography>${formatterStr(car?.carPrice)}</Typography>
					</Box>
				</Stack>
				<Stack className="bottom">
					<Stack className="name-address">
						<Stack className="name">
							<Link
								href={{
									pathname: '/car/detail',
									query: { id: car?._id },
								}}
							>
								<Typography>{car.carTitle}</Typography>
							</Link>
						</Stack>
						<Stack className="address">
							<Typography>
								{car.carAddress}, {car.carLocation}
							</Typography>
						</Stack>
					</Stack>
					<Stack className="options">
						<Stack className="option">
							<img src="/img/icons/car.svg" alt="" /> <Typography>{car.carYear} year</Typography>
						</Stack>
						<Stack className="option">
							<img src="/img/icons/fuel.svg" alt="" /> <Typography>{t(carLabel(car.carFuelType ?? ''))}</Typography>
						</Stack>
						<Stack className="option">
							<img src="/img/icons/transmission.svg" alt="" /> <Typography>{t(carLabel(car.carTransmission ?? ''))}</Typography>
						</Stack>
					</Stack>
					<Stack className="divider"></Stack>
					<Stack className="type-buttons">
						<Stack className="type">
							<Typography
								sx={{ fontWeight: 500, fontSize: '13px' }}
								className={car.carRent ? '' : 'disabled-type'}
							>{t("Rent")}</Typography>
							<Typography
								sx={{ fontWeight: 500, fontSize: '13px' }}
								className={car.carBarter ? '' : 'disabled-type'}
							>{t("Barter")}</Typography>
						</Stack>
						{!recentlyVisited && (
							<Stack className="buttons">
								<IconButton color={'default'}>
									<RemoveRedEyeIcon />
								</IconButton>
								<Typography className="view-cnt">{car?.carViews}</Typography>
								<IconButton color={'default'} aria-label={t(myFavorites || car.meLiked?.[0]?.myFavorite ? "Remove favorite" : "Add favorite")} disabled={!likeCarHandler} onClick={() => likeCarHandler?.(user, car._id)}>
									{myFavorites ? (
										<FavoriteIcon color="primary" />
									) : car?.meLiked && car?.meLiked[0]?.myFavorite ? (
										<FavoriteIcon color="primary" />
									) : (
										<FavoriteBorderIcon />
									)}
								</IconButton>
								<Typography className="view-cnt">{car?.carLikes}</Typography>
							</Stack>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default CarCard;
