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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';

interface CarCardType {
	browse?: boolean;
	car: Car;
	likeCarHandler?: any;
	myFavorites?: boolean;
	recentlyVisited?: boolean;
}

type BrowseCarCardType = Omit<CarCardType, 'browse' | 'likeCarHandler'> & {
	browse: true;
	likeCarHandler?: (user: { _id: string }, id: string) => void | Promise<void>;
};

const CarCard = (props: (CarCardType & { browse?: false }) | BrowseCarCardType) => {
	const { t } = useTranslation('common');
	const { car, likeCarHandler, myFavorites, recentlyVisited, browse } = props;
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const imagePath: string = car?.carImages[0] ? imageUrl(car?.carImages[0]) : '/img/car/hero.svg';
	const [favoritePending, setFavoritePending] = React.useState(false);
	if (browse) {
		const liked = Boolean(myFavorites || car.meLiked?.[0]?.myFavorite);
		const href = { pathname: '/car/detail', query: { id: car._id } };
		const toggleFavorite = async () => {
			if (!likeCarHandler || favoritePending) return;
			setFavoritePending(true);
			try { await likeCarHandler(user, car._id); } finally { setFavoritePending(false); }
		};
		return (
			<Stack component="article" className="cars-listing-card">
				<div className="cars-listing-photo">
					<Link href={href} aria-label={car.carTitle}>
						<img
							src={imagePath}
							alt={car.carTitle}
							onError={(e) => {
								if (!e.currentTarget.src.endsWith('/img/car/hero.svg')) e.currentTarget.src = '/img/car/hero.svg';
							}}
						/>
					</Link>
					<IconButton
						className="cars-listing-favorite"
						aria-label={t(liked ? 'Remove favorite' : 'Add favorite')}
						aria-pressed={liked}
						disabled={!likeCarHandler || favoritePending}
						aria-busy={favoritePending}
						onClick={() => void toggleFavorite()}
					>
						{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
					</IconButton>
					<span className="cars-photo-count" aria-label={`${t('Photos')}: ${car.carImages.length}`}>
						<PhotoCameraOutlinedIcon />
						{car.carImages.length}
					</span>
				</div>
				<div className="cars-listing-content">
					<div className="cars-listing-title">
						<Link href={href} title={car.carTitle}>
							<Typography component="h2">{car.carTitle}</Typography>
						</Link>
						<span className="cars-listing-type">
							{[car.carRent && t('Rent'), car.carBarter && t('Barter')].filter(Boolean).join(' / ') || t('Sale')}
						</span>
					</div>
					<div className="cars-listing-location">
						<LocationOnIcon />
						<span>
							{t(carLabel(car.carLocation))}, {t('Korea')}
						</span>
					</div>
					<div className="cars-listing-specs">
						<span>{car.carYear}</span>
						<span>{t(carLabel(car.carFuelType))}</span>
						<span>{t(carLabel(car.carTransmission))}</span>
						{car.carMileage != null && <span>{formatterStr(car.carMileage)} km</span>}
					</div>
					<Typography className="cars-listing-price">${formatterStr(car.carPrice)}</Typography>
					<div className="cars-listing-stats">
						<span>
							<RemoveRedEyeIcon />
							{formatterStr(car.carViews)}
						</span>
						<span>
							<FavoriteBorderIcon />
							{formatterStr(car.carLikes)}
						</span>
					</div>
				</div>
			</Stack>
		);
	}

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
							<Typography>{t('TOP')}</Typography>
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
							<img src="/img/icons/transmission.svg" alt="" />{' '}
							<Typography>{t(carLabel(car.carTransmission ?? ''))}</Typography>
						</Stack>
					</Stack>
					<Stack className="divider"></Stack>
					<Stack className="type-buttons">
						<Stack className="type">
							<Typography sx={{ fontWeight: 500, fontSize: '13px' }} className={car.carRent ? '' : 'disabled-type'}>
								{t('Rent')}
							</Typography>
							<Typography sx={{ fontWeight: 500, fontSize: '13px' }} className={car.carBarter ? '' : 'disabled-type'}>
								{t('Barter')}
							</Typography>
						</Stack>
						{!recentlyVisited && (
							<Stack className="buttons">
								<IconButton color={'default'}>
									<RemoveRedEyeIcon />
								</IconButton>
								<Typography className="view-cnt">{car?.carViews}</Typography>
								<IconButton
									color={'default'}
									aria-label={t(myFavorites || car.meLiked?.[0]?.myFavorite ? 'Remove favorite' : 'Add favorite')}
									disabled={!likeCarHandler}
									onClick={() => likeCarHandler?.(user, car._id)}
								>
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
