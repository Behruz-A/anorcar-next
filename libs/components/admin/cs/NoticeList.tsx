import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import {
	Alert,
	Button,
	CircularProgress,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
} from '@mui/material';
import { GET_ALL_BOARD_ARTICLES_BY_ADMIN } from '../../../../apollo/admin/query';
import { BoardArticles } from '../../../types/board-article/board-article';
import { BoardArticleCategory } from '../../../enums/board-article.enum';
import { Direction } from '../../../enums/common.enum';

export const NoticeList = () => {
	const [page, setPage] = useState(0);
	const [limit, setLimit] = useState(10);
	const { data, loading, error, refetch } = useQuery<{ getAllBoardArticlesByAdmin: BoardArticles }>(
		GET_ALL_BOARD_ARTICLES_BY_ADMIN,
		{
			variables: {
				input: {
					page: page + 1,
					limit,
					sort: 'createdAt',
					direction: Direction.DESC,
					search: { articleCategory: BoardArticleCategory.NEWS },
				},
			},
			fetchPolicy: 'network-only',
			notifyOnNetworkStatusChange: true,
		},
	);
	if (error)
		return (
			<Alert severity="error" action={<Button onClick={() => void refetch().catch(() => undefined)}>Retry</Button>}>
				News posts could not be loaded.
			</Alert>
		);
	return (
		<>
			<TableContainer aria-busy={loading}>
				<Table aria-label="News posts">
					<TableHead>
						<TableRow>
							<TableCell>Title</TableCell>
							<TableCell>Status</TableCell>
							<TableCell>Views</TableCell>
							<TableCell>Published</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={4}>
									<CircularProgress size={24} aria-label="Loading news" />
								</TableCell>
							</TableRow>
						) : (
							(data?.getAllBoardArticlesByAdmin.list ?? []).map((article) => (
								<TableRow key={article._id}>
									<TableCell>
										{article.articleStatus === 'ACTIVE' ? (
											<Link
												href={{
													pathname: '/community/detail',
													query: { id: article._id, articleCategory: article.articleCategory },
												}}
											>
												{article.articleTitle}
											</Link>
										) : (
											article.articleTitle
										)}
									</TableCell>
									<TableCell>{article.articleStatus}</TableCell>
									<TableCell>{article.articleViews}</TableCell>
									<TableCell>
										{new Date(article.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Seoul' })}
									</TableCell>
								</TableRow>
							))
						)}
						{!loading && !data?.getAllBoardArticlesByAdmin.list.length && (
							<TableRow>
								<TableCell colSpan={4}>No news posts.</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableContainer>
			<TablePagination
				component="div"
				page={page}
				rowsPerPage={limit}
				rowsPerPageOptions={[10, 20, 50]}
				count={data?.getAllBoardArticlesByAdmin.metaCounter?.[0]?.total ?? 0}
				onPageChange={(_event, nextPage) => setPage(nextPage)}
				onRowsPerPageChange={(event) => {
					setLimit(Number(event.target.value));
					setPage(0);
				}}
			/>
		</>
	);
};
