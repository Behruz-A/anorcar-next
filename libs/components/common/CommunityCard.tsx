import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { articleExcerpt, communityCategories } from '../../community';
import { imageUrl } from '../../config';
import { useRouter } from 'next/router';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Stack, Typography } from '@mui/material';
import { BoardArticle } from '../../types/board-article/board-article';
import Moment from 'react-moment';
import { REACT_APP_API_URL } from '../../config';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import IconButton from '@mui/material/IconButton';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { CustomJwtPayload } from '../../types/customJwtPayload';

interface CommunityCardProps {
	boardArticle: BoardArticle;
	browse?: boolean;
	size?: string;
	likeArticleHandler?: (
		event: React.MouseEvent<HTMLButtonElement>,
		user: CustomJwtPayload,
		id: string,
	) => void | Promise<void>;
}

const BrowseCommunityCard = ({ boardArticle: article, likeArticleHandler }: CommunityCardProps) => {
	const { t, i18n } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [failedImage, setFailedImage] = useState<string | null>(null);
	const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const portrait = article.articleImage ? imageUrl(article.articleImage) : '';
	const avatar = article.memberData?.memberImage ? imageUrl(article.memberData.memberImage) : '';
	const author = article.memberData?.memberFullName?.trim() || article.memberData?.memberNick || t('Community member');
	const date = new Date(article.createdAt);
	const locale = i18n.language === 'kr' ? 'ko' : i18n.language;
	const liked = Boolean(article.meLiked?.[0]?.myFavorite);
	const href = { pathname: '/community/detail', query: { articleCategory: article.articleCategory, id: article._id } };
	const memberId = article.memberData?._id || article.memberId;
	const excerpt = articleExcerpt(article.articleContent);
	const toggleLike = async (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		if (!likeArticleHandler || pending) return;
		setPending(true);
		try {
			await likeArticleHandler(event, user, article._id);
		} finally {
			setPending(false);
		}
	};
	return (
		<article className="community-post-card">
			<div className="community-post-image">
				<Link href={href} aria-label={article.articleTitle} tabIndex={-1}>
					{portrait && failedImage !== portrait ? (
						<Image
							fill
							unoptimized
							sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw"
							src={portrait}
							alt=""
							onError={() => setFailedImage(portrait)}
						/>
					) : (
						<span className="community-post-placeholder">
							<ForumOutlinedIcon />
						</span>
					)}
				</Link>
				<span className="community-post-category">
					{t(communityCategories.find((item) => item.value === article.articleCategory)?.label || 'Community')}
				</span>
			</div>
			<div className="community-post-content">
				<h2>
					<Link href={href} title={article.articleTitle}>
						{article.articleTitle}
					</Link>
				</h2>
				<p className="community-post-excerpt">{excerpt || t('Read the discussion')}</p>
				<footer className="community-post-footer">
					<Link
						className="community-post-author"
						href={memberId === user._id ? '/mypage' : { pathname: '/member', query: { memberId } }}
					>
						{avatar && failedAvatar !== avatar ? (
							<Image width={32} height={32} unoptimized src={avatar} alt="" onError={() => setFailedAvatar(avatar)} />
						) : (
							<span className="community-author-avatar" aria-hidden="true">
								{Array.from(article.memberData?.memberNick || author || '')
									.slice(0, 2)
									.join('')
									.toLocaleUpperCase()}
							</span>
						)}
						<span>
							<strong>{author}</strong>
							{!Number.isNaN(date.getTime()) && (
								<time dateTime={article.createdAt}>
									{new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)}
								</time>
							)}
						</span>
					</Link>
					<div className="community-post-stats">
						<span aria-label={`${t('Views')}: ${article.articleViews}`} title={t('Views')}>
							<RemoveRedEyeIcon />
							{new Intl.NumberFormat(locale, { notation: 'compact' }).format(article.articleViews)}
						</span>
						<IconButton
							aria-label={t(liked ? 'Unlike post' : 'Like post')}
							aria-pressed={liked}
							disabled={pending || !likeArticleHandler}
							onClick={(event) => void toggleLike(event)}
						>
							{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
							<span>{new Intl.NumberFormat(locale, { notation: 'compact' }).format(article.articleLikes)}</span>
						</IconButton>
						<span aria-label={`${t('Comments')}: ${article.articleComments}`} title={t('Comments')}>
							<ChatBubbleOutlineRoundedIcon />
							{new Intl.NumberFormat(locale, { notation: 'compact' }).format(article.articleComments)}
						</span>
					</div>
				</footer>
			</div>
		</article>
	);
};

const CommunityCard = (props: CommunityCardProps) => {
	const { boardArticle, size = 'normal', likeArticleHandler } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const imagePath: string = boardArticle?.articleImage
		? `${REACT_APP_API_URL}/${boardArticle?.articleImage}`
		: '/img/community/communityImg.png';

	/** HANDLERS **/
	const chooseArticleHandler = (boardArticle: BoardArticle) => {
		router.push(
			{
				pathname: '/community/detail',
				query: { articleCategory: boardArticle?.articleCategory, id: boardArticle?._id },
			},
			undefined,
			{ shallow: true },
		);
	};

	const goMemberPage = (id: string) => {
		if (id === user?._id) router.push('/mypage');
		else router.push(`/member?memberId=${id}`);
	};

	if (props.browse) return <BrowseCommunityCard {...props} />;
	if (device === 'mobile') {
		return <div>COMMUNITY CARD MOBILE</div>;
	} else {
		return (
			<Stack
				sx={{ width: size === 'small' ? '285px' : '317px' }}
				className="community-general-card-config"
				onClick={() => chooseArticleHandler(boardArticle)}
			>
				<Stack className="image-box">
					<img src={imagePath} alt="" className="card-img" />
				</Stack>
				<Stack className="desc-box" sx={{ marginTop: '-20px' }}>
					<Stack>
						<Typography
							className="desc"
							onClick={(e: React.MouseEvent<HTMLElement>) => {
								e.stopPropagation();
								goMemberPage(boardArticle?.memberData?._id as string);
							}}
						>
							{boardArticle?.memberData?.memberNick}
						</Typography>
						<Typography className="title">{boardArticle?.articleTitle}</Typography>
					</Stack>
					<Stack className={'buttons'}>
						<IconButton color={'default'}>
							<RemoveRedEyeIcon />
						</IconButton>
						<Typography className="view-cnt">{boardArticle?.articleViews}</Typography>
						<IconButton
							color={'default'}
							onClick={(e: React.MouseEvent<HTMLButtonElement>) => likeArticleHandler?.(e, user, boardArticle._id)}
						>
							{boardArticle?.meLiked && boardArticle?.meLiked[0]?.myFavorite ? (
								<FavoriteIcon color={'primary'} />
							) : (
								<FavoriteBorderIcon />
							)}
						</IconButton>
						<Typography className="view-cnt">{boardArticle?.articleLikes}</Typography>
					</Stack>
				</Stack>
				<Stack className="date-box">
					<Moment className="month" format={'MMMM'}>
						{boardArticle?.createdAt}
					</Moment>
					<Typography className="day">
						<Moment format={'DD'}>{boardArticle?.createdAt}</Moment>
					</Typography>
				</Stack>
			</Stack>
		);
	}
};

export default CommunityCard;
