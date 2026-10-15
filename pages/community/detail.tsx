import React, { useEffect, useRef, useState } from 'react';
import { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
	Alert,
	Avatar,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Pagination,
	Skeleton,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { communityCategories } from '../../libs/community';
import { imageUrl } from '../../libs/config';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { Comment, Comments } from '../../libs/types/comment/comment';
import { CommentsInquiry, CommentInput } from '../../libs/types/comment/comment.input';
import { CommentUpdate } from '../../libs/types/comment/comment.update';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { Direction } from '../../libs/enums/common.enum';
import { userVar } from '../../apollo/store';
import { GET_BOARD_ARTICLE, GET_COMMENTS } from '../../apollo/user/query';
import { CREATE_COMMENT, LIKE_TARGET_BOARD_ARTICLE, UPDATE_COMMENT } from '../../apollo/user/mutation';
import { sweetConfirmAlert, sweetMixinErrorAlert } from '../../libs/sweetAlert';
import ArticleMember from '../../libs/components/community/ArticleMember';

const ToastViewer = dynamic(() => import('../../libs/components/community/TViewer'), { ssr: false });
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});

const CommunityDetail: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const articleId = typeof router.query.id === 'string' ? router.query.id : '';
	const validId = /^[a-f\d]{24}$/i.test(articleId);
	const [mounted, setMounted] = useState(false);
	const [pagination, setPagination] = useState({ articleId, page: 1 });
	const page = pagination.articleId === articleId ? pagination.page : 1;
	const [comment, setComment] = useState('');
	const [editing, setEditing] = useState<Comment | null>(null);
	const [draft, setDraft] = useState('');
	const [message, setMessage] = useState('');
	const [editError, setEditError] = useState('');
	const [commentBusy, setCommentBusy] = useState(false);
	const [likeBusy, setLikeBusy] = useState(false);
	const commentLock = useRef(false);
	const likeLock = useRef(false);
	const [failedCover, setFailedCover] = useState('');
	useEffect(() => {
		setMounted(true);
	}, []);
	useEffect(() => {
		setComment('');
		setEditing(null);
		setMessage('');
		setEditError('');
	}, [articleId]);
	const skip = !mounted || !router.isReady || !validId;
	const articleQuery = useQuery<{ getBoardArticle: BoardArticle | null }>(GET_BOARD_ARTICLE, {
		variables: { input: articleId },
		skip,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	const article = articleQuery.data?.getBoardArticle;
	const input: CommentsInquiry = {
		page,
		limit: 5,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: { commentRefId: articleId },
	};
	const commentsQuery = useQuery<{ getComments: Comments }>(GET_COMMENTS, {
		variables: { input },
		skip: skip || !article,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	const comments = commentsQuery.data?.getComments.list ?? [];
	const total = commentsQuery.data?.getComments.metaCounter?.[0]?.total ?? article?.articleComments ?? 0;
	const category = communityCategories.find((item) => item.value === article?.articleCategory);
	const backHref = { pathname: '/community', query: category ? { articleCategory: category.value } : {} };
	const [likeArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);
	const [createComment] = useMutation(CREATE_COMMENT);
	const [updateComment] = useMutation(UPDATE_COMMENT);
	const errorText = (error: unknown) => (error instanceof Error ? error.message : t('Something went wrong!'));
	const requireUser = async () => {
		if (user._id) return true;
		await sweetMixinErrorAlert(t('Please login first!'));
		return false;
	};
	const toggleLike = async () => {
		if (likeLock.current || !article || !(await requireUser())) return;
		if (likeLock.current) return;
		likeLock.current = true;
		setLikeBusy(true);
		setMessage('');
		try {
			await likeArticle({ variables: { input: articleId } });
			await articleQuery.refetch();
		} catch (error: unknown) {
			setMessage(errorText(error));
		} finally {
			likeLock.current = false;
			setLikeBusy(false);
		}
	};
	const publishComment = async (event: React.FormEvent) => {
		event.preventDefault();
		if (commentLock.current || !comment.trim() || !(await requireUser())) return;
		if (commentLock.current) return;
		commentLock.current = true;
		setCommentBusy(true);
		setMessage('');
		try {
			const commentInput: CommentInput = {
				commentGroup: CommentGroup.ARTICLE,
				commentRefId: articleId,
				commentContent: comment.trim(),
			};
			await createComment({ variables: { input: commentInput } });
			setComment('');
			setPagination({ articleId, page: 1 });
			await Promise.all([commentsQuery.refetch({ input: { ...input, page: 1 } }), articleQuery.refetch()]);
		} catch (error: unknown) {
			setMessage(errorText(error));
		} finally {
			commentLock.current = false;
			setCommentBusy(false);
		}
	};
	const saveComment = async (deleting?: Comment) => {
		const target = deleting ?? editing;
		if (commentLock.current || !target || target.memberId !== user._id) return;
		if (!deleting && (!draft.trim() || draft.trim() === target.commentContent)) return;
		commentLock.current = true;
		setCommentBusy(true);
		setEditError('');
		setMessage('');
		try {
			if (deleting && !(await sweetConfirmAlert(t('Delete this comment?')))) return;
			const update: CommentUpdate = {
				_id: target._id,
				...(deleting ? { commentStatus: CommentStatus.DELETE } : { commentContent: draft.trim() }),
			};
			await updateComment({ variables: { input: update } });
			setEditing(null);
			const nextPage = deleting && comments.length === 1 && page > 1 ? page - 1 : page;
			setPagination({ articleId, page: nextPage });
			await Promise.all([commentsQuery.refetch({ input: { ...input, page: nextPage } }), articleQuery.refetch()]);
		} catch (error: unknown) {
			deleting ? setMessage(errorText(error)) : setEditError(errorText(error));
		} finally {
			commentLock.current = false;
			setCommentBusy(false);
		}
	};
	const writePost = async () => {
		if (await requireUser()) void router.push({ pathname: '/mypage', query: { category: 'writeArticle' } });
	};
	const waiting = !mounted || !router.isReady || (articleQuery.loading && !article);
	const cover = article?.articleImage ? imageUrl(article.articleImage) : '';
	const liked = Boolean(article?.meLiked?.[0]?.myFavorite);
	return (
		<div id="community-detail-page">
			<Head>
				<title>{article ? `${article.articleTitle} | Anorcar` : `${t('Community')} | Anorcar`}</title>
			</Head>
			<div className="article-container">
				<div className="article-toolbar">
					<Link href={backHref}>
						<ArrowBackRoundedIcon fontSize="small" />
						{t('Back to community')}
					</Link>
					<Button className="article-primary" startIcon={<EditOutlinedIcon />} onClick={writePost}>
						{t('Write a post')}
					</Button>
				</div>
				{waiting ? (
					<div className="article-state" role="status" aria-label={t('Loading article')}>
						<Skeleton width="70%" height={65} />
						<Skeleton height={35} />
						<Skeleton variant="rounded" height={280} />
					</div>
				) : articleQuery.error ? (
					<Alert
						severity="error"
						action={<Button onClick={() => void articleQuery.refetch()}>{t('Try again')}</Button>}
					>
						{t('Article could not be loaded.')}
					</Alert>
				) : !validId || !article ? (
					<div className="article-state">
						<h2>{t('Article unavailable')}</h2>
						<p>{t('This article may have been removed.')}</p>
						<Link href="/community">{t('Browse community')}</Link>
					</div>
				) : (
					<div className="article-layout">
						<aside className="article-sidebar">
							<h2>{t('Community')}</h2>
							<nav aria-label={t('Article categories')}>
								{communityCategories.map((item) => (
									<Link
										key={item.value}
										href={{ pathname: '/community', query: { articleCategory: item.value } }}
										aria-current={item.value === article.articleCategory ? 'page' : undefined}
									>
										{t(item.label)}
									</Link>
								))}
							</nav>
						</aside>
						<div className="article-main">
							<article className="article-panel">
								<header className="article-heading">
									<Link className="article-category" href={backHref}>
										{t(category?.label ?? 'Community')}
									</Link>
									<h1 className="content-data">{article.articleTitle}</h1>
									<div className="article-byline">
										<ArticleMember member={article.memberData} memberId={article.memberId} date={article.createdAt} />
										<div className="article-stats">
											<span>
												<VisibilityOutlinedIcon />
												{article.articleViews} {t('Views')}
											</span>
											<a href="#article-comments">
												<ChatBubbleOutlineRoundedIcon />
												{total} {t('Comments')}
											</a>
										</div>
									</div>
								</header>
								{cover && failedCover !== cover && (
									<img className="article-cover" src={cover} alt="" onError={() => setFailedCover(cover)} />
								)}
								<div className="article-body">
									<ToastViewer key={article._id} markdown={article.articleContent} />
								</div>
								<footer className="article-reactions">
									<Button
										variant="outlined"
										aria-pressed={liked}
										disabled={likeBusy}
										onClick={toggleLike}
										startIcon={liked ? <ThumbUpAltIcon /> : <ThumbUpOffAltIcon />}
									>
										{t(liked ? 'Liked' : 'Like')} ({article.articleLikes})
									</Button>
									<a href="#article-comments">
										{t('Join the conversation')}
										<ChatBubbleOutlineRoundedIcon fontSize="small" />
									</a>
								</footer>
							</article>
							<section
								id="article-comments"
								className="article-panel article-comments"
								aria-labelledby="comments-heading"
							>
								<h2 id="comments-heading">
									{t('Comments')} ({total})
								</h2>
								{message && (
									<Alert severity="error" onClose={() => setMessage('')}>
										{message}
									</Alert>
								)}
								{user._id ? (
									<form className="comment-form" onSubmit={publishComment}>
										<label htmlFor="new-article-comment">{t('Leave a comment')}</label>
										<textarea
											id="new-article-comment"
											maxLength={100}
											rows={3}
											value={comment}
											disabled={commentBusy}
											onChange={(event) => setComment(event.target.value)}
										/>
										<div className="comment-form-actions">
											<span>{comment.length}/100</span>
											<Button type="submit" className="article-primary" disabled={commentBusy || !comment.trim()}>
												{t(commentBusy ? 'Saving...' : 'Post comment')}
											</Button>
										</div>
									</form>
								) : (
									<div className="comment-signin">
										<Avatar>
											<ChatBubbleOutlineRoundedIcon />
										</Avatar>
										<p>{t('Sign in to join the conversation.')}</p>
										<Link href="/account/join">{t('Sign in')}</Link>
									</div>
								)}
								{commentsQuery.error ? (
									<Alert
										severity="error"
										action={<Button onClick={() => void commentsQuery.refetch()}>{t('Try again')}</Button>}
									>
										{t('Comments could not be loaded.')}
									</Alert>
								) : commentsQuery.loading ? (
									<div className="comment-loading" role="status" aria-label={t('Loading comments')}>
										<CircularProgress size={24} />
									</div>
								) : comments.length ? (
									<ul className="article-comment-list">
										{comments.map((item) => (
											<li key={item._id}>
												<div className="comment-heading">
													<ArticleMember member={item.memberData} memberId={item.memberId} date={item.createdAt} />
													{item.memberId === user._id && (
														<div className="comment-actions">
															<IconButton
																aria-label={t('Edit comment')}
																disabled={commentBusy}
																onClick={() => {
																	setEditing(item);
																	setDraft(item.commentContent);
																	setEditError('');
																}}
															>
																<EditOutlinedIcon fontSize="small" />
															</IconButton>
															<IconButton
																aria-label={t('Delete comment')}
																disabled={commentBusy}
																onClick={() => void saveComment(item)}
															>
																<DeleteOutlineRoundedIcon fontSize="small" />
															</IconButton>
														</div>
													)}
												</div>
												<p>{item.commentContent}</p>
											</li>
										))}
									</ul>
								) : (
									<p className="comments-empty">{t('No comments yet. Start the conversation.')}</p>
								)}
								{total > input.limit && (
									<Pagination
										aria-label={t('Comments pagination')}
										count={Math.ceil(total / input.limit)}
										page={page}
										disabled={commentBusy || commentsQuery.loading}
										onChange={(_, value) => setPagination({ articleId, page: value })}
									/>
								)}
							</section>
						</div>
					</div>
				)}
			</div>
			<Dialog
				open={Boolean(editing)}
				onClose={() => {
					if (!commentBusy) setEditing(null);
				}}
				fullWidth
				maxWidth="sm"
				aria-labelledby="edit-comment-title"
				className="article-edit-dialog"
			>
				<DialogTitle id="edit-comment-title">{t('Edit comment')}</DialogTitle>
				<DialogContent>
					{editError && <Alert severity="error">{editError}</Alert>}
					<label htmlFor="edit-article-comment">{t('Comment')}</label>
					<textarea
						autoFocus
						id="edit-article-comment"
						rows={4}
						maxLength={100}
						value={draft}
						disabled={commentBusy}
						onChange={(event) => setDraft(event.target.value)}
					/>
					<span>{draft.length}/100</span>
				</DialogContent>
				<DialogActions>
					<Button disabled={commentBusy} onClick={() => setEditing(null)}>
						{t('Cancel')}
					</Button>
					<Button
						variant="contained"
						disabled={commentBusy || !draft.trim() || draft.trim() === editing?.commentContent}
						onClick={() => void saveComment()}
					>
						{t(commentBusy ? 'Saving...' : 'Save changes')}
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};
export default withLayoutBasic(CommunityDetail);
