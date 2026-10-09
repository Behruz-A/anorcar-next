import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Head from 'next/head';
import Top from '../Top';
import Footer from '../Footer';
import { Stack } from '@mui/material';
import { hydrateUser } from '../../auth';
import Chat from '../Chat';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { useTranslation } from 'next-i18next';
//@ts-ignore
import 'swiper/css';
//@ts-ignore
import 'swiper/css/pagination';
//@ts-ignore
import 'swiper/css/navigation';

const withLayoutBasic = (Component: any) => {
	return function BasicLayout(props: any) {
		const router = useRouter();
		const { t, i18n } = useTranslation('common');
		const device = useDeviceDetect();
		const authHeader = router.pathname === '/account/join';
		const carsHeader = router.pathname === '/car';
		const user = useReactiveVar(userVar);

		const memoizedValues = useMemo(() => {
			let title = '',
				desc = '',
				bgImage = '';

			switch (router.pathname) {
				case '/car':
					title = 'Find your next car';
					desc = 'Your next journey starts here.';
					bgImage = '/img/hero4.png';
					break;
				case '/agent':
					title = 'Agents';
					desc = 'Find your car';
					bgImage = '/img/banner/agents.webp';
					break;
				case '/agent/detail':
					title = 'Agent Page';
					desc = 'Find your car';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/mypage':
					title = 'my page';
					desc = 'Find your car';
					bgImage = '/img/banner/header1.svg';
					break;
				case '/community':
					title = 'Community';
					desc = 'Find your car';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/community/detail':
					title = 'Community Detail';
					desc = 'Find your car';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/cs':
					title = 'CS';
					desc = 'We are glad to see you again!';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/account/join':
					title = 'Login/Signup';
					desc = 'Authentication Process';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/member':
					title = 'Member Page';
					desc = 'Find your car';
					bgImage = '/img/banner/header1.svg';
					break;
				default:
					break;
			}

			return { title, desc, bgImage };
		}, [router.pathname]);

		/** LIFECYCLES **/
		useEffect(() => {
			hydrateUser();
		}, []);

		/** HANDLERS **/
		const carsHero = (
			<Stack className="header-basic cars-hero" style={{ backgroundImage: `url(${memoizedValues.bgImage})` }}>
				<Stack className="container">
					<strong>{t(memoizedValues.title)}</strong>
					<span>{t(memoizedValues.desc)}</span>
				</Stack>
			</Stack>
		);

		if (device == 'mobile') {
			return (
				<>
					<Head>
						<title>ANORCAR</title>
						<meta name={'title'} content={`ANORCAR`} />
					</Head>
					<Stack id="mobile-wrap">
						<Stack id={'top'}>
							<Top />
						</Stack>

						<Stack id={'main'}>
							{carsHeader && carsHero}
							<Component {...props} />
						</Stack>

						<Stack id={'footer'}>
							<Footer />
						</Stack>
					</Stack>
				</>
			);
		} else {
			return (
				<>
					<Head>
						<title>ANORCAR</title>
						<meta name={'title'} content={`ANORCAR`} />
					</Head>
					<Stack id="pc-wrap">
						<Stack id={'top'}>
							<Top />
						</Stack>

						{carsHeader ? (
							carsHero
						) : (
							<Stack
								className={`header-basic ${authHeader && 'auth'}`}
								style={{
									backgroundImage: `url(${memoizedValues.bgImage})`,
									backgroundSize: 'cover',
									boxShadow: 'inset 10px 40px 150px 40px rgb(24 22 36)',
								}}
							>
								<Stack className={'container'}>
									<strong>{t(memoizedValues.title)}</strong>
									<span>{t(memoizedValues.desc)}</span>
								</Stack>
							</Stack>
						)}

						<Stack id={'main'}>
							<Component {...props} />
						</Stack>

						<Chat />

						<Stack id={'footer'}>
							<Footer />
						</Stack>
					</Stack>
				</>
			);
		}
	};
};

export default withLayoutBasic;
