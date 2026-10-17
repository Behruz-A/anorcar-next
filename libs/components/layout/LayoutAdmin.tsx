import NextImage from 'next/image';
import type { ComponentType } from 'react';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import MenuList from '../admin/AdminMenuList';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { Button, Menu, MenuItem, useMediaQuery } from '@mui/material';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { hydrateUser, logOut } from '../../auth';
import { useReactiveVar } from '@apollo/client';
import { userVar, authReadyVar } from '../../../apollo/store';
import { imageUrl } from '../../config';
import { MemberType } from '../../enums/member.enum';
const drawerWidth = 280;

const withAdminLayout = (Component: ComponentType) => {
	return function AdminLayout(props: object) {
		const router = useRouter();
		const user = useReactiveVar(userVar);
		const authReady = useReactiveVar(authReadyVar);
		const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
		const [openMenu, setOpenMenu] = useState(false);
		const [, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
		const [, setTitle] = useState('admin');
		const [loading, setLoading] = useState(true);
		const mobile = useMediaQuery('(max-width: 900px)');
		const pageTitle = router.pathname.includes('/users')
			? router.query.memberType === 'AGENT'
				? 'Agents'
				: 'Members'
			: router.pathname.includes('/cars')
			? 'Cars'
			: router.pathname.includes('/brands')
			? 'Brands'
			: router.pathname.includes('/community')
			? 'Community'
			: 'Customer Service';
		useEffect(() => {
			setOpenMenu(false);
		}, [router.asPath]);

		/** LIFECYCLES **/
		useEffect(() => {
			hydrateUser();
			setLoading(false);
		}, []);

		useEffect(() => {
			if (!loading && authReady && user.memberType !== MemberType.ADMIN) {
				router.push('/').then();
			}
		}, [loading, authReady, user, router]);

		/** HANDLERS **/
		const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
			setAnchorElUser(event.currentTarget);
		};

		const handleCloseUserMenu = () => {
			setAnchorElUser(null);
		};

		const logoutHandler = () => {
			logOut();
			router.push('/').then();
		};

		if (!authReady || loading || !user || user?.memberType !== MemberType.ADMIN) return null;

		return (
			<main id="pc-wrap" className="admin">

				<Box component={'div'} sx={{ display: 'flex' }}>
					<AppBar
						position="fixed"
						sx={{
							width: mobile ? '100%' : `calc(100% - ${drawerWidth}px)`,
							ml: mobile ? 0 : `${drawerWidth}px`,
							boxShadow: 'rgb(100 116 139 / 12%) 0px 1px 4px',
							background: '#ffffff',
						}}
					>
						<Toolbar className="admin-toolbar">
							{mobile && (
								<IconButton
									aria-label="Open admin navigation"
									aria-expanded={openMenu}
									onClick={() => setOpenMenu(true)}
								>
									<MenuOutlinedIcon />
								</IconButton>
							)}
							<Typography className="admin-breadcrumbs">
								Admin Console <span>/</span> {pageTitle}
							</Typography>
							<Button component={Link} href="/" className="admin-view-site" startIcon={<OpenInNewOutlinedIcon />}>
								View site
							</Button>
							<Tooltip title="Open settings">
								<IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
									<Avatar src={imageUrl(user?.memberImage || '/img/profile/defaultUser.svg')} />
								</IconButton>
							</Tooltip>
							<Menu
								sx={{ mt: '45px' }}
								id="menu-appbar"
								className={'pop-menu'}
								anchorEl={anchorElUser}
								anchorOrigin={{
									vertical: 'top',
									horizontal: 'right',
								}}
								keepMounted
								transformOrigin={{
									vertical: 'top',
									horizontal: 'right',
								}}
								open={Boolean(anchorElUser)}
								onClose={handleCloseUserMenu}
							>
								<Box
									component={'div'}
									onClick={handleCloseUserMenu}
									sx={{
										width: '200px',
									}}
								>
									<Stack sx={{ px: '20px', my: '12px' }}>
										<Typography variant={'h6'} component={'h6'} sx={{ mb: '4px' }}>
											{user?.memberNick}
										</Typography>
										<Typography variant={'subtitle1'} component={'p'} color={'#757575'}>
											{user?.memberPhone}
										</Typography>
									</Stack>
									<Divider />
									<Box component={'div'} sx={{ p: 1, py: '6px' }} onClick={logoutHandler}>
										<MenuItem sx={{ px: '16px', py: '6px' }}>
											<Typography variant={'subtitle1'} component={'span'}>
												Logout
											</Typography>
										</MenuItem>
									</Box>
								</Box>
							</Menu>
						</Toolbar>
					</AppBar>

					<Drawer
						sx={{
							width: mobile ? 0 : drawerWidth,
							flexShrink: 0,
							'& .MuiDrawer-paper': {
								width: drawerWidth,
								boxSizing: 'border-box',
							},
						}}
						variant={mobile ? 'temporary' : 'permanent'}
						ModalProps={{ keepMounted: true, disablePortal: true }}
						open={!mobile || openMenu}
						onClose={() => setOpenMenu(false)}
						anchor="left"
						className="aside"
					>
						<Toolbar sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
							<Stack className={'logo-box'}>
								<Link href="/_admin/users">
									<NextImage width={258} height={46} unoptimized src={'/img/logo/anorcar.svg'} alt={'ANORCAR'} />
								</Link>
								<Typography className="admin-console-label">Admin Console</Typography>
							</Stack>

							<Stack
								className="user"
								direction={'row'}
								alignItems={'center'}
								sx={{
									bgcolor: openMenu ? 'rgba(255, 255, 255, 0.04)' : 'none',
									borderRadius: '8px',
									px: '24px',
									py: '11px',
								}}
							>
								<Avatar src={imageUrl(user?.memberImage || '/img/profile/defaultUser.svg')} />
								<Typography variant={'body2'} p={1} ml={1}>
									{user?.memberNick} <br />
									Admin
								</Typography>
							</Stack>
						</Toolbar>

						<Divider />

						<MenuList />
						<Stack className="admin-sidebar-footer">
							<Button component={Link} href="/">
								Back to the site
							</Button>
							<Button component={Link} href="/mypage?category=myProfile">
								My profile
							</Button>
							<Button onClick={logoutHandler}>Logout</Button>
						</Stack>
					</Drawer>

					<Box component={'div'} id="bunker" sx={{ flexGrow: 1 }}>
						{/*@ts-ignore*/}
						<Component {...props} setSnackbar={setSnackbar} setTitle={setTitle} />
					</Box>
				</Box>
			</main>
		);
	};
};

export default withAdminLayout;
