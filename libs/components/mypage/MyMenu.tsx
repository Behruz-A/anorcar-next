import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Stack, Typography, List, ListItem, Button } from '@mui/material';
import {
	BookmarkBorder,
	History,
	PeopleOutline,
	PersonAddAlt,
	ArticleOutlined,
	EditOutlined,
	PersonOutline,
	Logout,
	ChevronRight,
	AddCircleOutline,
	DirectionsCarOutlined,
	MenuOutlined,
	ExpandMore,
} from '@mui/icons-material';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { imageUrl } from '../../config';
import { logOut } from '../../auth';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';

const MyMenu = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const category = router.query.category ?? 'myProfile';
	const [menuOpen, setMenuOpen] = useState(false);
	useEffect(() => {
		setMenuOpen(false);
	}, [category]);
	const user = useReactiveVar(userVar);
	const groups = [
		...(user.memberType === 'AGENT'
			? [
					{
						title: 'MANAGE LISTINGS',
						items: [
							{ category: 'addCar', label: 'Add car', icon: AddCircleOutline },
							{ category: 'myCars', label: 'My cars', icon: DirectionsCarOutlined },
						],
					},
			  ]
			: []),
		{
			title: 'My Activity',
			items: [
				{ category: 'myFavorites', label: 'My Favorites', icon: BookmarkBorder },
				{ category: 'recentlyVisited', label: 'Recently Visited', icon: History },
				{ category: 'followers', label: 'My Followers', icon: PeopleOutline },
				{ category: 'followings', label: 'My Followings', icon: PersonAddAlt },
			],
		},
		{
			title: 'Community',
			items: [
				{ category: 'myArticles', label: 'My Articles', icon: ArticleOutlined },
				{ category: 'writeArticle', label: 'Write Article', icon: EditOutlined },
			],
		},
		{ title: 'Account Settings', items: [{ category: 'myProfile', label: 'My Profile', icon: PersonOutline }] },
	];
	const logoutHandler = async () => {
		try {
			if (await sweetConfirmAlert(t('Do you want to logout?'))) logOut();
		} catch (error) {
			void sweetErrorHandling(error);
		}
	};
	const role = user.memberType === 'USER' ? 'Customer' : user.memberType === 'AGENT' ? 'Agent' : 'Admin';
	return (
		<Stack className="account-menu">
			<Stack className="account-user-card">
				<img
					src={imageUrl(user.memberImage || '/img/profile/defaultUser.svg')}
					alt={t('Profile Photo')}
					onError={(event) => {
						event.currentTarget.onerror = null;
						event.currentTarget.src = '/img/profile/defaultUser.svg';
					}}
				/>
				<Stack className="account-user-info">
					<Typography className="account-user-name">{user.memberFullName || user.memberNick}</Typography>
					{user.memberType === 'ADMIN' ? (
						<Link href="/_admin/users" className="account-role">
							{t(role)}
						</Link>
					) : (
						<span className="account-role">{t(role)}</span>
					)}
				</Stack>
			</Stack>
			<Button
				className="account-mobile-menu-toggle"
				startIcon={<MenuOutlined />}
				onClick={() => setMenuOpen((value) => !value)}
				aria-expanded={menuOpen}
				aria-controls="account-navigation"
				aria-label={t('Account navigation')}
			>
				<span>
					{t(groups.flatMap((group) => group.items).find((item) => item.category === category)?.label ?? 'My Profile')}
				</span>
				<ExpandMore className={menuOpen ? 'is-open' : undefined} />
			</Button>
			<nav
				id="account-navigation"
				className={`account-navigation${menuOpen ? ' is-expanded' : ''}`}
				aria-label={t('My Account')}
			>
				{groups.map((group) => (
					<div className="account-nav-group" key={group.title}>
						<Typography className="account-nav-title">{t(group.title)}</Typography>
						<List disablePadding>
							{group.items.map((item) => (
								<ListItem disablePadding key={item.category}>
									<Link
										href={{ pathname: '/mypage', query: { category: item.category } }}
										scroll={false}
										className={`account-nav-link ${category === item.category ? 'is-active' : ''}`}
										aria-current={category === item.category ? 'page' : undefined}
									>
										<item.icon />
										<span>{t(item.label)}</span>
										{category === item.category && <ChevronRight className="account-nav-arrow" />}
									</Link>
								</ListItem>
							))}
						</List>
					</div>
				))}
				<Button className="account-logout" startIcon={<Logout />} onClick={logoutHandler}>
					{t('Logout')}
				</Button>
			</nav>
		</Stack>
	);
};
export default MyMenu;
