import NextImage from 'next/image';
import React, { useCallback, useEffect } from 'react';
import { useState } from 'react';
import { useRouter, withRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { hydrateUser, logOut } from '../auth';
import { Stack, Box, Popover, TextField, InputAdornment, IconButton, CircularProgress, Alert } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import { alpha, styled } from '@mui/material/styles';
import Menu, { MenuProps } from '@mui/material/Menu';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { CaretDown } from 'phosphor-react';
import useDeviceDetect from '../hooks/useDeviceDetect';
import Link from 'next/link';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import { useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { Logout } from '@mui/icons-material';
import { REACT_APP_API_URL, brandLogoUrl, imageUrl } from '../config';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import { GET_BRANDS, GET_CARS } from '../../apollo/user/query';
import { Brand } from '../types/brand/brand';
import { Cars } from '../types/car/car';
import { CarSearch } from '../types/car/car.input';
import { defaultCarsInquiry, carLabel } from '../car';
import { formatPrice } from '../currency';
import { escapeSearchText } from './car/browseFilter';

const Top = () => {
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const { t } = useTranslation('common');
	const router = useRouter();
	const isHomepage = router.pathname === '/';
	const isCarsPage = router.pathname === '/car';
	const isComparePage = router.pathname === '/car/compare';
	const isAgentsPage = router.pathname === '/agent' || router.pathname === '/agent/detail';
	const isMarketplacePage = !router.pathname.startsWith('/_admin');
	const [anchorEl2, setAnchorEl2] = useState<null | HTMLElement>(null);
	const [lang, setLang] = useState<string | null>('en');
	const drop = Boolean(anchorEl2);
	const [logoutAnchor, setLogoutAnchor] = React.useState<null | HTMLElement>(null);
	const logoutOpen = Boolean(logoutAnchor);
	const [searchAnchor, setSearchAnchor] = useState<HTMLElement | null>(null);
	const [searchText, setSearchText] = useState('');
	const [queryText, setQueryText] = useState('');
	const [scrolled, setScrolled] = useState(false);
	const searchOpen = Boolean(searchAnchor);
	const { data: searchBrands, loading: brandsLoading, error: brandsError, refetch: retryBrands } = useQuery<{ getBrands: Brand[] }>(GET_BRANDS, { skip: !searchOpen, fetchPolicy: 'cache-and-network' });
	const brands = searchBrands?.getBrands ?? [];
	const normalizeBrand = (value: string) => value.trim().toLowerCase().replace(/[\s_-]+/g, '');
	const matchingBrand = (value: string) => brands.find(brand => normalizeBrand(brand.brandName) === normalizeBrand(value));
	const searchFields = (value: string): CarSearch => {
		const brand = matchingBrand(value);
		return brand ? { brandIds: [brand._id] } : value.trim() ? { text: escapeSearchText(value.trim()) } : {};
	};
	const { data: searchCars, loading: carsLoading, error: carsError, refetch: retryCars } = useQuery<{ getCars: Cars }>(GET_CARS, {
		skip: !searchOpen, variables: { input: { ...defaultCarsInquiry, limit: 12, sort: 'carViews', search: searchFields(queryText) } },
		fetchPolicy: 'cache-and-network', notifyOnNetworkStatusChange: true,
	});
	const models = (searchCars?.getCars.list ?? []).filter((car, index, cars) => cars.findIndex(item => item.brandId === car.brandId && item.carModel === car.carModel) === index).slice(0, 4);
	const popularBrands = [...brands].sort((a, b) => {
		const order = ['bmw', 'hyundai', 'mercedesbenz', 'kia', 'audi', 'tesla', 'genesis'];
		const rank = (brand: Brand) => { const index = order.indexOf(normalizeBrand(brand.brandName)); return index < 0 ? order.length : index; };
		return rank(a) - rank(b);
	}).slice(0, 6);
	const navigateSearch = (value = searchText) => {
		setSearchAnchor(null);
		void router.push({ pathname: '/car', query: { input: JSON.stringify({ ...defaultCarsInquiry, search: searchFields(value) }) } });
	};

	/** LIFECYCLES **/
	useEffect(() => {
		if (!isMarketplacePage) return;
		const updateScroll = () => setScrolled(window.scrollY > 8);
		updateScroll();
		window.addEventListener('scroll', updateScroll, { passive: true });
		return () => window.removeEventListener('scroll', updateScroll);
	}, [isMarketplacePage]);
	useEffect(() => {
		if (!searchOpen) return;
		const timer = window.setTimeout(() => setQueryText(searchText.trim()), 250);
		return () => window.clearTimeout(timer);
	}, [searchText, searchOpen]);
	useEffect(() => { setSearchAnchor(null); }, [router.asPath]);
	useEffect(() => {
		const locale = router.locale ?? 'en';
		localStorage.setItem('locale', locale);
		setLang(locale);
	}, [router.locale]);

	useEffect(() => {
		hydrateUser();
	}, []);

	/** HANDLERS **/
	const langClick = (e: any) => {
		setAnchorEl2(e.currentTarget);
	};

	const langClose = () => {
		setAnchorEl2(null);
	};

	const langChoice = useCallback(
		async (e: any) => {
			const locale = e.currentTarget.id;
			if (!['en', 'kr', 'ru'].includes(locale)) return;
			setLang(locale);
			localStorage.setItem('locale', locale);
			setAnchorEl2(null);
			await router.push(router.asPath, router.asPath, { locale });
		},
		[router],
	);


	const StyledMenu = styled((props: MenuProps) => (
		<Menu
			elevation={0}
			anchorOrigin={{
				vertical: 'bottom',
				horizontal: 'right',
			}}
			transformOrigin={{
				vertical: 'top',
				horizontal: 'right',
			}}
			{...props}
		/>
	))(({ theme }) => ({
		'& .MuiPaper-root': {
			top: isMarketplacePage ? undefined : '109px',
			borderRadius: 6,
			marginTop: theme.spacing(1),
			minWidth: 160,
			color: theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
			boxShadow:
				'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
			'& .MuiMenu-list': {
				padding: '4px 0',
			},
			'& .MuiMenuItem-root': {
				'& .MuiSvgIcon-root': {
					fontSize: 18,
					color: theme.palette.text.secondary,
					marginRight: theme.spacing(1.5),
				},
				'&:active': {
					backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
				},
			},
		},
	}));

	if (device == 'mobile' && !isMarketplacePage) {
		return (
			<Stack className={'top'}>
				<Link href={'/'}>
					<div>{t('Home')}</div>
				</Link>
				<Link href={'/car'}>
					<div>{t('Cars')}</div>
				</Link>
				<Link href={'/car/compare'} aria-current={isComparePage ? 'page' : undefined}>
					<div>{t('Compare')}</div>
				</Link>
				<Link href={'/agent'}>
					<div> {t('Agents')} </div>
				</Link>
				<Link href={'/community?articleCategory=FREE'} className={router.pathname.startsWith('/community') ? 'active' : undefined} aria-current={router.pathname.startsWith('/community') ? 'page' : undefined}>
					<div> {t('Community')} </div>
				</Link>
				<Link href={'/cs'}>
					<div> {t('FAQ')} </div>
				</Link>
			</Stack>
		);
	} else {
		return (
			<Stack className={`navbar ${isMarketplacePage ? 'marketplace-nav shared-navbar' : ''}${scrolled ? ' is-scrolled' : ''}`}>
				<Stack className="navbar-main">
					<Stack className={'container'}>
						<Box component={'div'} className={'logo-box'}>
							<Link href={'/'}>
								<NextImage width={258} height={46} unoptimized src={isMarketplacePage ? '/img/logo/anorcar-footer.svg' : '/img/logo/anorcar.svg'} alt="ANORCAR" />
							</Link>
						</Box>
						<Box
							component={isMarketplacePage ? 'nav' : 'div'}
							aria-label={isMarketplacePage ? t('Main navigation') : undefined}
							className={'router-box'}
						>
							<Link
								href={'/'}
								className={isHomepage ? 'active' : undefined}
								aria-current={isHomepage ? 'page' : undefined}
							>
								<div>{t('Home')}</div>
							</Link>
							<Link
								href={'/car'}
								className={isCarsPage ? 'active' : undefined}
								aria-current={isCarsPage ? 'page' : undefined}
							>
								<div>{t('Cars')}</div>
							</Link>
							<Link href={'/car/compare'} className={isComparePage ? 'active' : undefined} aria-current={isComparePage ? 'page' : undefined}>
								<div>{t('Compare')}</div>
							</Link>
							<Link href={'/agent'} className={isAgentsPage ? 'active' : undefined} aria-current={isAgentsPage ? 'page' : undefined}>
								<div> {t('Agents')} </div>
							</Link>
							<Link href={'/community'} className={router.pathname.startsWith('/community') ? 'active' : undefined} aria-current={router.pathname.startsWith('/community') ? 'page' : undefined}>
								<div> {t('Community')} </div>
							</Link>
							{user?._id && (
								<Link href={'/mypage'} className={router.pathname === '/mypage' ? 'active' : undefined} aria-current={router.pathname === '/mypage' ? 'page' : undefined}>
									<div> {t('My Page')} </div>
								</Link>
							)}
							<Link href={'/cs'} className={router.pathname === '/cs' ? 'active' : undefined} aria-current={router.pathname === '/cs' ? 'page' : undefined}>
								<div> {t('FAQ')} </div>
							</Link>
						</Box>
						<Box component={'div'} className={'user-box'}>
							{isMarketplacePage && <div className="nav-shortcuts">
								<IconButton className={`nav-search-trigger${searchOpen ? ' is-open' : ''}`} aria-label={t('Search cars')} aria-haspopup="dialog" aria-expanded={searchOpen} aria-controls={searchOpen ? 'navbar-search-panel' : undefined} onClick={event => setSearchAnchor(event.currentTarget)}><SearchOutlinedIcon /></IconButton>
								<Link href={user?._id ? '/mypage?category=myFavorites' : '/account/join'} aria-label={t('My Favorites')}><FavoriteBorderOutlinedIcon /></Link>
								{user?._id && <NotificationsOutlinedIcon className="notification-icon" />}
							</div>}
							{user?._id ? (
								<>
									<Box
										component={isMarketplacePage ? 'button' : 'div'}
										className={'login-user'}
										aria-label={isMarketplacePage ? t('Account menu') : undefined}
										aria-haspopup={isMarketplacePage ? 'menu' : undefined}
										aria-expanded={isMarketplacePage ? logoutOpen : undefined}
										onClick={(event: any) => setLogoutAnchor(event.currentTarget)}
									>
										<NextImage width={128} height={128} unoptimized
											src={
												isMarketplacePage && user?.memberImage?.startsWith('/img/')
													? user.memberImage
													: user?.memberImage
													? `${REACT_APP_API_URL}/${user.memberImage}`
													: '/img/profile/defaultUser.svg'
											}
											onError={
												isMarketplacePage
													? (event) => {
															const image = event.currentTarget;
															if (!image.src.endsWith('/img/profile/defaultUser.svg'))
																image.src = '/img/profile/defaultUser.svg';
													  }
													: undefined
											}
											alt=""
										/>
										<CaretDown size={12} weight="fill" aria-hidden="true" />
									</Box>

									<Menu
										id="basic-menu"
										anchorEl={logoutAnchor}
										open={logoutOpen}
										onClose={() => {
											setLogoutAnchor(null);
										}}
										sx={{ mt: '5px' }}
									>
										{user.memberType === 'ADMIN' && <MenuItem component={Link} href="/_admin/users" onClick={() => setLogoutAnchor(null)}>Admin Console</MenuItem>}
										<MenuItem onClick={() => logOut()}>
											<Logout fontSize="small" style={{ color: 'blue', marginRight: '10px' }} />
											Logout
										</MenuItem>
									</Menu>
								</>
							) : (
								<Link href={'/account/join'}>
									<div className={'join-box'}>
										<AccountCircleOutlinedIcon />
										<span>
											{t('Login')} / {t('Register')}
										</span>
									</div>
								</Link>
							)}

							<div className={'lan-box'}>
								{user?._id && !isMarketplacePage && <NotificationsOutlinedIcon className={'notification-icon'} />}
								<Button
									disableRipple
									className="btn-lang"
									aria-label={isMarketplacePage ? t('Language') : undefined}
									aria-haspopup="menu"
									aria-expanded={drop}
									onClick={langClick}
									endIcon={<CaretDown size={14} color={isMarketplacePage ? 'currentColor' : '#616161'} weight="fill" />}
								>
									{isMarketplacePage ? <span className="nav-language-code">{(lang ?? 'en').toUpperCase()}</span> : <Box component={'div'} className={'flag'}>
										{lang !== null ? (
											<NextImage width={32} height={32} unoptimized src={`/img/flag/lang${lang}.png`} alt={'usaFlag'} />
										) : (
											<NextImage width={32} height={32} unoptimized src={`/img/flag/langen.png`} alt={'usaFlag'} />
										)}
									</Box>}
								</Button>

								<StyledMenu anchorEl={anchorEl2} open={drop} onClose={langClose} sx={{ position: 'absolute' }}>
									<MenuItem disableRipple onClick={langChoice} id="en">
										<NextImage width={1235} height={650} unoptimized className="img-flag" src={'/img/flag/langen.png'} id="en" alt={'usaFlag'} />
										{t('English')}
									</MenuItem>
									<MenuItem disableRipple onClick={langChoice} id="kr">
										<NextImage width={800} height={533} unoptimized className="img-flag" src={'/img/flag/langkr.png'} id="kr" alt={'koreanFlag'} />
										{t('Korean')}
									</MenuItem>
									<MenuItem disableRipple onClick={langChoice} id="ru">
										<NextImage width={1280} height={853} unoptimized className="img-flag" src={'/img/flag/langru.png'} id="ru" alt={'russiaFlag'} />
										{t('Russian')}
									</MenuItem>
								</StyledMenu>
							</div>
						</Box>
					</Stack>
				</Stack>
				<Popover className="navbar-search-popover" open={searchOpen} anchorEl={searchAnchor} onClose={() => setSearchAnchor(null)}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} transformOrigin={{ vertical: 'top', horizontal: 'center' }} marginThreshold={16}
					PaperProps={{ id: 'navbar-search-panel', role: 'dialog', 'aria-label': t('Search cars') }}>
					<div className="navbar-search-content">
						<form onSubmit={event => { event.preventDefault(); navigateSearch(); }}>
							<TextField autoFocus fullWidth size="small" placeholder={t('Search by model or title')} value={searchText} onChange={event => setSearchText(event.target.value)}
								inputProps={{ 'aria-label': t('Search cars'), maxLength: 100 }} InputProps={{
									startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment>,
									endAdornment: <InputAdornment position="end"><IconButton size="small" aria-label={t('Clear search')} disabled={!searchText} onClick={() => { setSearchText(''); setQueryText(''); }}><CloseOutlinedIcon fontSize="small" /></IconButton></InputAdornment>,
								}} />
						</form>
						<div className="navbar-search-heading"><h2>{t('Popular Brands')}</h2><Button onClick={() => navigateSearch('')}>{t('View All')}</Button></div>
						{brandsLoading && !searchBrands && <CircularProgress size={22} aria-label={t('Loading...')} />}
						{brandsError && <Alert severity="warning">{t('Brands could not be loaded.')} <Button onClick={() => void retryBrands().catch(() => undefined)}>{t('Retry')}</Button></Alert>}
						<div className="navbar-search-brands">{popularBrands.map(brand => <button type="button" key={brand._id} aria-pressed={matchingBrand(searchText)?._id === brand._id} onClick={() => { setSearchText(brand.brandName); setQueryText(brand.brandName); }}>
							<span><NextImage width={32} height={32} unoptimized src={brandLogoUrl(brand.brandName, brand.brandLogo)} alt="" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/img/car/placeholder.svg'; }} /></span><small>{brand.brandName}</small>
						</button>)}</div>
						<div className="navbar-search-heading"><h2>{t('Popular Models')}</h2><Button onClick={() => navigateSearch()}>{t('View All')}</Button></div>
						<div className="navbar-search-models" aria-live="polite" aria-busy={carsLoading || searchText.trim() !== queryText}>
							{carsError ? <Alert severity="error">{t('Cars could not be loaded. Please try again.')} <Button onClick={() => void retryCars().catch(() => undefined)}>{t('Retry')}</Button></Alert> : carsLoading || searchText.trim() !== queryText ? <CircularProgress size={24} aria-label={t('Loading cars')} /> : models.length ? models.map(car => <Link key={car._id} href={{ pathname: '/car', query: { input: JSON.stringify({ ...defaultCarsInquiry, search: { brandIds: [car.brandId], text: escapeSearchText(car.carModel) } }) } }} onClick={() => setSearchAnchor(null)}>
								<NextImage width={640} height={400} unoptimized src={imageUrl(car.carImages?.[0])} alt="" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/img/car/placeholder.svg'; }} />
								<span><strong>{car.carTitle}</strong><small>{car.carYear} · {formatPrice(car.carPrice)}{car.carLocation ? ` · ${t(carLabel(car.carLocation))}` : ''}</small></span><ChevronRightOutlinedIcon />
							</Link>) : <p className="navbar-search-empty">{t('No cars found. Try changing your filters.')}</p>}
						</div>
					</div>
				</Popover>
			</Stack>
		);
	}
};

export default withRouter(Top);
