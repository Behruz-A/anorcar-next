import React, { useEffect } from 'react';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Head from 'next/head';
import Top from '../Top';
import Footer from '../Footer';
import { Stack } from '@mui/material';

import HeaderFilter from '../homepage/HeaderFilter';
import Hero from '../homepage/Hero';
import { userVar } from '../../../apollo/store';
import { useReactiveVar } from '@apollo/client';
import { hydrateUser } from '../../auth';
import Chat from '../Chat';
//@ts-ignore
import 'swiper/css';
//@ts-ignore
import 'swiper/css/pagination';
//@ts-ignore
import 'swiper/css/navigation';

const withLayoutMain = (Component: any) => {
	return function HomeLayout(props: any) {
		const device = useDeviceDetect();
		const user = useReactiveVar(userVar);

		/** LIFECYCLES **/
		useEffect(() => {
			hydrateUser();
		}, []);

		/** HANDLERS **/

		if (device == 'mobile') {
			return (
				<>
					<Head>
						<title>ANORCAR</title>
						<meta name={'title'} content={`ANORCAR`} />
					</Head>
					<Stack id="mobile-wrap" className="homepage-shell">
						<Stack id={'top'}>
							<Top />
						</Stack>

						<Stack className="header-main homepage-header">
							<Hero compact />
							<HeaderFilter compact />
						</Stack>
						<Stack id={'main'}>
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
					<Stack id="pc-wrap" className="homepage-shell">
						<Stack id={'top'}>
							<Top />
						</Stack>

						<Stack className="header-main homepage-header">
							<Hero compact />
							<HeaderFilter compact />
						</Stack>

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

export default withLayoutMain;
