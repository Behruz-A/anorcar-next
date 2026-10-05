import React from 'react';
import { useRouter } from 'next/router';
import { Stack, Typography, Box, List, ListItem } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import PortraitIcon from '@mui/icons-material/Portrait';
import IconButton from '@mui/material/IconButton';
import { REACT_APP_API_URL } from '../../config';
import { logOut } from '../../auth';
import { sweetConfirmAlert, sweetMixinErrorAlert } from '../../sweetAlert';

const MyMenu = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const pathname = router.query.category ?? 'myProfile';
	const category: any = router.query?.category ?? 'myProfile';
	const user = useReactiveVar(userVar);

	/** HANDLERS **/
	const logoutHandler = async () => {
		try {
			if (await sweetConfirmAlert('Do you want to logout?')) logOut();
		} catch (err: any) {
			console.log('ERROR, logoutHandler:', err.message);
		}
	};

	if (device === 'mobile') {
		return <div>MY MENU</div>;
	} else {
		return (
			<Stack width={'100%'} padding={'30px 24px'}>
				<Stack className={'profile'}>
					<Box component={'div'} className={'profile-img'}>
						<img
							src={user?.memberImage ? `${REACT_APP_API_URL}/${user?.memberImage}` : '/img/profile/defaultUser.svg'}
							alt={'member-photo'}
						/>
					</Box>
					<Stack className={'user-info'}>
						<Typography className={'user-name'}>{user?.memberNick}</Typography>
						<Box component={'div'} className={'user-phone'}>
							<img src={'/img/icons/call.svg'} alt={'icon'} />
							<Typography className={'p-number'}>{user?.memberPhone}</Typography>
						</Box>
						{user?.memberType === 'ADMIN' ? (
							<a href="/_admin/users" target={'_blank'}>
								<Typography className={'view-list'}>{user?.memberType}</Typography>
							</a>
						) : (
							<Typography className={'view-list'}>{user?.memberType}</Typography>
						)}
					</Stack>
				</Stack>
				<Stack className={'sections'}>
					<Stack className={'section'} style={{ height: user.memberType === 'AGENT' ? '228px' : '153px' }}>
						<Typography className="title" variant={'h5'}>
							MANAGE LISTINGS
						</Typography>
						<List className={'sub-section'}>
							{user.memberType === 'AGENT' && (
								<>
									<ListItem className={pathname === 'addProperty' ? 'focus' : ''}>
										<Link
											href={{
												pathname: '/mypage',
												query: { category: 'addProperty' },
											}}
											scroll={false}
										>
											<div className={'flex-box'}>
												{category === 'addProperty' ? (
													<img className={'com-icon'} src={'/img/icons/whiteTab.svg'} alt={'com-icon'} />
												) : (
													<img className={'com-icon'} src={'/img/icons/newTab.svg'} alt={'com_icon'} />
												)}
												<Typography className={'sub-title'} variant={'subtitle1'} component={'p'}>
													Add Property
												</Typography>
												<IconButton aria-label="delete" sx={{ ml: '40px' }}>
													<PortraitIcon style={{ color: 'red' }} />
												</IconButton>
											</div>
										</Link>
									</ListItem>
									<ListItem className={pathname === 'myProperties' ? 'focus' : ''}>
										<Link
											href={{
												pathname: '/mypage',
												query: { category: 'myProperties' },
											}}
											scroll={false}
										>
											<div className={'flex-box'}>
												{category === 'myProperties' ? (
													<img className={'com-icon'} src={'/img/icons/homeWhite.svg'} alt={'com-icon'} />
												) : (
													<img className={'com-icon'} src={'/img/icons/home.svg'} alt={'com-icon'} />
												)}
												<Typography className={'sub-title'} variant={'subtitle1'} component={'p'}>
													My Properties
												</Typography>
												<IconButton aria-label="delete" sx={{ ml: '36px' }}>
													<PortraitIcon style={{ color: 'red' }} />
												</IconButton>
											</div>
										</Link>
									</ListItem>
								</>
							)}
							<ListItem className={pathname === 'myFavorites' ? 'focus' : ''}>
								<Link
									href={{
										pathname: '/mypage',
										query: { category: 'myFavorites' },
									}}
									scroll={false}
								>
									<div className={'flex-box'}>
										{category === 'myFavorites' ? (
											<img className={'com-icon'} src={'/img/icons/likeWhite.svg'} alt={'com-icon'} />
										) : (
											<img className={'com-icon'} src={'/img/icons/like.svg'} alt={'com-icon'} />
										)}

										<Typography className={'sub-title'} variant={'subtitle1'} component={'p'}>
											My Favorites
										</Typography>
									</div>
								</Link>
							</ListItem>
							<ListItem className={pathname === 'recentlyVisited' ? 'focus' : ''}>
								<Link
									href={{
										pathname: '/mypage',
										query: { category: 'recentlyVisited' },
									}}
									scroll={false}
								>
									<div className={'flex-box'}>
										{category === 'recentlyVisited' ? (
											<img className={'com-icon'} src={'/img/icons/searchWhite.svg'} alt={'com-icon'} />
										) : (
											<img className={'com-icon'} src={'/img/icons/search.svg'} alt={'com-icon'} />
										)}

										<Typography className={'sub-title'} variant={'subtitle1'} component={'p'}>
											Recently Visited
										</Typography>
									</div>
								</Link>
							</ListItem>
							<ListItem className={pathname === 'followers' ? 'focus' : ''}>
								<Link
									href={{
										pathname: '/mypage',
										query: { category: 'followers' },
									}}
									scroll={false}
								>
									<div className={'flex-box'}>
										<svg
											className={'com-icon'}
											fill={category === 'followers' ? 'white' : 'black'}
											height="16px"
											width="16px"
											version="1.1"
											id="Layer_1"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 328 328"
										>
											<g id="XMLID_350_">
												<path
													id="XMLID_351_"
													d="M52.25,64.001c0,34.601,28.149,62.749,62.75,62.749c34.602,0,62.751-28.148,62.751-62.749
		S149.602,1.25,115,1.25C80.399,1.25,52.25,29.4,52.25,64.001z"
												/>
												<path
													id="XMLID_352_"
													d="M217.394,262.357c2.929,2.928,6.768,4.393,10.606,4.393c3.839,0,7.678-1.465,10.607-4.394
		c5.857-5.858,5.857-15.356-0.001-21.214l-19.393-19.391l19.395-19.396c5.857-5.858,5.857-15.356-0.001-21.214
		c-5.858-5.857-15.356-5.856-21.214,0.001l-30,30.002c-2.813,2.814-4.393,6.629-4.393,10.607c0,3.979,1.58,7.794,4.394,10.607
		L217.394,262.357z"
												/>
												<path
													id="XMLID_439_"
													d="M15,286.75h125.596c19.246,24.348,49.031,40,82.404,40c57.896,0,105-47.103,105-105
		c0-57.896-47.104-105-105-105c-34.488,0-65.145,16.716-84.297,42.47c-7.764-1.628-15.695-2.47-23.703-2.47
		c-63.411,0-115,51.589-115,115C0,280.034,6.716,286.75,15,286.75z M223,146.75c41.355,0,75,33.645,75,75s-33.645,75-75,75
		s-75-33.645-75-75S181.644,146.75,223,146.75z"
												/>
											</g>
										</svg>
										<Typography className={'sub-title'} variant={'subtitle1'} component={'p'}>
											My Followers
										</Typography>
									</div>
								</Link>
							</ListItem>
							<ListItem className={pathname === 'followings' ? 'focus' : ''}>
								<Link
									href={{
										pathname: '/mypage',
										query: { category: 'followings' },
									}}
									scroll={false}
								>
									<div className={'flex-box'}>
										<svg
											className={'com-icon'}
											fill={category === 'followings' ? 'white' : 'black'}
											height="16px"
											width="16px"
											version="1.1"
											id="Layer_1"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 328 328"
										>
											<g id="XMLID_334_">
												<path
													id="XMLID_337_"
													d="M177.75,64.001C177.75,29.4,149.601,1.25,115,1.25c-34.602,0-62.75,28.15-62.75,62.751
		S80.398,126.75,115,126.75C149.601,126.75,177.75,98.602,177.75,64.001z"
												/>
												<path
													id="XMLID_338_"
													d="M228.606,181.144c-5.858-5.857-15.355-5.858-21.214-0.001c-5.857,5.857-5.857,15.355,0,21.214
		l19.393,19.396l-19.393,19.391c-5.857,5.857-5.857,15.355,0,21.214c2.93,2.929,6.768,4.394,10.607,4.394
		c3.838,0,7.678-1.465,10.605-4.393l30-29.998c2.813-2.814,4.395-6.629,4.395-10.607c0-3.978-1.58-7.793-4.394-10.607
		L228.606,181.144z"
												/>
												<path
													id="XMLID_340_"
													d="M223,116.75c-34.488,0-65.145,16.716-84.298,42.47c-7.763-1.628-15.694-2.47-23.702-2.47
		c-63.412,0-115,51.589-115,115c0,8.284,6.715,15,15,15h125.596c19.246,24.348,49.03,40,82.404,40c57.896,0,105-47.103,105-105
		C328,163.854,280.896,116.75,223,116.75z M223,296.75c-41.356,0-75-33.645-75-75s33.644-75,75-75c41.354,0,75,33.645,75,75
		S264.354,296.75,223,296.75z"
												/>
											</g>
										</svg>

										<Typography className={'sub-title'} variant={'subtitle1'} component={'p'}>
											My Followings
										</Typography>
									</div>
								</Link>
							</ListItem>
						</List>
					</Stack>
					<Stack className={'section'} sx={{ marginTop: '10px' }}>
						<div>
							<Typography className="title" variant={'h5'}>
								Community
							</Typography>
							<List className={'sub-section'}>
								<ListItem className={pathname === 'myArticles' ? 'focus' : ''}>
									<Link
										href={{
											pathname: '/mypage',
											query: { category: 'myArticles' },
										}}
										scroll={false}
									>
										<div className={'flex-box'}>
											{category === 'myArticles' ? (
												<img className={'com-icon'} src={'/img/icons/discoveryWhite.svg'} alt={'com-icon'} />
											) : (
												<img className={'com-icon'} src={'/img/icons/discovery.svg'} alt={'com-icon'} />
											)}

											<Typography className={'sub-title'} variant={'subtitle1'} component={'p'}>
												Articles
											</Typography>
										</div>
									</Link>
								</ListItem>
								<ListItem className={pathname === 'writeArticle' ? 'focus' : ''}>
									<Link
										href={{
											pathname: '/mypage',
											query: { category: 'writeArticle' },
										}}
										scroll={false}
									>
										<div className={'flex-box'}>
											{category === 'writeArticle' ? (
												<img className={'com-icon'} src={'/img/icons/whiteTab.svg'} alt={'com-icon'} />
											) : (
												<img className={'com-icon'} src={'/img/icons/newTab.svg'} alt={'com_icon'} />
											)}
											<Typography className={'sub-title'} variant={'subtitle1'} component={'p'}>
												Write Article
											</Typography>
										</div>
									</Link>
								</ListItem>
							</List>
						</div>
					</Stack>
					<Stack className={'section'} sx={{ marginTop: '30px' }}>
						<Typography className="title" variant={'h5'}>
							MANAGE ACCOUNT
						</Typography>
						<List className={'sub-section'}>
							<ListItem className={pathname === 'myProfile' ? 'focus' : ''}>
								<Link
									href={{
										pathname: '/mypage',
										query: { category: 'myProfile' },
									}}
									scroll={false}
								>
									<div className={'flex-box'}>
										{category === 'myProfile' ? (
											<img className={'com-icon'} src={'/img/icons/userWhite.svg'} alt={'com-icon'} />
										) : (
											<img className={'com-icon'} src={'/img/icons/user.svg'} alt={'com-icon'} />
										)}
										<Typography className={'sub-title'} variant={'subtitle1'} component={'p'}>
											My Profile
										</Typography>
									</div>
								</Link>
							</ListItem>
							<ListItem onClick={logoutHandler}>
								<div className={'flex-box'}>
									<img className={'com-icon'} src={'/img/icons/logout.svg'} alt={'com-icon'} />
									<Typography className={'sub-title'} variant={'subtitle1'} component={'p'}>
										Logout
									</Typography>
								</div>
							</ListItem>
						</List>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default MyMenu;
