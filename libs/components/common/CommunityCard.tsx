import React from 'react';
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
	size?: string;
	likeArticleHandler?: any;
}

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
