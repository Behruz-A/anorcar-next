import React from 'react';
import { useTranslation } from 'next-i18next';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import { Car } from '../../types/car/car';
import { formatCarPrice } from '../../carCompare';

export default function CompareHighlights({ cars }: { cars: Car[] }) {
	const { t, i18n } = useTranslation('common');
	if (cars.length < 2) return null;
	const priceGap = Math.max(...cars.map((car) => car.carPrice)) - Math.min(...cars.map((car) => car.carPrice));
	const mileages = cars
		.map((car) => car.carMileage)
		.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
	const mileageGap = mileages.length > 1 ? Math.max(...mileages) - Math.min(...mileages) : null;
	const years = cars.map((car) => car.carYear);
	const minYear = Math.min(...years),
		maxYear = Math.max(...years);
	return (
		<section className="compare-highlights" aria-labelledby="compare-highlights-heading">
			<div className="compare-section-heading">
				<h2 id="compare-highlights-heading">{t('Comparison summary')}</h2>
				<p>{t('A quick look at the key differences.')}</p>
			</div>
			<div className="compare-highlight-grid">
				<article>
					<div>
						<span>{t('Price difference')}</span>
						<PaymentsOutlinedIcon />
					</div>
					<strong>{formatCarPrice(priceGap, i18n.language)}</strong>
					<p>{t('Between the lowest and highest listed prices.')}</p>
				</article>
				<article>
					<div>
						<span>{t('Mileage difference')}</span>
						<SpeedOutlinedIcon />
					</div>
					<strong>
						{mileageGap === null
							? t('Not provided')
							: `${mileageGap.toLocaleString(i18n.language === 'kr' ? 'ko-KR' : i18n.language)} km`}
					</strong>
					<p>{t('Based on cars with reported mileage.')}</p>
				</article>
				<article>
					<div>
						<span>{t('Model years')}</span>
						<CalendarMonthOutlinedIcon />
					</div>
					<strong>{minYear === maxYear ? minYear : `${minYear}–${maxYear}`}</strong>
					<p>{t('The model years of your selected cars.')}</p>
				</article>
			</div>
		</section>
	);
}
