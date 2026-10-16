import { formatPrice } from '../../currency';
import { useTranslation } from 'next-i18next';
import { imageUrl } from '../../config';
import { carLabel } from '../../car';
import React from 'react';
import { Stack, Typography, Box } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Car } from '../../types/car/car';
import Link from 'next/link';
import { topCarRank } from '../../config';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import IconButton from '@mui/material/IconButton';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import EastIcon from '@mui/icons-material/East';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BalanceOutlinedIcon from '@mui/icons-material/BalanceOutlined';
import ElectricBoltOutlinedIcon from '@mui/icons-material/ElectricBoltOutlined';
import { availableCompareCar } from '../../compareSelection';
import { CustomJwtPayload } from '../../types/customJwtPayload';
import { CarStatus, CarCondition, CarFuelType } from '../../enums/car.enum';

interface CarCardType {
	browse?: boolean;
	variant?: 'recent' | 'trending';
	car: Car;
	likeCarHandler?: (user: CustomJwtPayload, id: string) => void | Promise<void>;
	myFavorites?: boolean;
	recentlyVisited?: boolean;
}

type BrowseCarCardType = Omit<CarCardType, 'browse' | 'likeCarHandler'> & {
	browse: true;
	likeCarHandler?: CarCardType['likeCarHandler'];
};

