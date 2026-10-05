import React, { ChangeEvent, useEffect, useState } from 'react';
import { Box, Button, Pagination, Stack, Typography } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { useRouter } from 'next/router';
import { FollowInquiry } from '../../types/follow/follow.input';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Following } from '../../types/follow/follow';
import { REACT_APP_API_URL } from '../../config';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { userVar } from '../../../apollo/store';
import { GET_MEMBER_FOLLOWINGS } from '../../../apollo/user/query';
import { T } from '../../types/common';

interface MemberFollowingsProps {
	initialInput: FollowInquiry;
	subscribeHandler: any;
	unsubscribeHandler: any;
	redirectToMemberPageHandler: any;
	likeMemberHandler: any;
}

const MemberFollowings = (props: MemberFollowingsProps) => {
	const { initialInput, subscribeHandler, unsubscribeHandler, redirectToMemberPageHandler, likeMemberHandler } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const [total, setTotal] = useState<number>(0);
	const category: any = router.query?.category ?? 'properties';
	const [followInquiry, setFollowInquiry] = useState<FollowInquiry>(initialInput);
	const [memberFollowings, setMemberFollowings] = useState<Following[]>([]);
	const user = useReactiveVar(userVar);

	/** APOLLO REQUESTS **/
	const {
		loading: getMemberFollowingsLoading,
		data: getMemberFollowingsData,
		error: getMemberFollowingsError,
		refetch: getMemberFollowingsRefetch,
	} = useQuery(GET_MEMBER_FOLLOWINGS, {
		fetchPolicy: 'network-only',
		variables: { input: followInquiry },
		skip: !followInquiry?.search?.followerId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setMemberFollowings(data?.getMemberFollowings?.list);
			setTotal(data?.getMemberFollowings?.metaCounter[0]?.total);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.memberId)
			setFollowInquiry({ ...followInquiry, search: { followerId: router.query.memberId as string } });
		else setFollowInquiry({ ...followInquiry, search: { followerId: user?._id } });
	}, [router]);

	useEffect(() => {
		getMemberFollowingsRefetch({ input: followInquiry }).then();
	}, [followInquiry]);

	/** HANDLERS **/
	const paginationHandler = async (event: ChangeEvent<unknown>, value: number) => {
		followInquiry.page = value;
		setFollowInquiry({ ...followInquiry });
	};

	if (device === 'mobile') {
		return <div>NESTAR FOLLOWS MOBILE</div>;
	} else {
		return (
			<div id="member-follows-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">{category === 'followers' ? 'Followers' : 'Followings'}</Typography>
					</Stack>
				</Stack>
				<Stack className="follows-list-box">
					<Stack className="listing-title-box">
						<Typography className="title-text">Name</Typography>
						<Typography className="title-text">Details</Typography>
						<Typography className="title-text">Subscription</Typography>
					</Stack>
					{memberFollowings?.length === 0 && (
						<div className={'no-data'}>
							<img src="/img/icons/icoAlert.svg" alt="" />
							<p>No Followings yet!</p>
						</div>
					)}
					{memberFollowings.map((follower: Following) => {
						const imagePath: string = follower?.followingData?.memberImage
							? `${REACT_APP_API_URL}/${follower?.followingData?.memberImage}`
							: '/img/profile/defaultUser.svg';
						return (
							<Stack className="follows-card-box" key={follower._id}>
								<Stack className={'info'} onClick={() => redirectToMemberPageHandler(follower?.followingData?._id)}>
									<Stack className="image-box">
										<img src={imagePath} alt="" />
									</Stack>
									<Stack className="information-box">
										<Typography className="name">{follower?.followingData?.memberNick}</Typography>
									</Stack>
								</Stack>
								<Stack className={'details-box'}>
									<Box className={'info-box'} component={'div'}>
										<p>Followers</p>
										<span>({follower?.followingData?.memberFollowers})</span>
									</Box>
									<Box className={'info-box'} component={'div'}>
										<p>Followings</p>
										<span>({follower?.followingData?.memberFollowings})</span>
									</Box>
									<Box className={'info-box'} component={'div'}>
										{follower?.meLiked && follower?.meLiked[0]?.myFavorite ? (
											<FavoriteIcon
												color="primary"
												onClick={() => {
													likeMemberHandler(follower?.followingData?._id, getMemberFollowingsRefetch, followInquiry);
												}}
											/>
										) : (
											<FavoriteBorderIcon
												onClick={() => {
													likeMemberHandler(follower?.followingData?._id, getMemberFollowingsRefetch, followInquiry);
												}}
											/>
										)}
										<span>({follower?.followingData?.memberLikes})</span>
									</Box>
								</Stack>
								{user?._id !== follower?.followingId && (
									<Stack className="action-box">
										{follower.meFollowed && follower.meFollowed[0]?.myFollowing ? (
											<>
												<Typography>Following</Typography>
												<Button
													variant="outlined"
													sx={{ background: '#f78181', ':hover': { background: '#f06363' } }}
													onClick={() =>
														unsubscribeHandler(follower?.followingData?._id, getMemberFollowingsRefetch, followInquiry)
													}
												>
													Unfollow
												</Button>
											</>
										) : (
											<Button
												variant="contained"
												sx={{ background: '#60eb60d4', ':hover': { background: '#60eb60d4' } }}
												onClick={() =>
													subscribeHandler(follower?.followingData?._id, getMemberFollowingsRefetch, followInquiry)
												}
											>
												Follow
											</Button>
										)}
									</Stack>
								)}
							</Stack>
						);
					})}
				</Stack>
				{memberFollowings.length !== 0 && (
					<Stack className="pagination-config">
						<Stack className="pagination-box">
							<Pagination
								page={followInquiry.page}
								count={Math.ceil(total / followInquiry.limit)}
								onChange={paginationHandler}
								shape="circular"
								color="primary"
							/>
						</Stack>
						<Stack className="total-result">
							<Typography>{total} followings</Typography>
						</Stack>
					</Stack>
				)}
			</div>
		);
	}
};

MemberFollowings.defaultProps = {
	initialInput: {
		page: 1,
		limit: 5,
		search: {
			followerId: '',
		},
	},
};

export default MemberFollowings;
