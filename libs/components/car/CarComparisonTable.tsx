import React, { useState } from 'react';
import Link from 'next/link';
import { FormControlLabel, Switch } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { Car } from '../../types/car/car';
import { carLabel } from '../../car';
import { formatCarMileage, formatCarPrice } from '../../carCompare';
import CompareCarCard from './CompareCarCard';

const CarComparisonTable = ({
	cars,
	onRemove,
	detailed = false,
	differences,
	highlight = true,
}: {
	cars: Car[];
	onRemove: (id: string) => void;
	detailed?: boolean;
	differences?: boolean;
	highlight?: boolean;
}) => {
	const { t, i18n } = useTranslation('common');
	const [differencesOnly, setDifferencesOnly] = useState(false);
	const [expanded, setExpanded] = useState<string[]>([
		'Vehicle specifications',
		'Powertrain',
		'Appearance and location',
		'Buying options',
	]);
	const rows: { label: string; value: (car: Car) => string | number }[] = [
		{ label: 'Price', value: (car) => formatCarPrice(car.carPrice, i18n.language) },
		{ label: 'Brand', value: (car) => car.brandData?.brandName ?? t('Not provided') },
		{ label: 'Model', value: (car) => car.carModel },
		{ label: 'Year', value: (car) => car.carYear },
		{ label: 'Mileage', value: (car) => formatCarMileage(car, i18n.language) ?? '\u2014' },
		{ label: 'Condition', value: (car) => t(carLabel(car.carCondition)) },
		{ label: 'Fuel', value: (car) => t(carLabel(car.carFuelType)) },
		{ label: 'Transmission', value: (car) => t(carLabel(car.carTransmission)) },
		{ label: 'Color', value: (car) => car.carColor },
		{ label: 'Location', value: (car) => t(carLabel(car.carLocation)) },
		{ label: 'Available for barter', value: (car) => t(car.carBarter ? 'Yes' : 'No') },
		{ label: 'Available for rent', value: (car) => t(car.carRent ? 'Yes' : 'No') },
	];
	const visibleRows = rows.filter((row) => !(differences ?? differencesOnly) || new Set(cars.map(row.value)).size > 1);
	if (detailed) {
		const groups = [
			{ name: 'Vehicle specifications', labels: ['Price', 'Brand', 'Model', 'Year', 'Mileage', 'Condition'] },
			{ name: 'Powertrain', labels: ['Fuel', 'Transmission'] },
			{ name: 'Appearance and location', labels: ['Color', 'Location'] },
			{ name: 'Buying options', labels: ['Available for barter', 'Available for rent'] },
		];
		return (
			<section className="compare-specifications" id="compare-specifications" aria-labelledby="compare-spec-heading">
				<div className="compare-section-heading">
					<div>
						<h2 id="compare-spec-heading">{t('Specifications')}</h2>
						<p>{t('Compare the details side by side.')}</p>
					</div>
					<button
						type="button"
						onClick={() => setExpanded(expanded.length === groups.length ? [] : groups.map((group) => group.name))}
					>
						{t(expanded.length === groups.length ? 'Collapse all' : 'Expand all')}
					</button>
				</div>
				{groups.map((group) => {
					const entries = visibleRows.filter((row) => group.labels.includes(row.label));
					const open = expanded.includes(group.name);
					return (
						<div className="compare-spec-group" key={group.name}>
							<button
								type="button"
								className="compare-group-heading"
								aria-expanded={open}
								aria-controls={`compare-group-${groups.indexOf(group)}`}
								onClick={() =>
									setExpanded((previous) =>
										open ? previous.filter((name) => name !== group.name) : [...previous, group.name],
									)
								}
							>
								<span>{t(group.name)}</span>
								<span aria-hidden="true">{open ? '−' : '+'}</span>
							</button>
							<div hidden={!open} id={`compare-group-${groups.indexOf(group)}`}>
								{entries.length ? (
									<div className="compare-table-scroll" tabIndex={0} role="region" aria-label={t(group.name)}>
										<table className={`compare-table compare-table-${cars.length}-cars`}>
											<caption className="compare-sr-only">{t(group.name)}</caption>
											<thead>
												<tr>
													<th scope="col">{t('Specification')}</th>
													{cars.map((car) => (
														<th scope="col" key={car._id}>
															{car.carTitle}
														</th>
													))}
												</tr>
											</thead>
											<tbody>
												{entries.map((row) => (
													<tr
														key={row.label}
														className={highlight && new Set(cars.map(row.value)).size > 1 ? 'compare-different' : ''}
													>
														<th scope="row">{t(row.label)}</th>
														{cars.map((car) => (
															<td key={car._id}>{row.value(car)}</td>
														))}
													</tr>
												))}
											</tbody>
										</table>
									</div>
								) : (
									<p className="compare-matching">{t('These cars have matching specifications.')}</p>
								)}
							</div>
						</div>
					);
				})}
			</section>
		);
	}

	return (
		<div className="compare-results">
			<div className="compare-results-toolbar">
				<p>{t('See the details that make a difference.')}</p>
				<FormControlLabel
					control={<Switch checked={differencesOnly} onChange={(_, checked) => setDifferencesOnly(checked)} />}
					label={t('Show differences only')}
				/>
			</div>
			<div className="compare-table-scroll" tabIndex={0} role="region" aria-label={t('Car comparison table')}>
				<table className={`compare-table compare-table-${cars.length}-cars`}>
					<caption className="compare-sr-only">{t('Specifications and prices side by side')}</caption>
					<thead>
						<tr>
							<th scope="col" className="compare-row-label">
								<span>{t('At a glance')}</span>
								<p>{t('Specifications and prices side by side')}</p>
							</th>
							{cars.map((car) => (
								<th scope="col" key={car._id}>
									<CompareCarCard car={car} compact onRemove={() => onRemove(car._id)} />
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{visibleRows.map((row) => {
							const differs = new Set(cars.map(row.value)).size > 1;
							return (
								<tr key={row.label} className={differs ? 'compare-different' : ''}>
									<th scope="row">{t(row.label)}</th>
									{cars.map((car) => (
										<td key={car._id}>{row.value(car)}</td>
									))}
								</tr>
							);
						})}
					</tbody>
					<tfoot>
						<tr>
							<th scope="row">{t('Explore each car')}</th>
							{cars.map((car) => (
								<td key={car._id}>
									<Link
										passHref
										href={{ pathname: '/car/detail', query: { id: car._id } }}
										className="compare-details-link"
										aria-label={t('View details for {{car}}', { car: car.carTitle })}
									>
										{t('View full details')}
									</Link>
								</td>
							))}
						</tr>
					</tfoot>
				</table>
			</div>
			{!visibleRows.length && <p className="compare-status">{t('These cars have matching specifications.')}</p>}
		</div>
	);
};

export default CarComparisonTable;