const CarCard = (props: (CarCardType & { browse?: false }) | BrowseCarCardType) => {
	const { t } = useTranslation('common');
	const { car, likeCarHandler, myFavorites, recentlyVisited, browse, variant } = props;
	const user = useReactiveVar(userVar);
	const imagePath: string = car?.carImages?.[0] ? imageUrl(car?.carImages?.[0]) : '/img/car/hero.svg';
	const [favoritePending, setFavoritePending] = React.useState(false);
	const [imageFailed, setImageFailed] = React.useState(false);
	const [photoIndex, setPhotoIndex] = React.useState(0);
	React.useEffect(() => { setPhotoIndex(0); setImageFailed(false); }, [car._id]);
	if (browse || variant) {
		const liked = Boolean(myFavorites || car.meLiked?.[0]?.myFavorite);
		const href = { pathname: '/car/detail', query: { id: car._id } };
		const brand = car.brandData?.brandName?.trim();
		const model = car.carModel?.trim();
		const name = model ? [brand && !model.toLowerCase().startsWith(brand.toLowerCase()) ? brand : '', model].filter(Boolean).join(' ') : car.carTitle;
		const badge = car.carStatus === CarStatus.SOLD ? 'Sold' : car.carStatus === CarStatus.DELETE ? 'Deleted' :
			[CarCondition.NEW, CarCondition.USED].includes(car.carCondition) ? carLabel(car.carCondition) : undefined;
		const toggleFavorite = async (event: React.MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
			if (!likeCarHandler || favoritePending) return;
			setFavoritePending(true);
			try { await likeCarHandler(user, car._id); } finally { setFavoritePending(false); }
		};
		if (variant === 'recent') {
			const images = car.carImages ?? [];
			const currentPhoto = photoIndex % Math.max(images.length, 1);
			const changePhoto = (step: number) => {
				setPhotoIndex((index) => (index + step + images.length) % images.length);
				setImageFailed(false);
			};
			const specs = [
				{ label: 'Mileage', value: car.carMileage != null ? `${car.carMileage.toLocaleString('en-US')} km` : t('Not provided'), icon: <SpeedOutlinedIcon /> },
				{ label: 'Fuel', value: car.carFuelType ? t(carLabel(car.carFuelType)) : t('Not provided'), icon: car.carFuelType === CarFuelType.ELECTRIC ? <ElectricBoltOutlinedIcon /> : <LocalGasStationOutlinedIcon /> },
				{ label: 'Transmission', value: car.carTransmission ? t(carLabel(car.carTransmission)) : t('Not provided'), icon: <SettingsOutlinedIcon /> },
			];
			return (
				<Stack component="article" className="cars-listing-card vehicle-card vehicle-card--recent recent-car-card">
					<div className="cars-listing-photo recent-car-image">
						<div className="recent-photo-frame">
							<img key={images[currentPhoto]} src={imageFailed ? imageUrl(null) : imageUrl(images[currentPhoto])} alt={name} loading="lazy" onError={() => setImageFailed(true)} />
						</div>
						<div className="recent-photo-badges">
							{badge && <span className="cars-listing-badge">{t(badge)}</span>}
							{car.carFuelType === CarFuelType.ELECTRIC && <span className="recent-electric-badge"><ElectricBoltOutlinedIcon />{t(carLabel(car.carFuelType))}</span>}
						</div>
						{likeCarHandler && <IconButton className="cars-listing-favorite" aria-label={t(liked ? 'Remove favorite' : 'Add favorite')} aria-pressed={liked}
							disabled={favoritePending} aria-busy={favoritePending} onClick={event => void toggleFavorite(event)}>{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}</IconButton>}
						{images.length > 0 && <span className="cars-photo-count" aria-label={`${t('Photos')}: ${currentPhoto + 1} / ${images.length}`}><PhotoCameraOutlinedIcon />{currentPhoto + 1} / {images.length}</span>}
						{images.length > 1 && <div className="recent-photo-controls swiper-no-swiping" onClick={event => event.stopPropagation()}>
							<IconButton aria-label={t('Previous photo for {{car}}', { car: name })} onClick={() => changePhoto(-1)}><ChevronLeftIcon /></IconButton>
							<IconButton aria-label={t('Next photo for {{car}}', { car: name })} onClick={() => changePhoto(1)}><ChevronRightIcon /></IconButton>
						</div>}
					</div>
					<div className="cars-listing-content">
						<div className="cars-listing-title"><Typography component="h3">{name}</Typography></div>
						<div className="recent-car-meta">
							<span className="cars-listing-year">{car.carYear > 0 ? car.carYear : t('Not provided')}</span>
							{car.carLocation && <span className="cars-listing-location"><LocationOnIcon />{t(carLabel(car.carLocation))}</span>}
						</div>
						<Typography className="cars-listing-price">{formatPrice(car.carPrice)}</Typography>
						<dl className="recent-spec-grid">{specs.map(({ label, value, icon }) => <div key={label}><dt>{t(label)}</dt><dd>{icon}<span>{value}</span></dd></div>)}</dl>
						<div className="recent-card-actions">
							{availableCompareCar(car) ? <Link className="recent-compare" href={{ pathname: '/car/compare', query: { ids: car._id } }} aria-label={t('Add {{car}} to comparison', { car: name })}><BalanceOutlinedIcon />{t('Compare')}</Link> : <span className="recent-compare" aria-disabled="true"><BalanceOutlinedIcon />{t('Compare')}</span>}
							<Link className="recent-details" href={href}>{t('View Details')}<EastIcon /></Link>
						</div>
					</div>
				</Stack>
			);
		}
		return (
			<Stack component="article" className={`cars-listing-card vehicle-card${variant ? ` vehicle-card--${variant}` : ''}`}>
				<div className="cars-listing-photo">
					<Link href={href} tabIndex={-1} aria-label={name}>
						<img src={imageFailed ? imageUrl(null) : imageUrl(car.carImages?.[0])} alt={name} loading="lazy"
							onError={() => setImageFailed(true)} />
					</Link>
					{badge && <span className="cars-listing-badge">{t(badge)}</span>}
					{likeCarHandler && <IconButton className="cars-listing-favorite"
						aria-label={t(liked ? 'Remove favorite' : 'Add favorite')} aria-pressed={liked}
						disabled={favoritePending} aria-busy={favoritePending} onClick={event => void toggleFavorite(event)}>
						{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
					</IconButton>}
					{variant !== 'trending' && car.carImages?.length > 0 && <span className="cars-photo-count" aria-label={`${t('Photos')}: ${car.carImages.length}`}>
						<PhotoCameraOutlinedIcon />{car.carImages.length}
					</span>}
				</div>
				<div className="cars-listing-content">
					<div className="cars-listing-title">
						<Link href={href} title={name}><Typography component={variant ? 'h3' : 'h2'}>{name}</Typography></Link>
					</div>
					{car.carYear > 0 && <span className="cars-listing-year">{car.carYear}</span>}
					<Typography className="cars-listing-price">{formatPrice(car.carPrice)}</Typography>
					<div className="cars-listing-specs">
						{car.carFuelType && <span title={t('Fuel')}><LocalGasStationOutlinedIcon />{t(carLabel(car.carFuelType))}</span>}
						{car.carTransmission && <span title={t('Transmission')}><SettingsOutlinedIcon />{t(carLabel(car.carTransmission))}</span>}
						{car.carMileage != null && <span className="cars-spec-mileage" title={t('Mileage')}><SpeedOutlinedIcon />{car.carMileage.toLocaleString('en-US')} km</span>}
						{(car.carRent || car.carBarter) && <span className="cars-listing-type">{[car.carRent && t('Rent'), car.carBarter && t('Barter')].filter(Boolean).join(' / ')}</span>}
					</div>
					<div className="cars-listing-footer">
						{car.carLocation && <div className="cars-listing-location"><LocationOnIcon /><span>{t(carLabel(car.carLocation))}</span></div>}
						<div className="cars-listing-stats">
								<span title={t('Views')}><RemoveRedEyeIcon />{car.carViews.toLocaleString('en-US')}</span>
								<span title={t('Likes')}><FavoriteBorderIcon />{car.carLikes.toLocaleString('en-US')}</span>
							</div>
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
						<Typography>{formatPrice(car?.carPrice)}</Typography>
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
