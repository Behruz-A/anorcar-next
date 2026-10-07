import { useTranslation } from 'next-i18next';
import React from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';

const Notice = () => {
 const { t } = useTranslation('common');
	const device = useDeviceDetect();

	/** APOLLO REQUESTS **/
	/** LIFECYCLES **/
	/** HANDLERS **/

	const data = [
		{
			no: 1,
			event: true,
			title: 'Welcome to ANORCAR',
			date: '01.03.2024',
		},
		{
			no: 2,
			title: "Publish and manage car listings",
			date: '31.03.2024',
		},
	];

	if (device === 'mobile') {
		return <div>NOTICE MOBILE</div>;
	} else {
		return (
			<Stack className={'notice-content'}>
				<span className={'title'}>Notice</span>
				<Stack className={'main'}>
					<Box component={'div'} className={'top'}>
						<span>number</span>
						<span>title</span>
						<span>date</span>
					</Box>
					<Stack className={'bottom'}>
						{data.map((ele: any) => (
							<div className={`notice-card ${ele?.event && 'event'}`} key={t(ele.title)}>
								{ele?.event ? <div>event</div> : <span className={'notice-number'}>{ele.no}</span>}
								<span className={'notice-title'}>{ele.title}</span>
								<span className={'notice-date'}>{ele.date}</span>
							</div>
						))}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default Notice;
