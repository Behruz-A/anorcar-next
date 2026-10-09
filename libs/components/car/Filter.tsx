import { useTranslation } from 'next-i18next';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Drawer, IconButton, Stack, Typography } from '@mui/material';
import { CarsInquiry } from '../../types/car/car.input';
import CarSearchFields from './CarSearchFields';
import { parseCarsInquiry } from '../../car';
import BrowseSearchFields from './BrowseSearchFields';
import SearchIcon from '@mui/icons-material/Search';
import { maxCarYear } from '../../config';
import CloseIcon from '@mui/icons-material/Close';
import { applyBrowseDraft, displaySearchText, rangeDrafts, RangeDrafts, validateRange } from './browseFilter';
import { CarSearch } from '../../types/car/car.input';
interface Props {
	searchFilter: CarsInquiry;
	onApply: (input: CarsInquiry) => void;
	browse?: boolean;
	compact?: boolean;
	open?: boolean;
	onClose?: () => void;
	onExited?: () => void;
}
export default function Filter({
	searchFilter,
	onApply,
	browse = false,
	compact = false,
	open = false,
	onClose,
	onExited,
}: Props) {
	const { t } = useTranslation('common');
	const [search, setSearch] = useState(searchFilter.search);
	const [ranges, setRanges] = useState<RangeDrafts>(() => rangeDrafts(searchFilter.search));
	const [text, setText] = useState(() => displaySearchText(searchFilter.search.text));
	const [textEdited, setTextEdited] = useState(false);
	const appliedSearch = JSON.stringify(searchFilter.search);
	const previousSearch = useRef(appliedSearch);
	useEffect(() => {
		const next = JSON.parse(appliedSearch) as CarSearch;
		const previous = JSON.parse(previousSearch.current) as CarSearch;
		previousSearch.current = appliedSearch;
		const { brandIds: previousBrands, ...previousFields } = previous;
		const { brandIds: nextBrands, ...nextFields } = next;
		if (
			browse &&
			JSON.stringify(previousBrands) !== JSON.stringify(nextBrands) &&
			JSON.stringify(previousFields) === JSON.stringify(nextFields)
		) {
			setSearch((draft) => ({ ...draft, brandIds: nextBrands }));
			return;
		}
		setSearch(next);
		setRanges(rangeDrafts(next));
		setText(displaySearchText(next.text));
		setTextEdited(false);
	}, [appliedSearch, browse]);
	const invalid = browse
		? (['yearsRange', 'pricesRange'] as const).some((key) => validateRange(key, ranges[key]).error)
		: (['yearsRange', 'pricesRange'] as const).some((key) => {
				const range = search[key];
				return (
					range &&
					(!Number.isInteger(range.start) ||
						!Number.isInteger(range.end) ||
						range.start > range.end ||
						range.start < (key === 'yearsRange' ? 1886 : 0) ||
						range.end > (key === 'yearsRange' ? maxCarYear : 2147483647))
				);
		  });
	const form = (
		<Stack
			component="form"
			noValidate
			onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
				e.preventDefault();
				const next = browse ? applyBrowseDraft(search, ranges, text, textEdited) : search;
				if (!invalid && next) {
					onApply(parseCarsInquiry({ ...searchFilter, page: 1, search: next }));
					onClose?.();
				}
			}}
			className={`car-filter${browse ? ' cars-browse-filter' : ''}`}
			spacing={2}
		>
			{!compact && <Typography variant="h6">{t('Find your car')}</Typography>}
			{browse ? (
				<BrowseSearchFields
					search={search}
					onChange={setSearch}
					ranges={ranges}
					onRangesChange={setRanges}
					text={text}
					onTextChange={(value) => {
						setText(value);
						setTextEdited(true);
					}}
				/>
			) : (
				<CarSearchFields search={search} onChange={setSearch} />
			)}
			{invalid && !browse && (
				<Alert severity="error">{t('Enter a valid range, with the minimum no greater than the maximum.')}</Alert>
			)}
			<Button type="submit" variant="contained" startIcon={browse ? <SearchIcon /> : undefined} disabled={invalid}>
				{t('Apply filters')}
			</Button>
			<Button
				data-action="reset"
				onClick={() => {
					setSearch({});
					setRanges(rangeDrafts({}));
					setText('');
					setTextEdited(false);
					onApply({ ...searchFilter, page: 1, search: {} });
					onClose?.();
				}}
			>
				{t('Reset filters')}
			</Button>
		</Stack>
	);
	return compact ? (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			className="cars-filter-drawer"
			SlideProps={{ onExited }}
			ModalProps={{ keepMounted: true }}
			PaperProps={{ role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'cars-filter-title' }}
		>
			<div className="cars-drawer-header">
				<Typography id="cars-filter-title" component="h2">
					{t('Find your car')}
				</Typography>
				<IconButton aria-label={t('Close filters')} onClick={onClose}>
					<CloseIcon />
				</IconButton>
			</div>
			{form}
		</Drawer>
	) : (
		form
	);
}
