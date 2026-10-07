import React, { useMemo, useState } from 'react';
import { Autocomplete, Box, Button, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { GET_BRANDS, GET_CARS } from '../../../apollo/user/query';
import { Brand } from '../../types/brand/brand';
import { Cars } from '../../types/car/car';
import { CarsInquiry, CarSearch } from '../../types/car/car.input';
import { CarCondition, CarFuelType } from '../../enums/car.enum';
import { Direction } from '../../enums/common.enum';
import { maxCarYear } from '../../config';

interface HeaderFilterProps { initialInput?: CarsInquiry; }
const initialValues: CarsInquiry = { page: 1, limit: 9, sort: 'createdAt', direction: Direction.DESC, search: {} };
const priceOptions = [10000, 20000, 30000, 50000, 100000];
const yearOptions = Array.from({ length: maxCarYear - 1886 + 1 }, (_, index) => maxCarYear - index);
const MenuProps = { PaperProps: { style: { maxHeight: 260 } } };

const HeaderFilter = ({ initialInput = initialValues }: HeaderFilterProps) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [searchFilter, setSearchFilter] = useState<CarsInquiry>(initialInput);
	const [totalCars, setTotalCars] = useState<number | null>(null);
	const [brands, setBrands] = useState<Brand[]>([]);

	/** APOLLO REQUESTS **/
	const { error: brandsError, refetch: refetchBrands } = useQuery<{ getBrands: Brand[] }>(GET_BRANDS, {
		fetchPolicy: 'cache-and-network', onCompleted: (data) => setBrands(data.getBrands),
	});
	const { loading: totalLoading, error: totalError } = useQuery<{ getCars: Cars }>(GET_CARS, {
		variables: { input: { page: 1, limit: 1, sort: 'createdAt', direction: Direction.DESC, search: {} } },
		fetchPolicy: 'network-only', onCompleted: (data) => setTotalCars(data.getCars.metaCounter?.[0]?.total ?? 0),
	});
	const { data: modelData, loading: modelsLoading } = useQuery<{ getCars: Cars }>(GET_CARS, {
		variables: { input: { page: 1, limit: 100, sort: 'createdAt', direction: Direction.DESC,
			search: { brandIds: searchFilter.search.brandIds } } }, fetchPolicy: 'cache-and-network',
	});
	// Listing-based suggestions; free text also supports models beyond the first page.
	const models = useMemo(() => Array.from(new Set((modelData?.getCars.list ?? []).map((car) => car.carModel))).sort(), [modelData]);
	const searchText = searchFilter.search.text ?? '';

	/** HANDLERS **/
	const updateSearch = (fields: Partial<CarSearch>) => {
		setSearchFilter((previous) => ({ ...previous, search: { ...previous.search, ...fields } }));
	};
	const searchHandler = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const input = { ...searchFilter, page: 1, search: { ...searchFilter.search } };
		if (input.search.text?.trim()) input.search.text = input.search.text.trim();
		else delete input.search.text;
		void router.push({ pathname: '/car', query: { input: JSON.stringify(input) } });
	};

	return (
		<Box component="form" className="model-search" onSubmit={searchHandler}>
			<Stack className="search-heading">
				<Typography component="h2">{t('Model Search')}</Typography>
				<Stack className="listing-total" aria-live="polite">
					<CheckCircleIcon />
					<span>{t('Total listed cars')} : <strong>{totalLoading && totalCars === null ? t('Loading...') :
						totalError || totalCars === null ? '—' : totalCars.toLocaleString('en-US')}</strong></span>
				</Stack>
			</Stack>
			<Stack className="search-fields">
				<TextField select label={t('Make')} value={searchFilter.search.brandIds?.[0] ?? ''}
					SelectProps={{ displayEmpty: true, MenuProps, SelectDisplayProps: { 'aria-label': t('Make') } }} InputLabelProps={{ shrink: true }}
					onChange={(event) => updateSearch({ brandIds: event.target.value ? [event.target.value] : undefined, text: undefined })}>
					<MenuItem value="">{t('Any Make')}</MenuItem>
					{brands.map((brand) => <MenuItem key={brand._id} value={brand._id}>{brand.brandName}</MenuItem>)}
				</TextField>
				<Autocomplete freeSolo forcePopupIcon options={models} value={searchText || null} inputValue={searchText}
					loading={modelsLoading} popupIcon={<ExpandMoreIcon />} onChange={(_, value) => updateSearch({ text: value ?? undefined })}
					onInputChange={(_, value, reason) => { if (reason !== 'reset') updateSearch({ text: value || undefined }); }}
					renderInput={(params) => <TextField {...params} label={t('Model')} placeholder={t('Any Model')}
						InputLabelProps={{ shrink: true }} />} />
				<TextField select label={t('Year')} value={searchFilter.search.yearsRange?.start ?? ''}
					SelectProps={{ displayEmpty: true, MenuProps, SelectDisplayProps: { 'aria-label': t('Year') } }} InputLabelProps={{ shrink: true }}
					onChange={(event) => updateSearch({ yearsRange: event.target.value ? { start: Number(event.target.value), end: Number(event.target.value) } : undefined })}>
					<MenuItem value="">{t('Any Year')}</MenuItem>
					{yearOptions.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
				</TextField>
				<TextField select label={t('Price')} value={searchFilter.search.pricesRange?.end ?? ''}
					SelectProps={{ displayEmpty: true, MenuProps, SelectDisplayProps: { 'aria-label': t('Price') } }} InputLabelProps={{ shrink: true }}
					onChange={(event) => updateSearch({ pricesRange: event.target.value ? { start: 0, end: Number(event.target.value) } : undefined })}>
					<MenuItem value="">{t('Any Price')}</MenuItem>
					{priceOptions.map((price) => <MenuItem key={price} value={price}>{t('Up to')} ${price.toLocaleString('en-US')}</MenuItem>)}
				</TextField>
				<Button className="model-search-button" variant="contained" type="submit" startIcon={<SearchOutlinedIcon />}>{t('Search')}</Button>
			</Stack>
			<Stack className="search-recommendations">
				<TextField className="keyword-search" type="search" value={searchText} placeholder={t('Please enter a search term.')}
					onChange={(event) => updateSearch({ text: event.target.value || undefined })}
					inputProps={{ 'aria-label': t('Search by model or title') }}
					InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment> }} />
				<span className="recommendations-label">{t('Recommended Searches')}</span>
				<Stack className="recommendation-chips">
					{[CarCondition.USED, CarCondition.NEW].map((condition) => {
						const active = searchFilter.search.conditions?.includes(condition) ?? false;
						return <Button key={condition} type="button" aria-pressed={active} className={active ? 'selected' : ''}
							onClick={() => updateSearch({ conditions: active ? undefined : [condition] })}>{t(condition === CarCondition.USED ? 'Used Cars' : 'New Cars')}</Button>;
					})}
					<Button type="button" aria-pressed={searchFilter.search.pricesRange?.end === 20000}
						className={searchFilter.search.pricesRange?.end === 20000 ? 'selected' : ''}
						onClick={() => updateSearch({ pricesRange: searchFilter.search.pricesRange?.end === 20000 ? undefined : { start: 0, end: 20000 } })}>{t('Up to $20,000')}</Button>
					{[CarFuelType.ELECTRIC, CarFuelType.HYBRID].map((fuel) => {
						const active = searchFilter.search.fuelTypes?.includes(fuel) ?? false;
						return <Button key={fuel} type="button" aria-pressed={active} className={active ? 'selected' : ''}
							onClick={() => updateSearch({ fuelTypes: active ? undefined : [fuel] })}>{t(fuel === CarFuelType.ELECTRIC ? 'Electric Cars' : 'Hybrid Cars')}</Button>;
					})}
				</Stack>
			</Stack>
			{brandsError && <Button className="makes-retry" type="button" onClick={() => { void refetchBrands(); }}>{t('Unable to load makes. Try again.')}</Button>}
		</Box>
	);
};

HeaderFilter.defaultProps = { initialInput: initialValues };
export default HeaderFilter;
