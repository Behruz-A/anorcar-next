import React, { useState } from 'react';
import Link from 'next/link';
import { Stack, Alert, CircularProgress } from '@mui/material';
import EastIcon from '@mui/icons-material/East';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { GET_CARS } from '../../../apollo/user/query';
import { Direction } from '../../enums/common.enum';
import { CarsInquiry } from '../../types/car/car.input';
import { Car } from '../../types/car/car';
import { T } from '../../types/common';
import RecentlyAddedCarCard from './RecentlyAddedCarCard';

interface RecentlyAddedCarsProps { initialInput: CarsInquiry; }

const RecentlyAddedCars = ({ initialInput }: RecentlyAddedCarsProps) => {
	const { t } = useTranslation('common');
	const [recentCars, setRecentCars] = useState<Car[]>([]);

	/** APOLLO REQUESTS **/
	const { loading, data, error } = useQuery(GET_CARS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
		onCompleted: (response: T) => setRecentCars(response?.getCars?.list ?? []),
	});

	return (
		<Stack component="section" className="recently-added-cars" aria-labelledby="recently-added-heading">
			<Stack className="container">
				<div className="recent-heading">
					<h2 id="recently-added-heading">{t('Recently Added Cars')}</h2>
					<p>{t('Be the first to see our latest car listings.')}</p>
				</div>
				{loading && !data ? <div className="recent-status"><CircularProgress aria-label={t('Loading cars')} /></div> :
					error ? <Alert severity="error">{t('Cars could not be loaded. Please try again.')}</Alert> :
					recentCars.length === 0 ? <p className="recent-status">{t('No recently added cars yet.')}</p> :
					<div className="recent-grid">{recentCars.map((car) => <RecentlyAddedCarCard key={car._id} car={car} />)}</div>}
				<Link passHref className="recent-view-all" href={{ pathname: '/car', query: { input: JSON.stringify({ ...initialInput, page: 1, limit: 9 }) } }}>
					{t('View All Recently Added Cars')} <EastIcon fontSize="small" />
				</Link>
			</Stack>
		</Stack>
	);
};

RecentlyAddedCars.defaultProps = {
	initialInput: { page: 1, limit: 8, sort: 'createdAt', direction: Direction.DESC, search: {} },
};

export default RecentlyAddedCars;
