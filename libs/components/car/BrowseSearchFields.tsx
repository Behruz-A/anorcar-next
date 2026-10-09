import React from 'react';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import {
	Alert,
	Checkbox,
	FormControlLabel,
	IconButton,
	InputAdornment,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import { GET_BRANDS, GET_CARS } from '../../../apollo/user/query';
import { Brand } from '../../types/brand/brand';
import { Cars } from '../../types/car/car';
import { CarSearch } from '../../types/car/car.input';
import { CarCondition, CarFuelType, CarLocation, CarTransmission } from '../../enums/car.enum';
import { carLabel } from '../../car';
import { Direction } from '../../enums/common.enum';
import { rangeBounds, RangeDrafts, RangeKey, validateRange } from './browseFilter';

interface Props {
	search: CarSearch;
	onChange: (search: CarSearch) => void;
	ranges: RangeDrafts;
	onRangesChange: (ranges: RangeDrafts) => void;
	text: string;
	onTextChange: (value: string) => void;
}

export default function BrowseSearchFields({ search, onChange, ranges, onRangesChange, text, onTextChange }: Props) {
	const { t } = useTranslation('common');
	const { data, loading, error, refetch: refetchBrands } = useQuery<{ getBrands: Brand[] }>(GET_BRANDS);
	// The backend has no model catalog: offer models from up to 100 real listings of the selected brand.
	const {
		data: modelData,
		loading: modelsLoading,
		error: modelError,
		refetch: refetchModels,
	} = useQuery<{ getCars: Cars }>(GET_CARS, {
		variables: {
			input: {
				page: 1,
				limit: 100,
				sort: 'createdAt',
				direction: Direction.DESC,
				search: { brandIds: search.brandIds },
			},
		},
		skip: !search.brandIds?.length,
	});
	const models =
		!search.brandIds?.length || modelsLoading || modelError
			? []
			: Array.from(new Set(modelData?.getCars.list.map((car) => car.carModel).filter(Boolean) ?? [])).sort();
	const selectedModel = models.includes(text) ? text : '';
	const groups = [
		{ key: 'locations', label: 'Location', values: Object.values(CarLocation) },
		{ key: 'fuelTypes', label: 'Fuel type', values: Object.values(CarFuelType) },
		{ key: 'transmissions', label: 'Transmission', values: Object.values(CarTransmission) },
		{ key: 'conditions', label: 'Condition', values: Object.values(CarCondition) },
	] as const;
	const group = (index: number) => {
		const { key, label, values } = groups[index];
		const selected: readonly string[] = search[key] ?? [];
		return (
			<div className="cars-filter-group" key={key}>
				<Typography component="h3">{t(label)}</Typography>
				<div className="cars-checkboxes cars-checkboxes-columns">
					{values.map((value) => (
						<FormControlLabel
							key={value}
							label={t(carLabel(value))}
							control={
								<Checkbox
									size="small"
									checked={selected.includes(value)}
									onChange={(e) =>
										onChange({
											...search,
											[key]: e.target.checked ? [...selected, value] : selected.filter((item) => item !== value),
										})
									}
								/>
							}
						/>
					))}
				</div>
			</div>
		);
	};
	const rangeFields = (key: RangeKey) => {
		const result = validateRange(key, ranges[key]);
		const bounds = rangeBounds(key);
		return (
			<div className="cars-filter-group">
				<Typography component="h3">{t(key === 'yearsRange' ? 'Year' : 'Price range (USD)')}</Typography>
				<Stack direction="row" spacing={1}>
					{(['start', 'end'] as const).map((part) => (
						<TextField
							key={part}
							size="small"
							type="text"
							label={t(
								key === 'yearsRange'
									? part === 'start'
										? 'Year from'
										: 'Year to'
									: part === 'start'
									? 'Price from'
									: 'Price to',
							)}
							value={ranges[key][part]}
							error={part === 'start' ? result.startError : result.endError}
							inputProps={{ inputMode: 'numeric', 'aria-describedby': result.error ? `cars-${key}-error` : undefined }}
							onChange={(e) => onRangesChange({ ...ranges, [key]: { ...ranges[key], [part]: e.target.value } })}
						/>
					))}
				</Stack>
				{result.error && (
					<Typography id={`cars-${key}-error`} className="cars-field-error" role="alert">
						{result.error === 'order'
							? t('Minimum must not exceed maximum.')
							: t('Enter a whole number between {{min}} and {{max}}.', { min: bounds.start, max: bounds.end })}
					</Typography>
				)}
			</div>
		);
	};
	return (
		<Stack className="cars-search-fields" spacing={2}>
			<TextField
				size="small"
				placeholder={t('Search make, model, or keyword')}
				inputProps={{ 'aria-label': t('Search cars') }}
				value={text}
				onChange={(e) => onTextChange(e.target.value)}
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<SearchIcon fontSize="small" />
						</InputAdornment>
					),
					endAdornment: text ? (
						<InputAdornment position="end">
							<IconButton size="small" aria-label={t('Clear search')} onClick={() => onTextChange('')}>
								<CloseIcon fontSize="small" />
							</IconButton>
						</InputAdornment>
					) : undefined,
				}}
			/>
			{group(0)}
			<TextField
				select
				label={t('Make / Brand')}
				InputLabelProps={{ shrink: true }}
				SelectProps={{ displayEmpty: true }}
				size="small"
				value={search.brandIds?.[0] ?? ''}
				disabled={loading}
				onChange={(e) => onChange({ ...search, brandIds: e.target.value ? [e.target.value] : undefined })}
			>
				<MenuItem value="">{t('All brands')}</MenuItem>
				{data?.getBrands.map((brand) => (
					<MenuItem key={brand._id} value={brand._id}>
						{brand.brandName}
					</MenuItem>
				))}
				{search.brandIds?.[0] && !data?.getBrands.some((brand) => brand._id === search.brandIds?.[0]) && (
					<MenuItem value={search.brandIds[0]} disabled>
						{t('Selected brand')}
					</MenuItem>
				)}
			</TextField>
			{error && (
				<Alert
					severity="warning"
					action={
						<IconButton aria-label={t('Retry')} onClick={() => void refetchBrands().catch(() => undefined)}>
							<ReplayIcon fontSize="small" />
						</IconButton>
					}
				>
					{t('Brands could not be loaded. Other filters are available.')}
				</Alert>
			)}
			<TextField
				select
				label={t('Model')}
				InputLabelProps={{ shrink: true }}
				SelectProps={{ displayEmpty: true }}
				size="small"
				value={selectedModel}
				disabled={!search.brandIds?.length || modelsLoading || Boolean(modelError)}
				helperText={t('Selecting a model replaces the keyword. Changing brands keeps your search text.')}
				onChange={(e) => {
					if (e.target.value || selectedModel) onTextChange(e.target.value);
				}}
			>
				<MenuItem value="">{t(modelsLoading ? 'Loading models' : 'All models')}</MenuItem>
				{models.map((model) => (
					<MenuItem key={model} value={model}>
						{model}
					</MenuItem>
				))}
			</TextField>
			{modelError && (
				<Alert
					severity="warning"
					action={
						<IconButton aria-label={t('Retry')} onClick={() => void refetchModels().catch(() => undefined)}>
							<ReplayIcon fontSize="small" />
						</IconButton>
					}
				>
					{t('Models could not be loaded. You can still search by keyword.')}
				</Alert>
			)}
			{rangeFields('yearsRange')}
			{group(1)}
			{group(2)}
			{group(3)}
			{rangeFields('pricesRange')}
			<div className="cars-checkboxes cars-checkboxes-columns">
				{(['carRent', 'carBarter'] as const).map((option) => (
					<FormControlLabel
						key={option}
						label={t(option === 'carRent' ? 'Rent' : 'Barter')}
						control={
							<Checkbox
								size="small"
								checked={search.options?.includes(option) ?? false}
								onChange={(e) =>
									onChange({
										...search,
										options: e.target.checked
											? [...(search.options ?? []), option]
											: search.options?.filter((item) => item !== option),
									})
								}
							/>
						}
					/>
				))}
			</div>
		</Stack>
	);
}
