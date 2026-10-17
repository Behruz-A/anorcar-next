import React, { useEffect, useState } from 'react';
import { GetStaticProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useMutation, useQuery } from '@apollo/client';
import {
	Alert,
	Button,
	Checkbox,
	Drawer,
	FormControlLabel,
	FormGroup,
	IconButton,
	MenuItem,
	Pagination,
	Radio,
	RadioGroup,
	Select,
	Skeleton,
	TextField,
	useMediaQuery,
} from '@mui/material';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { AgentType, AgentLanguage } from '../../libs/enums/member.enum';
import { CarLocation } from '../../libs/enums/car.enum';
import { carLabel } from '../../libs/car';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import AgentCard from '../../libs/components/common/AgentCard';
import { AgentsInquiry } from '../../libs/types/member/member.input';
import { Members } from '../../libs/types/member/member';
import { CustomJwtPayload } from '../../libs/types/customJwtPayload';
import { Direction } from '../../libs/enums/common.enum';
import { GET_AGENTS } from '../../apollo/user/query';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../apollo/user/mutation';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { Messages } from '../../libs/config';

const SORTS = [
	{ value: 'memberRank', label: 'Top Agents', direction: Direction.DESC },
	{ value: 'createdAt', label: 'Newest First', direction: Direction.DESC },
	{ value: 'oldest', label: 'Oldest', direction: Direction.ASC },
	{ value: 'memberLikes', label: 'Likes', direction: Direction.DESC },
	{ value: 'memberViews', label: 'Views', direction: Direction.DESC },
];
const initialInput: AgentsInquiry = { page: 1, limit: 9, sort: 'createdAt', direction: Direction.DESC, search: {} };
const typeLabels = { DEALERSHIP: 'Dealership', INDEPENDENT: 'Independent Agent' };
const languageLabels = {
	ENGLISH: 'English',
	KOREAN: 'Korean',
	RUSSIAN: 'Russian',
	UZBEK: 'Uzbek',
	CHINESE: 'Chinese',
	JAPANESE: 'Japanese',
	ARABIC: 'Arabic',
};
const escapeSearch = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function readInquiry(raw: string | string[] | undefined): AgentsInquiry {
	try {
		const value = JSON.parse(typeof raw === 'string' ? raw : '{}');
		const search: AgentsInquiry['search'] = {};
		if (typeof value.search?.text === 'string') search.text = value.search.text.slice(0, 240);
		if (Object.values(CarLocation).map(carLabel).includes(value.search?.location))
			search.location = value.search.location;
		if (Array.isArray(value.search?.agentTypes))
			search.agentTypes = Array.from(
				new Set(value.search.agentTypes.filter((item: AgentType) => Object.values(AgentType).includes(item))),
			);
		if (Array.isArray(value.search?.languages))
			search.languages = Array.from(
				new Set(value.search.languages.filter((item: AgentLanguage) => Object.values(AgentLanguage).includes(item))),
			);
		for (const field of ['minCars', 'maxCars'] as const)
			if (Number.isSafeInteger(value.search?.[field]) && value.search[field] >= 0 && value.search[field] <= 2147483647)
				search[field] = value.search[field];
		if (search.minCars != null && search.maxCars != null && search.minCars > search.maxCars) {
			delete search.minCars;
			delete search.maxCars;
		}
		return {
			page: Number.isSafeInteger(value.page) && value.page > 0 ? value.page : 1,
			limit: 9,
			sort: SORTS.some((sort) => sort.value === value.sort && sort.value !== 'oldest') ? value.sort : 'createdAt',
			direction: value.direction === Direction.ASC ? Direction.ASC : Direction.DESC,
			search,
		};
	} catch {
		return initialInput;
	}
}
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});
const AgentList: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [input, setInput] = useState<AgentsInquiry>(initialInput);
	const [searchText, setSearchText] = useState('');
	const [view, setView] = useState<'grid' | 'list'>('grid');
	const [mounted, setMounted] = useState(false);
	const [draft, setDraft] = useState<AgentsInquiry['search']>({});
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [moreLanguages, setMoreLanguages] = useState(false);
	const compact = useMediaQuery('(max-width: 900px)');
	const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER, { fetchPolicy: 'no-cache', ignoreResults: true });
	const [subscribe] = useMutation(SUBSCRIBE);
	const [unsubscribe] = useMutation(UNSUBSCRIBE);
	useEffect(() => {
		if (!compact) setFiltersOpen(false);
	}, [compact]);
	useEffect(() => {
		if (!router.isReady) return;
		setMounted(true);
		const next = readInquiry(router.query.input);
		setInput(next);
		setDraft(next.search);
		setSearchText((next.search.text ?? '').replace(/\\([.*+?^${}()|[\]\\])/g, '$1'));
	}, [router.isReady, router.query.input]);
	const { data, loading, error, refetch } = useQuery<{ getAgents: Members }>(GET_AGENTS, {
		variables: { input },
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
		skip: !router.isReady || !mounted,
	});
	const busy =
		loading || !router.isReady || !mounted || JSON.stringify(input) !== JSON.stringify(readInquiry(router.query.input));
	const agents = data?.getAgents.list ?? [];
	const total = data?.getAgents.metaCounter?.[0]?.total ?? 0;
	const updateInput = (next: AgentsInquiry) => {
		void router.push({ pathname: '/agent', query: { ...router.query, input: JSON.stringify(next) } }, undefined, {
			shallow: true,
			scroll: false,
		});
	};
	const likeMemberHandler = async (user: CustomJwtPayload, id: string) => {
		try {
			if (!user._id) throw new Error(Messages.error2);
			await likeTargetMember({ variables: { input: id } });
		} catch (err: unknown) {
			await sweetMixinErrorAlert(err instanceof Error ? err.message : 'Unable to like agent');
		}
	};
	const sorting = input.sort === 'createdAt' && input.direction === Direction.ASC ? 'oldest' : input.sort;
	const followMemberHandler = async (user: CustomJwtPayload, id: string, following: boolean) => {
		try {
			if (!user._id) throw new Error(Messages.error2);
			if (user._id === id) return;
			await (following ? unsubscribe : subscribe)({ variables: { input: id } });
			await refetch({ input });
		} catch (err) {
			await sweetMixinErrorAlert(err instanceof Error ? err.message : 'Unable to follow agent');
		}
	};
	const clearFilters = () => {
		setSearchText('');
		setDraft({});
		updateInput({ ...input, page: 1, search: {} });
	};
	const filters = (
		<form
			className="agents-filters"
			onSubmit={(event) => {
				event.preventDefault();
				updateInput({
					...input,
					page: 1,
					search: { ...draft, text: searchText.trim() ? escapeSearch(searchText.trim()) : undefined },
				});
				setFiltersOpen(false);
			}}
		>
			<div className="agents-filters-heading">
				<h2>
					<TuneOutlinedIcon />
					{t('Filters')}
				</h2>
				<Button type="button" onClick={clearFilters}>
					{t('Clear all')}
				</Button>
				{compact && (
					<IconButton aria-label={t('Close')} onClick={() => setFiltersOpen(false)}>
						<CloseRoundedIcon />
					</IconButton>
				)}
			</div>
			<TextField
				select
				fullWidth
				size="small"
				label={t('Location')}
				value={draft.location ?? ''}
				onChange={(event) => setDraft({ ...draft, location: event.target.value || undefined })}
			>
				<MenuItem value="">{t('Any Region')}</MenuItem>
				{Object.values(CarLocation).map((location) => (
					<MenuItem key={location} value={carLabel(location)}>
						{t(carLabel(location))}
					</MenuItem>
				))}
			</TextField>
			<fieldset>
				<legend>{t('Agent Type')}</legend>
				<FormGroup>
					<FormControlLabel
						control={
							<Checkbox
								checked={!draft.agentTypes?.length}
								onChange={() => setDraft({ ...draft, agentTypes: undefined })}
							/>
						}
						label={t('All Agents')}
					/>
					{Object.values(AgentType).map((type) => (
						<FormControlLabel
							key={type}
							label={t(typeLabels[type])}
							control={
								<Checkbox
									checked={draft.agentTypes?.includes(type) ?? false}
									onChange={(event) =>
										setDraft({
											...draft,
											agentTypes: event.target.checked
												? [...(draft.agentTypes ?? []), type]
												: draft.agentTypes?.filter((item) => item !== type),
										})
									}
								/>
							}
						/>
					))}
				</FormGroup>
			</fieldset>
			<fieldset>
				<legend>{t('Languages')}</legend>
				<FormGroup>
					{Object.values(AgentLanguage)
						.slice(0, moreLanguages ? undefined : 4)
						.map((language) => (
							<FormControlLabel
								key={language}
								label={t(languageLabels[language])}
								control={
									<Checkbox
										checked={draft.languages?.includes(language) ?? false}
										onChange={(event) =>
											setDraft({
												...draft,
												languages: event.target.checked
													? [...(draft.languages ?? []), language]
													: draft.languages?.filter((item) => item !== language),
											})
										}
									/>
								}
							/>
						))}
				</FormGroup>
				<Button type="button" onClick={() => setMoreLanguages((value) => !value)}>
					{t(moreLanguages ? 'Show less' : 'More')}
				</Button>
			</fieldset>
			<fieldset>
				<legend>{t('Cars Listed')}</legend>
				<RadioGroup
					value={draft.minCars === 51 ? '51' : draft.minCars === 11 ? '11' : draft.minCars === 1 ? '1' : 'ANY'}
					onChange={(event) => {
						const value = event.target.value;
						setDraft({
							...draft,
							minCars: value === 'ANY' ? undefined : Number(value),
							maxCars: value === '1' ? 10 : value === '11' ? 50 : undefined,
						});
					}}
				>
					<FormControlLabel value="ANY" control={<Radio />} label={t('Any')} />
					<FormControlLabel value="1" control={<Radio />} label="1–10" />
					<FormControlLabel value="11" control={<Radio />} label="11–50" />
					<FormControlLabel value="51" control={<Radio />} label="51+" />
				</RadioGroup>
			</fieldset>
			<Button type="submit" variant="contained" startIcon={<SearchRoundedIcon />}>
				{t('Apply Filters')}
			</Button>
		</form>
	);
	return (
		<section className="agent-list-page" aria-label={t('Agents')}>
			<div className="agents-container">
				{compact ? (
					<Drawer
						open={filtersOpen}
						onClose={() => setFiltersOpen(false)}
						PaperProps={{ sx: { width: 310, maxWidth: '90vw' } }}
					>
						{filters}
					</Drawer>
				) : (
					<aside className="agents-sidebar">{filters}</aside>
				)}
				<div className="agents-main">
					<div className="agents-toolbar">
						{compact && (
							<Button
								className="agents-filter-trigger"
								startIcon={<TuneOutlinedIcon />}
								onClick={() => setFiltersOpen(true)}
								aria-expanded={filtersOpen}
							>
								{t('Filters')}
							</Button>
						)}
						<form
							className="agents-search"
							onSubmit={(event) => {
								event.preventDefault();
								updateInput({
									...input,
									page: 1,
									search: { ...input.search, text: searchText.trim() ? escapeSearch(searchText.trim()) : undefined },
								});
							}}
						>
							<IconButton type="submit" aria-label={t('Search agents')}>
								<SearchRoundedIcon />
							</IconButton>
							<input
								aria-label={t('Search agents by nickname')}
								placeholder={t('Search agents by name, location, or keyword...')}
								maxLength={100}
								value={searchText}
								onChange={(event) => setSearchText(event.target.value)}
							/>
							{searchText && (
								<IconButton
									aria-label={t('Clear search')}
									onClick={() => {
										setSearchText('');
										updateInput({ ...input, page: 1, search: { ...input.search, text: undefined } });
									}}
								>
									<CloseRoundedIcon />
								</IconButton>
							)}
						</form>
						<Select
							className="agents-sort"
							value={sorting}
							inputProps={{ 'aria-label': t('Sort agents') }}
							onChange={(event) => {
								const sort = SORTS.find((option) => option.value === event.target.value);
								if (sort)
									updateInput({
										...input,
										page: 1,
										sort: sort.value === 'oldest' ? 'createdAt' : sort.value,
										direction: sort.direction,
									});
							}}
						>
							{SORTS.map((sort) => (
								<MenuItem value={sort.value} key={sort.value}>
									{t(sort.label)}
								</MenuItem>
							))}
						</Select>
						<div className="agents-view" role="group" aria-label={t('Display mode')}>
							<IconButton aria-label={t('Grid view')} aria-pressed={view === 'grid'} onClick={() => setView('grid')}>
								<GridViewRoundedIcon />
							</IconButton>
							<IconButton aria-label={t('List view')} aria-pressed={view === 'list'} onClick={() => setView('list')}>
								<ViewListRoundedIcon />
							</IconButton>
						</div>
					</div>
					<div className="agents-summary" aria-live="polite">
						<Button
							className="agents-all"
							onClick={() => {
								setSearchText('');
								updateInput({ ...input, page: 1, search: {} });
							}}
						>
							{t('All Agents')}
							{!busy && !error && !input.search.text ? ` (${total})` : ''}
						</Button>
						<span>{busy ? t('Loading agents') : error ? '' : t('Agents found', { count: total })}</span>
					</div>
					<div className={`agents-results agents-${view}`} aria-busy={busy}>
						{busy ? (
							Array.from({ length: 9 }, (_, index) => (
								<div className="agent-card-skeleton" key={index}>
									<Skeleton variant="rectangular" height={190} />
									<Skeleton width="65%" />
									<Skeleton width="85%" />
									<Skeleton height={50} />
								</div>
							))
						) : error ? (
							<Alert severity="error" action={<Button onClick={() => void refetch()}>{t('Retry')}</Button>}>
								{t('Unable to load agents')}
							</Alert>
						) : agents.length ? (
							agents.map((agent) => (
								<AgentCard
									key={agent._id}
									agent={agent}
									likeMemberHandler={likeMemberHandler}
									followMemberHandler={followMemberHandler}
								/>
							))
						) : (
							<div className="agents-empty">
								<SearchRoundedIcon />
								<h2>{t('No Agents found!')}</h2>
								<p>{t('Try another agent nickname')}</p>
								<Button
									onClick={() => {
										setSearchText('');
										updateInput(initialInput);
									}}
								>
									{t('All Agents')}
								</Button>
							</div>
						)}
					</div>
					{!busy && !error && total > input.limit && (
						<Pagination
							className="agents-pagination"
							page={input.page}
							count={Math.ceil(total / input.limit)}
							onChange={(_, page) => updateInput({ ...input, page })}
						/>
					)}
				</div>
			</div>
		</section>
	);
};
export default withLayoutBasic(AgentList);
