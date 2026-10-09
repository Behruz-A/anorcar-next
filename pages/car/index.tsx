import { useTranslation } from 'next-i18next';
import React, { useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import {
	Alert,
	Button,
	IconButton,
	LinearProgress,
	MenuItem,
	Pagination,
	Skeleton,
	Stack,
	TextField,
	Typography,
	useMediaQuery,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import CarCard from '../../libs/components/car/CarCard';
import Filter from '../../libs/components/car/Filter';
import { defaultCarsInquiry, parseCarsInquiry } from '../../libs/car';
import { Cars } from '../../libs/types/car/car';
import { CarsInquiry } from '../../libs/types/car/car.input';
import { GET_CARS } from '../../apollo/user/query';
import { LIKE_TARGET_CAR } from '../../apollo/user/mutation';
import { Direction, Message } from '../../libs/enums/common.enum';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import Link from 'next/link';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import { GET_BRANDS } from '../../apollo/user/query';
import { Brand } from '../../libs/types/brand/brand';
import { imageUrl } from '../../libs/config';
import { CarSort } from '../../libs/types/car/car.input';
export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
const CarList: NextPage = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const [input, setInput] = useState<CarsInquiry>(defaultCarsInquiry);
	const [view, setView] = useState<'grid' | 'list'>('grid');
	const [ready, setReady] = useState(false);
	const compact = useMediaQuery('(max-width:800px)');
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [filterRevision, setFilterRevision] = useState(0);
	const headingRef = useRef<HTMLHeadingElement>(null);
	const filterTriggerRef = useRef<HTMLButtonElement>(null);
	const scrollPage = useRef<number | null>(null);
	const {
		data: brandData,
		loading: brandsLoading,
		error: brandsError,
		refetch: refetchBrands,
	} = useQuery<{ getBrands: Brand[] }>(GET_BRANDS);
	useEffect(() => {
		if (router.isReady) { setInput(parseCarsInquiry(router.query.input)); setReady(true); }
	}, [router.isReady, router.query.input]);
	const syncing = !ready || !router.isReady || JSON.stringify(input) !== JSON.stringify(parseCarsInquiry(router.query.input));
	const { data, loading, error, refetch } = useQuery<{ getCars: Cars }>(GET_CARS, {
		variables: { input },
		skip: !router.isReady || !ready,
		notifyOnNetworkStatusChange: true,
		fetchPolicy: 'network-only',
	});
	const [likeCar] = useMutation(LIKE_TARGET_CAR);
	const apply = (next: CarsInquiry, scroll = false) => {
		scrollPage.current = scroll ? next.page : null;
		void router
			.push({ pathname: '/car', query: { ...router.query, input: JSON.stringify(next) } }, undefined, {
				scroll: false,
				shallow: true,
			})
			.catch((reason: unknown) => {
				if (!(reason as { cancelled?: boolean })?.cancelled)
					void sweetMixinErrorAlert(t('Filters could not be applied. Please try again.'));
			});
	};
	const likeCarHandler = async (user: { _id: string }, id: string) => {
		try {
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeCar({ variables: { input: id } });
			await refetch();
		} catch (error: unknown) {
			await sweetMixinErrorAlert(
				error instanceof Error ? error.message : t('Cars could not be loaded. Please try again.'),
			);
		}
	};
	const cars = data?.getCars.list ?? [];
	const total = data?.getCars.metaCounter?.[0]?.total ?? 0;
	const sortValue = `${input.sort ?? 'createdAt'}:${input.direction ?? Direction.DESC}`;
	const sorts = [
		{ value: 'createdAt:DESC', label: 'Newest' },
		{ value: 'createdAt:ASC', label: 'Oldest' },
		{ value: 'carPrice:ASC', label: 'Lowest price' },
		{ value: 'carPrice:DESC', label: 'Highest price' },
		{ value: 'carLikes:DESC', label: 'Most liked' },
		{ value: 'carViews:DESC', label: 'Most viewed' },
		{ value: 'carRank:DESC', label: 'Highest ranked' },
		{ value: 'carYear:DESC', label: 'Newest model year' },
	];
	const sortLabels: Record<CarSort, string> = {
		createdAt: 'Date added',
		carPrice: 'Price',
		carLikes: 'Likes',
		carViews: 'Views',
		carRank: 'Rank',
		carYear: 'Model year',
	};
	const clearFilters = () => {
		setFilterRevision((revision) => revision + 1);
		apply({ ...input, page: 1, search: {} });
	};
	useEffect(() => {
		if (syncing || loading || error || !data || scrollPage.current !== input.page) return;
		scrollPage.current = null;
		const heading = headingRef.current;
		if (!heading) return;
		const clearance = (document.querySelector('.navbar-main')?.getBoundingClientRect().height ?? 0) + 20;
		const top = heading.getBoundingClientRect().top;
		if (top < clearance || top > window.innerHeight / 2)
			window.scrollTo({
				top: window.scrollY + top - clearance,
				behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
			});
	}, [input.page, syncing, loading, error, data]);
	useEffect(() => {
		if (!compact) setFiltersOpen(false);
	}, [compact]);
	return (
		<div id="car-list-page">
			<div className="container">
				<Stack className="car-page">
					<Stack className="filter-config">
						<Filter
							key={filterRevision}
							searchFilter={input}
							onApply={apply}
							browse
							compact={compact}
							open={filtersOpen}
							onClose={() => setFiltersOpen(false)}
							onExited={() => filterTriggerRef.current?.focus()}
						/>
					</Stack>
					<Stack className="main-config">
						<nav className="cars-breadcrumb" aria-label={t('Breadcrumb')}>
							<Link href="/">{t('Home')}</Link>
							<span aria-hidden="true">›</span>
							<span aria-current="page">{t('Cars')}</span>
						</nav>
						<Stack className="car-browse-toolbar" direction="row" justifyContent="space-between">
							<div>
								<Typography component="h1" ref={headingRef} id="cars-listing-heading">
									{t('Cars for Sale')}
								</Typography>
								<Typography className="cars-count">
									{syncing || (loading && !data)
										? t('Loading cars…')
										: error && !data
										? '—'
										: t('{{total}} cars available', { total: total.toLocaleString(router.locale ?? 'en-US') })}
								</Typography>
							</div>
							<Stack className="cars-sort-controls" direction="row">
								{compact && (
									<Button
										className="cars-filter-trigger"
										ref={filterTriggerRef}
										variant="outlined"
										startIcon={<TuneIcon />}
										aria-haspopup="dialog"
										aria-expanded={filtersOpen}
										onClick={() => setFiltersOpen(true)}
									>
										{t('Filters')}
									</Button>
								)}
								<TextField
									select
									label={t('Sort by')}
									size="small"
									value={sortValue}
									onChange={(e) => {
										const [sort, direction] = e.target.value.split(':');
										apply({ ...input, page: 1, sort: sort as CarSort, direction: direction as Direction });
									}}
								>
									{sorts.map((sort) => (
										<MenuItem key={sort.value} value={sort.value}>
											{t(sort.label)}
										</MenuItem>
									))}
									{!sorts.some((sort) => sort.value === sortValue) && (
										<MenuItem value={sortValue}>
											{t(sortLabels[input.sort ?? 'createdAt'])} ·{' '}
											{t(input.direction === Direction.ASC ? 'Ascending' : 'Descending')}
										</MenuItem>
									)}
								</TextField>
								<IconButton
									aria-label={t('Grid view')}
									aria-pressed={view === 'grid'}
									className={view === 'grid' ? 'is-active' : ''}
									onClick={() => setView('grid')}
								>
									<GridViewOutlinedIcon />
								</IconButton>
								<IconButton
									aria-label={t('List view')}
									aria-pressed={view === 'list'}
									className={view === 'list' ? 'is-active' : ''}
									onClick={() => setView('list')}
								>
									<ViewListOutlinedIcon />
								</IconButton>
							</Stack>
						</Stack>
						<Stack className="cars-brand-strip" direction="row" role="group" aria-label={t('Brand')}>
							<Button
								className={!input.search.brandIds?.length ? 'is-active' : ''}
								aria-pressed={!input.search.brandIds?.length}
								onClick={() => apply({ ...input, page: 1, search: { ...input.search, brandIds: undefined } })}
							>
								{t('All brands')}
							</Button>
							{brandsLoading && !brandData && <Skeleton variant="rounded" width={100} height={40} />}
							{brandData?.getBrands.map((brand) => (
								<Button
									key={brand._id}
									className={input.search.brandIds?.includes(brand._id) ? 'is-active' : ''}
									aria-pressed={input.search.brandIds?.includes(brand._id) ?? false}
									onClick={() => apply({ ...input, page: 1, search: { ...input.search, brandIds: [brand._id] } })}
								>
									{brand.brandLogo && (
										<img
											src={imageUrl(brand.brandLogo)}
											alt=""
											onError={(e) => {
												e.currentTarget.style.display = 'none';
											}}
										/>
									)}
									{brand.brandName}
								</Button>
							))}
						</Stack>
						{brandsError && (
							<Alert
								severity="warning"
								action={<Button onClick={() => void refetchBrands().catch(() => undefined)}>{t('Retry')}</Button>}
							>
								{t('Brands could not be loaded. Other filters are available.')}
							</Alert>
						)}
						<div className="cars-update-progress">
							{ready && loading && data && <LinearProgress aria-label={t('Updating cars')} />}
						</div>
						{error && (
							<Alert
								severity="error"
								action={<Button onClick={() => void refetch().catch(() => undefined)}>{t('Retry')}</Button>}
							>
								{t('Cars could not be loaded. Please try again.')}
							</Alert>
						)}
						{!syncing && !loading && !error && !cars.length && (
							<div className="cars-empty-state">
								<Typography component="h2">{t('No cars found')}</Typography>
								<Typography>{t('No cars found. Try changing your filters.')}</Typography>
								<Button variant="outlined" onClick={clearFilters}>
									{t('Clear filters')}
								</Button>
							</div>
						)}
						<Stack
							className={`list-config cars-results cars-results-${view}`}
							aria-busy={syncing || loading}
							aria-labelledby="cars-listing-heading"
						>
							{syncing || (loading && !data)
								? Array.from({ length: Math.min(input.limit, 9) }, (_, index) => (
										<div key={index} className="cars-listing-card cars-card-skeleton" aria-hidden="true">
											<Skeleton variant="rectangular" className="cars-listing-photo" />
											<div className="cars-listing-content">
												<Skeleton width="80%" height={44} />
												<Skeleton width="65%" />
												<Skeleton width="90%" />
												<Skeleton width="50%" height={38} />
												<Skeleton width="40%" />
											</div>
										</div>
								  ))
								: cars.map((car) => <CarCard key={car._id} car={car} likeCarHandler={likeCarHandler} browse />)}
						</Stack>
						{total > 0 && !error && (
							<Stack className="pagination-config" spacing={2}>
								<Pagination
									shape="rounded"
									page={input.page}
									count={Math.ceil(total / input.limit)}
									disabled={syncing || loading}
									onChange={(_, page) => {
										apply({ ...input, page }, true);
									}}
								/>
							</Stack>
						)}
					</Stack>
				</Stack>
			</div>
		</div>
	);
};
export default withLayoutBasic(CarList);
