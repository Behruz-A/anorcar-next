import NextImage from 'next/image';
import { formatPrice } from '../../currency';
import { useTranslation } from 'next-i18next';
import { carLabel } from '../../car';
import React from 'react';
import { Stack, Box, Divider, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Car } from '../../types/car/car';
import { imageUrl, topCarRank } from '../../config';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { useRouter } from 'next/router';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';

interface CarBigCardProps {
	car: Car;
	likeCarHandler?: any;
}

const CarBigCard = (props: CarBigCardProps) => {
 const { t } = useTranslation('common');
	const { car, likeCarHandler } = props;

	const user = useReactiveVar(userVar);
	const router = useRouter();
	const likeLock = React.useRef(false);
	const [likePending, setLikePending] = React.useState(false);

	/** HANDLERS ***/
	const goCarDetatilPage = (carId: string) => {
		router.push(`/car/detail?id=${carId}`);
	};

	{
		return (
			<Stack className="car-big-card-box" onClick={() => goCarDetatilPage(car?._id)}>
				<Box
					component={'div'}
					className={'card-img'}
					style={{ backgroundImage: `url(${imageUrl(car?.carImages?.[0])})` }}
				>
					{car?.carRank && car?.carRank >= topCarRank && (
						<div className={'status'}>
							<NextImage width={16} height={14} unoptimized src="/img/icons/electricity.svg" alt="" />
							<span>{t("top")}</span>
						</div>
					)}

					<div className={'price'}>{formatPrice(car?.carPrice)}</div>
				</Box>
				<Box component={'div'} className={'info'}>
					<strong className={'title'}>{car?.carTitle}</strong>
					<p className={'desc'}>{car?.carAddress}</p>
					<div className={'options'}>
						<div>
							<NextImage width={32} height={32} unoptimized src="/img/icons/car.svg" alt="" />
							<span>{car?.carYear} year</span>
						</div>
						<div>
							<NextImage width={32} height={32} unoptimized src="/img/icons/fuel.svg" alt="" />
							<span>{t(carLabel(car?.carFuelType ?? ''))}</span>
						</div>
						<div>
							<NextImage width={32} height={32} unoptimized src="/img/icons/transmission.svg" alt="" />
							<span>{t(carLabel(car?.carTransmission ?? ''))}</span>
						</div>
					</div>
					<Divider sx={{ mt: '15px', mb: '17px' }} />
					<div className={'bott'}>
						<div>
							{car?.carRent ? <p>{t("Rent")}</p> : <span>{t("Rent")}</span>}
							{car?.carBarter ? <p>{t("Barter")}</p> : <span>{t("Barter")}</span>}
						</div>
						<div className="buttons-box">
							<IconButton color={'default'}>
								<RemoveRedEyeIcon />
							</IconButton>
							<Typography className="view-cnt">{car?.carViews}</Typography>
							<IconButton disableRipple disabled={likePending || !likeCarHandler}
								aria-label={t(car.meLiked?.[0]?.myFavorite ? 'Remove favorite' : 'Add favorite')}
								aria-pressed={Boolean(car.meLiked?.[0]?.myFavorite)}
								color={'default'}
								onClick={async (e) => {
									e.preventDefault();
									e.stopPropagation();
									if (likeLock.current || !likeCarHandler) return;
									likeLock.current = true;
									setLikePending(true);
									try { await likeCarHandler(user, car._id); }
									finally { likeLock.current = false; setLikePending(false); }
								}}
							>
								{car?.meLiked && car?.meLiked[0]?.myFavorite ? (
									<FavoriteIcon color="primary" />
								) : (
									<FavoriteBorderIcon />
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

export default CarBigCard;
