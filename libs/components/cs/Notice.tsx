import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { Alert, Button, Skeleton } from '@mui/material';
import EastRounded from '@mui/icons-material/EastRounded';
import NewspaperOutlined from '@mui/icons-material/NewspaperOutlined';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { BoardArticles } from '../../types/board-article/board-article';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { Direction } from '../../enums/common.enum';
import { articleExcerpt } from '../../community';
import { imageUrl } from '../../config';

const Notice = () => {
	const { t, i18n } = useTranslation('common');
	const { data, loading, error, refetch } = useQuery<{ getBoardArticles: BoardArticles }>(GET_BOARD_ARTICLES, {
		variables: {
			input: {
				page: 1,
				limit: 3,
				sort: 'createdAt',
				direction: Direction.DESC,
				search: { articleCategory: BoardArticleCategory.NEWS },
			},
		},
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
	});
	const articles = data?.getBoardArticles?.list ?? [];
	return (
		<section className="cs-updates" id="cs-updates" aria-labelledby="cs-updates-heading">
			<div className="cs-section-heading">
				<div>
					<h2 id="cs-updates-heading">{t('Latest from ANORCAR')}</h2>
					<p>{t('Updates, insights, and stories from our community.')}</p>
				</div>
				<Link className="cs-answer-link" href="/community?articleCategory=NEWS">
					{t('View all news')}
					<EastRounded fontSize="small" />
				</Link>
			</div>
			<div aria-busy={loading}>
				{error ? (
					<Alert
						severity="error"
						action={
							<Button
								onClick={() => {
									void refetch().catch(() => undefined);
								}}
							>
								{t('Retry')}
							</Button>
						}
					>
						{t('Posts could not be loaded. Please try again.')}
					</Alert>
				) : loading && !data ? (
					<div className="cs-update-grid">
						{[0, 1, 2].map((id) => (
							<Skeleton key={id} variant="rounded" height={205} />
						))}
					</div>
				) : articles.length === 0 ? (
					<div className="cs-empty">
						<NewspaperOutlined />
						<p>{t('No news posts yet. Explore the community for more discussions.')}</p>
						<Link className="cs-answer-link" href="/community">
							{t('Explore Community')}
							<EastRounded fontSize="small" />
						</Link>
					</div>
				) : (
					<div className="cs-update-grid">
						{articles.map((article) => (
							<Link
								className="cs-update-card"
								key={article._id}
								href={{
									pathname: '/community/detail',
									query: { id: article._id, articleCategory: article.articleCategory },
								}}
							>
								<div className="cs-update-image">
									<img
										src={article.articleImage ? imageUrl(article.articleImage) : '/img/car/hero.svg'}
										alt={article.articleTitle}
										loading="lazy"
										onError={(event) => {
											if (!event.currentTarget.src.endsWith('/img/car/hero.svg'))
												event.currentTarget.src = '/img/car/hero.svg';
										}}
									/>
								</div>
								<div className="cs-update-copy">
									<div className="cs-update-meta">
										<span>{t('Community news')}</span>
										<time dateTime={article.createdAt}>
											{Number.isNaN(Date.parse(article.createdAt))
												? ''
												: new Date(article.createdAt).toLocaleDateString(
														i18n.language === 'kr' ? 'ko-KR' : i18n.language === 'ru' ? 'ru-RU' : 'en-US',
														{ timeZone: 'Asia/Seoul', year: 'numeric', month: 'short', day: 'numeric' },
												  )}
										</time>
									</div>
									<h3>{article.articleTitle}</h3>
									<p>
										{articleExcerpt(article.articleContent) ||
											t('Read the latest post and join the conversation with our community.')}
									</p>
									<span className="cs-topic-action">
										{t('Read post')}
										<EastRounded fontSize="small" />
									</span>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</section>
	);
};
export default Notice;
