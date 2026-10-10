import React, { useEffect, useState } from 'react';
import { GetStaticProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Alert, Button, IconButton, MenuItem, Pagination, Select, Skeleton } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import CommunityCard from '../../libs/components/common/CommunityCard';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { BoardArticles } from '../../libs/types/board-article/board-article';
import { BoardArticlesInquiry } from '../../libs/types/board-article/board-article.input';
import { CustomJwtPayload } from '../../libs/types/customJwtPayload';
import { Direction } from '../../libs/enums/common.enum';
import { communityCategories } from '../../libs/community';
import { GET_BOARD_ARTICLES } from '../../apollo/user/query';
import { LIKE_TARGET_BOARD_ARTICLE } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});
const sorts = [
	{ value: 'latest', label: 'Latest', sort: 'createdAt', direction: Direction.DESC },
	{ value: 'oldest', label: 'Oldest', sort: 'createdAt', direction: Direction.ASC },
	{ value: 'likes', label: 'Most liked', sort: 'articleLikes', direction: Direction.DESC },
	{ value: 'views', label: 'Most viewed', sort: 'articleViews', direction: Direction.DESC },
];
const Community: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [mounted, setMounted] = useState(false);
	const [searchText, setSearchText] = useState('');
	const category = communityCategories.find((item) => item.value === router.query.articleCategory)?.value;
	const text = typeof router.query.q === 'string' ? router.query.q.slice(0, 100) : '';
	const sort = sorts.find((item) => item.value === router.query.sort) ?? sorts[0];
	const rawPage = typeof router.query.page === 'string' ? Number(router.query.page) : 1;
	const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 100000 ? rawPage : 1;
	const view = router.query.view === 'list' ? 'list' : 'grid';
	useEffect(() => {
		setMounted(true);
	}, []);
	useEffect(() => {
		setSearchText(text);
	}, [text]);
	const input: BoardArticlesInquiry = {
		page,
		limit: 6,
		sort: sort.sort,
		direction: sort.direction,
		search: {
			...(category ? { articleCategory: category } : {}),
			...(text.trim() ? { text: text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') } : {}),
		},
	};
	const { data, loading, error, refetch } = useQuery<{ getBoardArticles: BoardArticles }>(GET_BOARD_ARTICLES, {
		variables: { input },
		skip: !router.isReady || !mounted,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	const [likeArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);
	const articles = data?.getBoardArticles.list ?? [];
	const total = data?.getBoardArticles.metaCounter?.[0]?.total ?? 0;
	const busy = !mounted || !router.isReady || loading;
	const update = (values: Record<string, string | undefined>) => {
		const query: Record<string, string> = {
			...(category ? { articleCategory: category } : {}),
			...(text ? { q: text } : {}),
			...(sort.value !== 'latest' ? { sort: sort.value } : {}),
			...(page > 1 ? { page: String(page) } : {}),
			...(view === 'list' ? { view } : {}),
		};
		for (const [key, value] of Object.entries(values)) {
			if (value) query[key] = value;
			else delete query[key];
		}
		void router.push({ pathname: '/community', query }, undefined, { shallow: true, scroll: false });
	};
	const likeArticleHandler = async (
		event: React.MouseEvent<HTMLButtonElement>,
		viewer: CustomJwtPayload,
		id: string,
	) => {
		event.stopPropagation();
		event.preventDefault();
		try {
			if (!viewer._id) throw new Error(t('Please login first!'));
			await likeArticle({ variables: { input: id } });
			await refetch({ input });
		} catch (error: unknown) {
			await sweetMixinErrorAlert(error instanceof Error ? error.message : t('Something went wrong!'));
		}
	};
	const writePost = async () => {
		if (!user._id) {
			await sweetMixinErrorAlert(t('Please login first!'));
			return;
		}
		await router.push({ pathname: '/mypage', query: { category: 'writeArticle' } });
	};
	const reset = () => {
		setSearchText('');
		update({ articleCategory: undefined, q: undefined, page: undefined });
	};
	return (
		<main id="community-list-page">
			<div className="community-browse-container">
				<header className="community-heading">
					<div>
						<h1>{t('Explore Discussions')}</h1>
						<p>{t('Community discussions intro')}</p>
					</div>
					<Button
						className="community-write"
						variant="contained"
						startIcon={<EditOutlinedIcon />}
						onClick={() => void writePost()}
					>
						{t('Write a Post')}
					</Button>
				</header>
				<nav className="community-categories" aria-label={t('Post categories')}>
					<button
						type="button"
						aria-pressed={!category}
						onClick={() => update({ articleCategory: undefined, page: undefined })}
					>
						{t('All Posts')}
					</button>
					{communityCategories.map((item) => (
						<button
							type="button"
							key={item.value}
							aria-pressed={category === item.value}
							onClick={() => update({ articleCategory: item.value, page: undefined })}
						>
							{t(item.label)}
						</button>
					))}
				</nav>
				<div className="community-toolbar">
					<form
						className="community-search"
						onSubmit={(event) => {
							event.preventDefault();
							update({ q: searchText.trim(), page: undefined });
						}}
					>
						<IconButton type="submit" aria-label={t('Search posts')}>
							<SearchRoundedIcon />
						</IconButton>
						<input
							aria-label={t('Search community posts')}
							placeholder={t('Search community posts')}
							value={searchText}
							maxLength={100}
							onChange={(event) => setSearchText(event.target.value)}
						/>
						{searchText && (
							<IconButton
								type="button"
								aria-label={t('Clear search')}
								onClick={() => {
									setSearchText('');
									update({ q: undefined, page: undefined });
								}}
							>
								<CloseRoundedIcon />
							</IconButton>
						)}
					</form>
					<div className="community-toolbar-actions">
						<div className="community-sort">
							<span>{t('Sort')}:</span>
							<Select
								value={sort.value}
								inputProps={{ 'aria-label': t('Sort posts') }}
								onChange={(event) =>
									update({ sort: event.target.value === 'latest' ? undefined : event.target.value, page: undefined })
								}
							>
								{sorts.map((item) => (
									<MenuItem key={item.value} value={item.value}>
										{t(item.label)}
									</MenuItem>
								))}
							</Select>
						</div>
						<div className="community-view" role="group" aria-label={t('Results view')}>
							<IconButton
								aria-label={t('Grid view')}
								aria-pressed={view === 'grid'}
								onClick={() => update({ view: undefined })}
							>
								<GridViewRoundedIcon />
							</IconButton>
							<IconButton
								aria-label={t('List view')}
								aria-pressed={view === 'list'}
								onClick={() => update({ view: 'list' })}
							>
								<ViewListRoundedIcon />
							</IconButton>
						</div>
					</div>
				</div>
				<div className="community-results-count" aria-live="polite">
					{busy ? t('Loading posts') : error ? '' : t('Community posts found', { count: total })}
				</div>
				<div className={`community-results community-${view}`} aria-busy={busy}>
					{busy ? (
						Array.from({ length: 6 }, (_, i) => (
							<div className="community-card-skeleton" key={i}>
								<Skeleton variant="rectangular" height={210} />
								<Skeleton height={40} />
								<Skeleton height={56} />
								<Skeleton height={44} />
							</div>
						))
					) : error ? (
						<Alert
							severity="error"
							action={<Button onClick={() => void refetch().catch(() => undefined)}>{t('Retry')}</Button>}
						>
							{t('Unable to load posts')}
						</Alert>
					) : articles.length ? (
						articles.map((article) => (
							<CommunityCard browse boardArticle={article} likeArticleHandler={likeArticleHandler} key={article._id} />
						))
					) : (
						<div className="community-empty">
							<ForumOutlinedIcon />
							<h2>{t('No posts found')}</h2>
							<p>{t('Try another post search')}</p>
							<Button onClick={reset}>{t('Browse all posts')}</Button>
						</div>
					)}
				</div>
				{!busy && !error && total > 6 && (
					<Pagination
						className="community-pagination"
						count={Math.ceil(total / 6)}
						page={page}
						shape="rounded"
						onChange={(_, value) => update({ page: value === 1 ? undefined : String(value) })}
					/>
				)}
			</div>
		</main>
	);
};
export default withLayoutBasic(Community);
