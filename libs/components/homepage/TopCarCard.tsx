import { useTranslation } from 'next-i18next';
import { imageUrl } from '../../config';
import { carLabel } from '../../car';
import React from 'react';
import { Stack, Box, Divider, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Car } from '../../types/car/car';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { REACT_APP_API_URL } from '../../config';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';

interface TopCarCardProps {
	car: Car;
	likeCarHandler: any;
}

const TopCarCard = (props: TopCarCardProps) => {
 const { t } = useTranslation('common');
	const { car, likeCarHandler } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);

	/** HANDLERS **/

	const pushDetailHandler = async (carId: string) => {
		console.log('ID:', carId);
		await router.push({ pathname: `/car/detail`, query: { id: carId } });
	};

	if (device === 'mobile') {
		return (
			<Stack className="top-card-box">
				<Box
					component={'div'}
					className={'card-img'}
					style={{ backgroundImage: `url(${imageUrl(car?.carImages[0])})` }}
					onClick={() => pushDetailHandler(String(car?._id))}
				>
					<div>${car?.carPrice}</div>
				</Box>
				<Box component={'div'} className={'info'}>
					<strong className={'title'} onClick={() => pushDetailHandler(String(car?._id))}>
						{car?.carTitle}
					</strong>
					<p className={'desc'}>{car?.carAddress}</p>
					<div className={'options'}>
						<div>
							<img src="/img/icons/car.svg" alt="" />
							<span>{car?.carYear} year</span>
						</div>
						<div>
							<img src="/img/icons/fuel.svg" alt="" />
							<span>{t(carLabel(car?.carFuelType ?? ''))}</span>
						</div>
						<div>
							<img src="/img/icons/transmission.svg" alt="" />
							<span>{t(carLabel(car?.carTransmission ?? ''))}</span>
						</div>
					</div>
					<Divider sx={{ mt: '15px', mb: '17px' }} />
					<div className={'bott'}>
						<p>
							{' '}
							{car.carRent ? 'Rent' : ''} {car.carRent && car.carBarter && '/'}{' '}
							{car.carBarter ? 'Barter' : ''}
						</p>
						<div className="view-like-box">
							<IconButton color={'default'}>
								<RemoveRedEyeIcon />
							</IconButton>
							<Typography className="view-cnt">{car?.carViews}</Typography>
							<IconButton color={'default'} onClick={() => likeCarHandler(user, car?._id)}>
								{car?.meLiked && car?.meLiked[0]?.myFavorite ? (
									<FavoriteIcon style={{ color: 'red' }} />
								) : (
									<FavoriteIcon />
								)}
							</IconButton>
							<Typography className="view-cnt">{car?.carLikes}</Typography>
						</div>
					</div>
				</Box>
			</Stack>
		);
	} else {
		return (
			<Stack className="top-card-box">
				<Box
					component={'div'}
					className={'card-img'}
					style={{ backgroundImage: `url(${imageUrl(car?.carImages[0])})` }}
					onClick={() => pushDetailHandler(String(car?._id))}
				>
					<div>${car?.carPrice}</div>
				</Box>
				<Box component={'div'} className={'info'}>
					<strong className={'title'} onClick={() => pushDetailHandler(String(car?._id))}>
						{car?.carTitle}
					</strong>
					<p className={'desc'}>{car?.carAddress}</p>
					<div className={'options'}>
						<div>
							<img src="/img/icons/car.svg" alt="" />
							<span>{car?.carYear} year</span>
						</div>
						<div>
							<img src="/img/icons/fuel.svg" alt="" />
							<span>{t(carLabel(car?.carFuelType ?? ''))}</span>
						</div>
						<div>
							<img src="/img/icons/transmission.svg" alt="" />
							<span>{t(carLabel(car?.carTransmission ?? ''))}</span>
						</div>
					</div>
					<Divider sx={{ mt: '15px', mb: '17px' }} />
					<div className={'bott'}>
						<p>
							{' '}
							{car.carRent ? 'Rent' : ''} {car.carRent && car.carBarter && '/'}{' '}
							{car.carBarter ? 'Barter' : ''}
						</p>
						<div className="view-like-box">
							<IconButton color={'default'}>
								<RemoveRedEyeIcon />
							</IconButton>
							<Typography className="view-cnt">{car?.carViews}</Typography>
							<IconButton color={'default'} onClick={() => likeCarHandler(user, car?._id)}>
								{car?.meLiked && car?.meLiked[0]?.myFavorite ? (
									<FavoriteIcon style={{ color: 'red' }} />
								) : (
									<FavoriteIcon />
								)}
							</IconButton>
							<Typography className="view-cnt">{car?.carLikes}</Typography>
						</div>
					</div>
				</Box>
			</Stack>
		);
	}
};

export default TopCarCard;
