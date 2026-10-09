import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
	Alert,
	Button,
	CircularProgress,
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	InputAdornment,
	Pagination,
	TextField,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { GET_BRANDS, GET_CARS } from '../../../apollo/user/query';
import { Cars, Car } from '../../types/car/car';
import { CarsInquiry } from '../../types/car/car.input';
import { Brand } from '../../types/brand/brand';
import { Direction } from '../../enums/common.enum';
import { availableCompareCar } from '../../compareSelection';
import { formatCarPrice } from '../../carCompare';
import { imageUrl } from '../../config';

const PickerListing = ({ car, onSelect }: { car: Car; onSelect: (car: Car) => void }) => {
	const { t, i18n } = useTranslation('common');
	const [failed, setFailed] = useState(false);
	return (
		<li className="compare-picker-car">
			<div className="compare-picker-photo">
				<Image
					src={imageUrl(failed ? null : car.carImages[0])}
					alt={car.carTitle}
					fill
					unoptimized
					sizes="88px"
					onError={() => setFailed(true)}
				/>
			</div>
			<div className="compare-picker-copy">
				<h3>
					{car.brandData?.brandName} {car.carModel}
				</h3>
				<p>
					<span>{car.carYear}</span>
					<strong>{formatCarPrice(car.carPrice, i18n.language)}</strong>
				</p>
			</div>
			<Button
				variant="outlined"
				onClick={() => onSelect(car)}
				aria-label={t('Select {{car}} for comparison', { car: car.carTitle })}
			>
				{t('Select')}
			</Button>
		</li>
	);
};
const CarComparePicker = ({
	excludedIds,
	onAdd,
	onClose,
	replacing = false,
}: {
	excludedIds: (string | null)[];
	onAdd: (car: Car) => boolean;
	onClose: () => void;
	replacing?: boolean;
}) => {
	const { t } = useTranslation('common');
	const searchInput = useRef<HTMLInputElement>(null);
	const [search, setSearch] = useState('');
	const [query, setQuery] = useState({ text: '', page: 1 });
	const [invalid, setInvalid] = useState(false);
	useEffect(() => {
		const timer = setTimeout(
			() => setQuery((current) => (current.text === search.trim() ? current : { text: search.trim(), page: 1 })),
			300,
		);
		return () => clearTimeout(timer);
	}, [search]);
	const { data: brandsData, loading: brandsLoading, error: brandsError } = useQuery<{ getBrands: Brand[] }>(GET_BRANDS);
	const input = useMemo<CarsInquiry>(() => {
		const brands = query.text
			? brandsData?.getBrands
					.filter((brand) => brand.brandName.toLowerCase().includes(query.text.toLowerCase()))
					.map((brand) => brand._id)
			: [];
		return {
			page: query.page,
			limit: 9,
			sort: 'createdAt',
			direction: Direction.DESC,
			search: brands?.length
				? { brandIds: brands }
				: query.text
				? { text: query.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
				: {},
		};
	}, [query, brandsData]);
	const { data, loading, error, refetch } = useQuery<{ getCars: Cars }>(GET_CARS, {
		variables: { input },
		skip: !!query.text && brandsLoading,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	const pending = loading || search.trim() !== query.text || (!!query.text && brandsLoading);
	const cars = data?.getCars.list ?? [];
	const selectable = cars.filter((car) => availableCompareCar(car) && !excludedIds.includes(car._id));
	const total = data?.getCars.metaCounter?.[0]?.total ?? 0;
	const select = (car: Car) => {
		if (pending || !selectable.some((item) => item._id === car._id) || !onAdd(car)) {
			setInvalid(true);
			return;
		}
		onClose();
	};
	return (
		<Dialog
			open
			onClose={onClose}
			fullWidth
			maxWidth="md"
			aria-labelledby="compare-picker-title"
			TransitionProps={{ onEntered: () => searchInput.current?.focus() }}
			PaperProps={{ className: 'compare-picker-premium' }}
		>
			<DialogTitle id="compare-picker-title" className="compare-picker-heading">
				<span>{t(replacing ? 'Replace car' : 'Select a car')}</span>
				<IconButton onClick={onClose} aria-label={t('Close car selection')}>
					<CloseRoundedIcon />
				</IconButton>
			</DialogTitle>
			<DialogContent>
				<TextField
					fullWidth
					autoFocus
					inputRef={searchInput}
					placeholder={t('Search Brand/Model')}
					value={search}
					onChange={(event) => {
						setSearch(event.target.value);
						setInvalid(false);
					}}
					inputProps={{ maxLength: 100, 'aria-label': t('Search Brand/Model') }}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchRoundedIcon />
							</InputAdornment>
						),
					}}
				/>
				{brandsError && query.text && <Alert severity="warning">{t('Brands could not be loaded.')}</Alert>}
				{invalid && (
					<Alert severity="warning">{t('This car is no longer available for selection. Choose another car.')}</Alert>
				)}
				<div className="compare-picker-list" aria-busy={pending}>
					{pending ? (
						<div className="compare-picker-status" role="status">
							<CircularProgress size={28} aria-label={t('Loading cars')} />
						</div>
					) : error ? (
						<Alert severity="error" action={<Button onClick={() => void refetch()}>{t('Try again')}</Button>}>
							{t('Cars could not be loaded. Please try again.')}
						</Alert>
					) : !selectable.length ? (
						<p className="compare-picker-status">
							{t(
								cars.length
									? 'No selectable cars on this page. Try another page or search.'
									: 'No cars found. Try changing your filters.',
							)}
						</p>
					) : (
						<ul>
							{selectable.map((car) => (
								<PickerListing key={car._id} car={car} onSelect={select} />
							))}
						</ul>
					)}
				</div>
				{total > 0 && (
					<div className="compare-picker-pagination">
						<Pagination
							page={query.page}
							count={Math.ceil(total / input.limit)}
							disabled={pending}
							onChange={(_, page) => {
								setQuery((current) => ({ ...current, page }));
								setInvalid(false);
							}}
						/>
						<p>{t('Available cars: {{count}}', { count: total })}</p>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};
export default CarComparePicker;
