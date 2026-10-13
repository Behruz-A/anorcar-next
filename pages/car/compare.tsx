import React, { useEffect, useRef, useState } from 'react';
import { Alert, Breadcrumbs, Button, CircularProgress, FormControlLabel, Switch } from '@mui/material';
import Head from 'next/head';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { useApolloClient } from '@apollo/client';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GET_CAR } from '../../apollo/user/query';
import { Car } from '../../libs/types/car/car';
import { parseCompareIds } from '../../libs/carCompare';
import CarComparisonTable from '../../libs/components/car/CarComparisonTable';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import CompareCarCard from '../../libs/components/car/CompareCarCard';
import CompareEmptySlot from '../../libs/components/car/CompareEmptySlot';
import CarComparePicker from '../../libs/components/car/CarComparePicker';
import CompareHighlights from '../../libs/components/car/CompareHighlights';
import { availableCompareCar } from '../../libs/compareSelection';
import { formatPrice } from '../../libs/currency';

export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const CarComparePage = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const client = useApolloClient();
	const [visiblePhones, setVisiblePhones] = useState<string[]>([]);
	const [cars, setCars] = useState<Car[]>([]);
	const [loading, setLoading] = useState(true);
	const [failed, setFailed] = useState(false);
	const [attempt, setAttempt] = useState(0);
	const [pickerIndex, setPickerIndex] = useState<number | null>(null);
	const [differences, setDifferences] = useState(false);
	const [highlight, setHighlight] = useState(true);
	const [shareStatus, setShareStatus] = useState('');
	const [updating, setUpdating] = useState(false);
	const pageRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const header = document.getElementById('top');
		if (!header) return;
		const updateHeight = () => {
			pageRef.current?.style.setProperty('--compare-navbar-height', `${header.getBoundingClientRect().height}px`);
		};
		updateHeight();
		const observer = new ResizeObserver(updateHeight);
		observer.observe(header);
		return () => observer.disconnect();
	}, []);
	const idsKey = parseCompareIds(router.query.ids).join(',');
	useEffect(() => {
		if (!router.isReady) return;
		let active = true;
		const ids = parseCompareIds(idsKey);
		setCars([]);
		setFailed(false);
		setShareStatus('');
		setVisiblePhones([]);
		if (!ids.length) {
			setLoading(false);
			return;
		}
		setLoading(true);
		void Promise.allSettled(
			ids.map((id) =>
				client.query<{ getCar: Car }>({
					query: GET_CAR,
					variables: { input: id },
					fetchPolicy: 'network-only',
				}),
			),
		).then((results) => {
			if (!active) return;
			const loaded = results.flatMap((result, index) =>
				result.status === 'fulfilled' &&
				result.value.data.getCar?._id === ids[index] &&
				availableCompareCar(result.value.data.getCar)
					? [result.value.data.getCar]
					: [],
			);
			setCars(loaded);
			setFailed(loaded.length !== ids.length);
			setLoading(false);
		});
		return () => {
			active = false;
		};
	}, [client, router.isReady, idsKey, attempt]);
	const updateSelection = async (ids: string[]) => {
		setUpdating(true);
		try {
			await router.replace({ pathname: '/car/compare', query: ids.length ? { ids: ids.join(',') } : {} }, undefined, {
				shallow: true,
			});
		} catch {
			setShareStatus('Selection could not be updated. Please try again.');
		} finally {
			setUpdating(false);
		}
	};
	const removeCar = (id: string) => {
		void updateSelection(parseCompareIds(idsKey).filter((item) => item !== id));
	};
	const addCar = (car: Car) => {
		const ids = parseCompareIds(idsKey);
		if (updating || pickerIndex === null || !availableCompareCar(car) || ids.includes(car._id)) return false;
		if (pickerIndex < ids.length) ids[pickerIndex] = car._id;
		else if (ids.length < 3) ids.push(car._id);
		else return false;
		void updateSelection(ids);
		return true;
	};
	const addIndex = parseCompareIds(idsKey).length;
	const share = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setShareStatus('Comparison link copied.');
		} catch {
			setShareStatus('Copy the page address to share this comparison.');
		}
	};
	return (
		<div className="compare-results-page" ref={pageRef}>
			<Head>
				<title>{t('Compare Cars')} | ANORCAR</title>
			</Head>
			<section className="compare-cars" aria-labelledby="compare-cars-heading">
				<div className="compare-container">
					<header className="compare-heading compare-page-heading">
						<Breadcrumbs
							aria-label={t('Breadcrumb navigation')}
							separator={<NavigateNextRoundedIcon fontSize="small" />}
						>
							<Link href="/">{t('Home')}</Link>
							<Link href="/car">{t('Cars')}</Link>
							<span aria-current="page">{t('Compare')}</span>
						</Breadcrumbs>
						<div className="compare-page-intro">
							<div>
								<h1 id="compare-cars-heading">{t('Compare Cars. Choose Smarter.')}</h1>
								<p>{t('Compare up to 3 cars side by side and find the perfect match for your needs.')}</p>
							</div>
							<div className="compare-heading-actions">
								<Button
									variant="outlined"
									startIcon={<AddRoundedIcon />}
									disabled={loading || updating || addIndex >= 3}
									onClick={() => setPickerIndex(addIndex)}
								>
									{t('Add car')}
								</Button>
								<Button
									variant="contained"
									startIcon={<IosShareRoundedIcon />}
									disabled={!cars.length}
									onClick={() => void share()}
								>
									{t('Share comparison')}
								</Button>
							</div>
						</div>
					</header>
					{shareStatus && (
						<Alert severity="info" onClose={() => setShareStatus('')}>
							{t(shareStatus)}
						</Alert>
					)}
					{loading ? (
						<div className="compare-status">
							<CircularProgress aria-label={t('Loading cars')} />
						</div>
					) : (
						<>
							{failed && (
								<Alert
									severity="warning"
									action={<Button onClick={() => setAttempt((value) => value + 1)}>{t('Try again')}</Button>}
								>
									{t('Some selected cars could not be loaded.')}
								</Alert>
							)}
							<div className="compare-page-toolbar">
								<span className="compare-selection-count" role="status">
									{t('{{selected}} of {{max}} cars selected', { selected: cars.length, max: 3 })}
								</span>
								<div className="compare-switches">
									<FormControlLabel
										control={
											<Switch size="small" checked={differences} onChange={(_, value) => setDifferences(value)} />
										}
										label={t('Show differences only')}
									/>
									<FormControlLabel
										control={<Switch size="small" checked={highlight} onChange={(_, value) => setHighlight(value)} />}
										label={t('Highlight differences')}
									/>
								</div>
								<Button disabled={!addIndex || updating} onClick={() => void updateSelection([])}>
									{t('Clear All')}
								</Button>
							</div>
							<div className="compare-page-cards" aria-busy={updating}>
								{cars.map((car) => (
									<CompareCarCard
										key={car._id}
										car={car}
										onRemove={() => removeCar(car._id)}
										onReplace={() => setPickerIndex(parseCompareIds(idsKey).indexOf(car._id))}
										showDetails
									/>
								))}
								{addIndex < 3 &&
									Array.from({ length: 3 - addIndex }, (_, index) => (
										<CompareEmptySlot
											key={`empty-${index}`}
											index={addIndex + index}
											onAdd={() => setPickerIndex(addIndex)}
										/>
									))}
							</div>
							{cars.length < 2 ? (
								<p className="compare-selection-hint">{t('Select at least two cars to compare.')}</p>
							) : (
								<>
									<CompareHighlights cars={cars} />
									<CarComparisonTable
										cars={cars}
										onRemove={removeCar}
										detailed
										differences={differences}
										highlight={highlight}
									/>
									<section className="compare-next-steps" aria-label={t('Explore each car')}>
										{cars.map((car) => (
											<article key={car._id}>
												<div>
													<h3>{car.carTitle}</h3>
													<strong>{formatPrice(car.carPrice)}</strong>
												</div>
												<Button
													variant="contained"
													className="compare-message-seller"
													onClick={() =>
														window.dispatchEvent(
															new CustomEvent('anorcar:contact-agent', {
																detail: { agentId: car.memberId, car: { id: car._id, title: car.carTitle } },
															}),
														)
													}
												>
													{t('Message seller')}
												</Button>
												{car.memberData?.memberPhone && (
													<>
														<Button
															className="compare-show-phone"
															aria-expanded={visiblePhones.includes(car._id)}
															aria-controls={`compare-phone-${car._id}`}
															onClick={() =>
																setVisiblePhones((previous) =>
																	previous.includes(car._id)
																		? previous.filter((id) => id !== car._id)
																		: [...previous, car._id],
																)
															}
														>
															{t(visiblePhones.includes(car._id) ? 'Hide phone number' : 'Show phone number')}
														</Button>
														{visiblePhones.includes(car._id) && (
															<p className="compare-seller-phone" id={`compare-phone-${car._id}`}>
																{car.memberData.memberPhone}
															</p>
														)}
													</>
												)}
												<Button component={Link} href={`/car/detail?id=${car._id}`}>
													{t('View full details')}
												</Button>
											</article>
										))}
									</section>
								</>
							)}
						</>
					)}
				</div>
			</section>
			{pickerIndex !== null && (
				<CarComparePicker
					excludedIds={parseCompareIds(idsKey)}
					replacing={pickerIndex < addIndex}
					onAdd={addCar}
					onClose={() => setPickerIndex(null)}
				/>
			)}
		</div>
	);
};
export default withLayoutFull(CarComparePage, { showChat: true, className: 'compare-results-shell' });
