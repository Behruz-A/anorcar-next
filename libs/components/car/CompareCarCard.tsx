import React, { useState } from 'react';
import Image from 'next/image';
import { IconButton } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useTranslation } from 'next-i18next';
import { Car } from '../../types/car/car';
import { imageUrl } from '../../config';
import { carLabel } from '../../car';
import { formatCarMileage, formatCarPrice } from '../../carCompare';

const CompareCarCard = ({ car, onRemove, compact = false }: { car: Car; onRemove: () => void; compact?: boolean }) => {
	const { t, i18n } = useTranslation('common');
	const [imageFailed, setImageFailed] = useState(false);
	const specs = [
		{ label: 'Year', value: car.carYear, icon: <CalendarMonthOutlinedIcon /> },
		{ label: 'Mileage', value: formatCarMileage(car, i18n.language) ?? t('Not provided'), icon: <SpeedOutlinedIcon /> },
		{ label: 'Fuel', value: t(carLabel(car.carFuelType)), icon: <LocalGasStationOutlinedIcon /> },
		{ label: 'Transmission', value: t(carLabel(car.carTransmission)), icon: <SettingsOutlinedIcon /> },
	];

	return (
		<article className={`compare-car-card${compact ? ' compare-car-compact' : ''}`}>
			<div className="compare-car-photo">
				<Image src={imageFailed ? imageUrl(null) : imageUrl(car.carImages[0])} alt={car.carTitle} fill unoptimized
					sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 430px" onError={() => setImageFailed(true)} />
				<IconButton className="compare-remove" onClick={onRemove} aria-label={t('Remove {{car}} from comparison', { car: car.carTitle })}>
					<CloseRoundedIcon fontSize="small" />
				</IconButton>
			</div>
			<div className="compare-car-copy">
				<div className="compare-car-brand">{car.brandData?.brandName ?? car.carTitle}</div>
				<div className="compare-car-name"><h3>{car.carModel}</h3><span>{car.carYear}</span></div>
				<strong className="compare-car-price">{formatCarPrice(car.carPrice, i18n.language)}</strong>
				{!compact && <dl className="compare-car-specs">{specs.map(({ label, value, icon }) => (
					<div key={label}><dt>{icon}{t(label)}</dt><dd>{value}</dd></div>
				))}</dl>}
			</div>
		</article>
	);
};

export default CompareCarCard;
