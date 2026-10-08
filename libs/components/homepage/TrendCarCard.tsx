import { useTranslation } from 'next-i18next';
import { imageUrl } from '../../config';
import { carLabel } from '../../car';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Stack, IconButton } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BoltIcon from '@mui/icons-material/Bolt';
import { Car } from '../../types/car/car';
import { CustomJwtPayload } from '../../types/customJwtPayload';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';

interface TrendCarCardProps {
 car: Car;
 likeCarHandler: (user: CustomJwtPayload, id: string) => Promise<void>;
}

const TrendCarCard = ({ car, likeCarHandler }: TrendCarCardProps) => {
 const { t } = useTranslation('common');
 const user = useReactiveVar(userVar);
 const detail = { pathname: '/car/detail', query: { id: car._id } };
 const liked = !!car.meLiked?.[0]?.myFavorite;
 const saleType = car.carRent && car.carBarter ? 'Rent / Barter' : car.carRent ? 'Rent' : car.carBarter ? 'Barter' : 'Sale';

 /** HANDLERS **/
 const handleLikeClick = (event: React.MouseEvent) => {
  event.stopPropagation();
  void likeCarHandler(user, car._id);
 };

 return (
  <Stack className="trend-card-box">
   <Link className="card-img" href={detail} aria-label={car.carTitle}>
    <Image src={imageUrl(car.carImages[0])} alt={car.carTitle} fill
     sizes="(max-width: 600px) 280px, (max-width: 1200px) 320px, 360px" unoptimized />
    <span className="trending-top"><BoltIcon fontSize="small" />{t('TOP')}</span>
    <span className="trending-price">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(car.carPrice)}</span>
   </Link>
   <div className="info">
    {car.brandData && <div className="trending-brand">
     {car.brandData.brandLogo && <Image src={imageUrl(car.brandData.brandLogo)} alt="" width={28} height={28} unoptimized
      onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
     <span>{car.brandData.brandName}</span>
    </div>}
    <Link className="title" href={detail}>{car.carModel || car.carTitle}</Link>
    <div className="trending-location"><LocationOnIcon fontSize="small" />{t(carLabel(car.carLocation))}, {t('Korea')}</div>
    <div className="options">
     <span><CalendarMonthOutlinedIcon fontSize="small" />{car.carYear}</span>
     <span><SettingsOutlinedIcon fontSize="small" />{t(carLabel(car.carTransmission))}</span>
     <span><LocalGasStationOutlinedIcon fontSize="small" />{t(carLabel(car.carFuelType))}</span>
    </div>
    <div className="bott">
     <span className="trending-sale"><SwapHorizIcon fontSize="small" />{t(saleType)}</span>
     <div className="view-like-box">
      <span className="trending-views"><RemoveRedEyeIcon fontSize="small" />{car.carViews}</span>
      <IconButton className="trending-like" onClick={handleLikeClick} aria-label={t(liked ? 'Unlike car' : 'Like car')} aria-pressed={liked}>
       <FavoriteIcon fontSize="small" sx={{ color: liked ? '#fa3c16' : 'inherit' }} />
      </IconButton>
      <span>{car.carLikes}</span>
     </div>
    </div>
   </div>
  </Stack>
 );
};

export default TrendCarCard;
