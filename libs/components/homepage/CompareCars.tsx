import React, { useState } from 'react';
import Image from 'next/image';
import { Button, Stack, Tooltip } from '@mui/material';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Car } from '../../types/car/car';
import { MAX_COMPARE_CARS, selectCompareCar } from '../../carCompare';
import CompareCarCard from '../car/CompareCarCard';
import CarComparePicker from '../car/CarComparePicker';

const CompareCars = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const [slots, setSlots] = useState<(Car | null)[]>(Array(MAX_COMPARE_CARS).fill(null));
	const [pickerSlot, setPickerSlot] = useState<number | null>(null);
	const selected = slots.filter((car): car is Car => car !== null);
	const selectCar = (car: Car) => {
		if (pickerSlot === null) return;
		setSlots((current) => selectCompareCar(current, car, pickerSlot));
		setPickerSlot(null);
	};
	return (
		<Stack component="section" className="compare-cars" aria-labelledby="compare-cars-heading">
			<div className="compare-container">
				<div className="compare-heading">
					<h2 id="compare-cars-heading">{t('Compare Cars')}</h2>
				</div>
				<div className={`compare-selection-grid${selected.length ? ' has-selection' : ''}`}>
					{slots.map((car, index) =>
						car ? (
							<CompareCarCard
								key={car._id}
								car={car}
								onRemove={() => setSlots((current) => current.map((item) => (item?._id === car._id ? null : item)))}
							/>
						) : (
							<div
								key={index}
								data-slot={index}
								className={`compare-empty-slot${index === 2 ? ' compare-optional-slot' : ''}`}
							>
								{index === 2 && <span className="compare-optional-label">({t('Optional').toLowerCase()})</span>}
								<span className="compare-car-silhouette">
									<Image src="/img/car/compare-placeholder.svg" alt="" fill sizes="(max-width: 600px) 320px, 33vw" />
								</span>
								<Tooltip title={t('Add Car to Compare')}>
									<button className="compare-empty-cta" onClick={() => setPickerSlot(index)}>
										{index === 2 ? '+ ' + t('Add more Car to compare') : t('Add Car {{number}}', { number: index + 1 })}
									</button>
								</Tooltip>
							</div>
						),
					)}
				</div>
				<div className="compare-action-bar compare-selection-actions">
					<Button
						className="compare-primary"
						variant="contained"
						disabled={selected.length < 2}
						onClick={() =>
							void router.push({ pathname: '/car/compare', query: { ids: selected.map((car) => car._id).join(',') } })
						}
					>
						{t('Compare Cars')}
					</Button>
				</div>
			</div>
			{pickerSlot !== null && (
				<CarComparePicker selected={selected} onAdd={selectCar} onClose={() => setPickerSlot(null)} />
			)}
		</Stack>
	);
};
export default CompareCars;
