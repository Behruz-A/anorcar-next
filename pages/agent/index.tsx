import React, { useEffect, useState } from 'react';
import { GetStaticProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useMutation, useQuery } from '@apollo/client';
import { Alert, Button, IconButton, MenuItem, Pagination, Select, Skeleton } from '@mui/material';
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
import { LIKE_TARGET_MEMBER } from '../../apollo/user/mutation';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { Messages } from '../../libs/config';

const SORTS = [
	{ value: 'memberRank', label: 'Top Agents', direction: Direction.DESC },
	{ value: 'createdAt', label: 'Recent', direction: Direction.DESC },
	{ value: 'oldest', label: 'Oldest', direction: Direction.ASC },
	{ value: 'memberLikes', label: 'Likes', direction: Direction.DESC },
	{ value: 'memberViews', label: 'Views', direction: Direction.DESC },
];
const initialInput: AgentsInquiry = { page: 1, limit: 8, sort: 'memberRank', direction: Direction.DESC, search: {} };
const escapeSearch = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function readInquiry(raw: string | string[] | undefined): AgentsInquiry {
	try {
		const value = JSON.parse(typeof raw === 'string' ? raw : '{}');
		return {
			page: Number.isSafeInteger(value.page) && value.page > 0 ? value.page : 1,
			limit: 8,
			sort: SORTS.some((sort) => sort.value === value.sort && sort.value !== 'oldest') ? value.sort : 'memberRank',
			direction: value.direction === Direction.ASC ? Direction.ASC : Direction.DESC,
			search: typeof value.search?.text === 'string' ? { text: value.search.text.slice(0, 240) } : {},
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
	const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);
	useEffect(() => {
		if (!router.isReady) return;
		setMounted(true);
		const next = readInquiry(router.query.input);
		setInput(next);
		setSearchText((next.search.text ?? '').replace(/\\([.*+?^${}()|[\]\\])/g, '$1'));
	}, [router.isReady, router.query.input]);
	const { data, loading, error, refetch } = useQuery<{ getAgents: Members }>(GET_AGENTS, {
		variables: { input },
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
		skip: !router.isReady || !mounted,
	});
	const busy = loading || !router.isReady || !mounted;
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
			await refetch({ input });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: unknown) {
			await sweetMixinErrorAlert(err instanceof Error ? err.message : 'Unable to like agent');
		}
	};
	const sorting = input.sort === 'createdAt' && input.direction === Direction.ASC ? 'oldest' : input.sort;
	return (
		<section className="agent-list-page" aria-label={t('Agents')}>
			<div className="agents-container">
				<div className="agents-toolbar">
					<form
						className="agents-search"
						onSubmit={(event) => {
							event.preventDefault();
							updateInput({ ...input, page: 1, search: { text: escapeSearch(searchText.trim()) } });
						}}
					>
						<IconButton type="submit" aria-label={t('Search agents')}>
							<SearchRoundedIcon />
						</IconButton>
						<input
							aria-label={t('Search agents by nickname')}
							placeholder={t('Search agents by nickname')}
							maxLength={100}
							value={searchText}
							onChange={(event) => setSearchText(event.target.value)}
						/>
						{searchText && (
							<IconButton
								aria-label={t('Clear search')}
								onClick={() => {
									setSearchText('');
									updateInput({ ...input, page: 1, search: {} });
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
						Array.from({ length: 8 }, (_, index) => (
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
						agents.map((agent) => <AgentCard key={agent._id} agent={agent} likeMemberHandler={likeMemberHandler} />)
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
		</section>
	);
};
export default withLayoutBasic(AgentList);
