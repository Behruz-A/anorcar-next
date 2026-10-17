import React, { useEffect } from 'react';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Top from '../Top';
import Footer from '../Footer';
import { Stack } from '@mui/material';
import { hydrateUser } from '../../auth';
import SupportChat from '../SupportChat';
//@ts-ignore
import 'swiper/css';
//@ts-ignore
import 'swiper/css/pagination';
//@ts-ignore
import 'swiper/css/navigation';

const withLayoutFull = (Component: any, options: { showChat?: boolean; className?: string } = {}) => {
	return function FullLayout(props: any) {
		const device = useDeviceDetect();


		/** LIFECYCLES **/
		useEffect(() => {
			hydrateUser();
		}, []);

		/** HANDLERS **/

		if (device == 'mobile') {
			return (
				<>

					<Stack id="mobile-wrap" className={options.className}>
						<Stack id={'top'}>
							<Top />
						</Stack>

						<Stack id={'main'}>
							<Component {...props} />
						</Stack>

						{options.showChat !== false && <SupportChat />}

						<Stack id={'footer'}>
							<Footer />
						</Stack>
					</Stack>
				</>
			);
		} else {
			return (
				<>

					<Stack id="pc-wrap" className={options.className}>
						<Stack id={'top'}>
							<Top />
						</Stack>

						<Stack id={'main'}>
							<Component {...props} />
						</Stack>

						{options.showChat !== false && <SupportChat />}

						<Stack id={'footer'}>
							<Footer />
						</Stack>
					</Stack>
				</>
			);
		}
	};
};

export default withLayoutFull;
