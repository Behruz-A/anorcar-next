import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Car } from '../../types/car/car';
import { imageUrl } from '../../config';
import { carLabel } from '../../car';

const RecentlyAddedCarCard = ({ car }: { car: Car }) => {
	const { t } = useTranslation('common');
	const [imageFailed, setImageFailed] = useState(false);
	const modelName = car.carModel || car.carTitle;
	const vehicleName = [car.brandData?.brandName, modelName].filter(Boolean).join(' ');
	return (
		<Link passHref className="recent-car-card" href={{ pathname: '/car/detail', query: { id: car._id } }} aria-label={vehicleName} title={vehicleName}>
			<div className="recent-car-image">
				<Image src={imageFailed ? imageUrl(null) : imageUrl(car.carImages[0])} alt={car.carTitle} fill unoptimized
					onError={() => setImageFailed(true)}
					sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 360px" />
			</div>
			<div className="recent-car-info">
				<div className="recent-brand">
					{car.brandData?.brandLogo && <Image src={imageUrl(car.brandData.brandLogo)} alt="" width={28} height={28} unoptimized
						onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} />}
					{car.brandData && <span>{car.brandData.brandName}</span>}
				</div>
				<h3>{modelName}</h3>
				<strong className="recent-price">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(car.carPrice)}</strong>
				<div className="recent-specs">
					<span><CalendarMonthOutlinedIcon /><span>{car.carYear}</span></span>
					<span><LocalGasStationOutlinedIcon /><span>{t(carLabel(car.carFuelType))}</span></span>
					<span className="recent-transmission"><SettingsOutlinedIcon /><span>{t(carLabel(car.carTransmission))}</span></span>
				</div>
				<div className="recent-location"><LocationOnIcon /><span>{t(carLabel(car.carLocation))}</span></div>
			</div>
		</Link>
	);
};

export default RecentlyAddedCarCard;
