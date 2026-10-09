import React, { useEffect, useState } from 'react';
import {
	Alert,
	Button,
	ButtonBase,
	CircularProgress,
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	InputAdornment,
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
import { MAX_COMPARE_CARS } from '../../carCompare';
import { readCompareHistory, rememberCompareSearch } from './compareHistory';

const CarComparePicker = ({
	selected,
	onAdd,
	onClose,
}: {
	selected: Car[];
	onAdd: (car: Car) => void;
	onClose: () => void;
}) => {
	const { t } = useTranslation('common');
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [recent, setRecent] = useState<Car[]>([]);
	useEffect(() => {
		setRecent(readCompareHistory());
	}, []);
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
		return () => clearTimeout(timer);
	}, [search]);
	const { data: brandsData, loading: brandsLoading, error: brandsError } = useQuery<{ getBrands: Brand[] }>(GET_BRANDS);
	const matchingBrands = debouncedSearch
		? brandsData?.getBrands
				.filter((brand) => brand.brandName.toLowerCase().includes(debouncedSearch.toLowerCase()))
				.map((brand) => brand._id)
		: [];
	const text = debouncedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const input: CarsInquiry = {
		page: 1,
		limit: 50,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: matchingBrands?.length ? { brandIds: matchingBrands } : { text },
	};
	const { data, loading, error, refetch } = useQuery<{ getCars: Cars }>(GET_CARS, {
		variables: { input },
		skip: !debouncedSearch || brandsLoading,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	const pending = search.trim() !== debouncedSearch || (!!debouncedSearch && (loading || brandsLoading));
	useEffect(() => {
		if (debouncedSearch && !loading && !error && data?.getCars.list.length)
			setRecent(rememberCompareSearch(data.getCars.list));
	}, [data, loading, error, debouncedSearch]);
	const cars = search.trim() ? data?.getCars.list ?? [] : recent;
	return (
		<Dialog
			open
			onClose={onClose}
			fullWidth
			maxWidth={false}
			aria-labelledby="compare-picker-title"
			PaperProps={{ className: 'compare-picker' }}
		>
			<DialogTitle className="compare-picker-heading">
				<span id="compare-picker-title">{t('Select Brand/Model')}</span>
				<IconButton onClick={onClose} aria-label={t('Close car selection')}>
					<CloseRoundedIcon />
				</IconButton>
			</DialogTitle>
			<DialogContent>
				<TextField
					fullWidth
					autoFocus
					placeholder={t('Search Brand/Model')}
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					inputProps={{ maxLength: 100, 'aria-label': t('Search Brand/Model') }}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchRoundedIcon />
							</InputAdornment>
						),
					}}
				/>
				{brandsError && search.trim() && <Alert severity="warning">{t('Brands could not be loaded.')}</Alert>}
				<div className="compare-picker-list">
					{pending ? (
						<div className="compare-picker-status">
							<CircularProgress aria-label={t('Loading cars')} />
						</div>
					) : error && search.trim() ? (
						<Alert
							severity="error"
							action={
								<Button color="inherit" onClick={() => void refetch()}>
									{t('Try again')}
								</Button>
							}
						>
							{t('Cars could not be loaded. Please try again.')}
						</Alert>
					) : !cars.length ? (
						<p className="compare-picker-status">
							{t(
								search.trim()
									? 'No cars found. Try changing your filters.'
									: 'No recent searches. Search for a brand or model.',
							)}
						</p>
					) : (
						cars.map((car) => {
							const added = selected.some((item) => item._id === car._id);
							return (
								<ButtonBase
									className={`compare-picker-car${added ? ' is-selected' : ''}`}
									key={car._id}
									disabled={added || selected.length >= MAX_COMPARE_CARS}
									onClick={() => {
										rememberCompareSearch([car]);
										onAdd(car);
									}}
									aria-label={t(added ? '{{car}} is selected' : 'Add {{car}} to comparison', { car: car.carTitle })}
								>
									<span className="compare-picker-model">
										{car.brandData?.brandName} {car.carModel}
									</span>
								</ButtonBase>
							);
						})
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};
export default CarComparePicker;
