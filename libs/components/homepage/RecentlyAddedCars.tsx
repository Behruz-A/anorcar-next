import React from 'react';
import Link from 'next/link';
import { Stack, Alert, Skeleton } from '@mui/material';
import EastIcon from '@mui/icons-material/East';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { GET_CARS } from '../../../apollo/user/query';
import { Direction } from '../../enums/common.enum';
import { CarsInquiry } from '../../types/car/car.input';
import { Cars } from '../../types/car/car';
import RecentlyAddedCarCard from './RecentlyAddedCarCard';

interface RecentlyAddedCarsProps { initialInput: CarsInquiry; }

const RecentlyAddedCars = ({ initialInput }: RecentlyAddedCarsProps) => {
	const { t } = useTranslation('common');

	/** APOLLO REQUESTS **/
	const { loading, data, error } = useQuery<{ getCars: Cars }>(GET_CARS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
	});
	const recentCars = data?.getCars?.list ?? [];

	return (
		<Stack component="section" className="recently-added-cars" aria-labelledby="recently-added-heading">
			<Stack className="container">
				<div className="recent-heading">
					<h2 id="recently-added-heading">{t('Recently Added Cars')}</h2>
					<p>{t('Be the first to see our latest car listings.')}</p>
				</div>
				{loading && !data ? <div className="recent-loading" role="status" aria-label={t('Loading cars')}>
					<span className="recent-loading-label">{t('Loading cars')}</span>
					<div className="recent-grid" aria-hidden="true">
						{Array.from({ length: 8 }, (_, index) => <div key={index} className="recent-car-card recent-car-placeholder">
							<div className="recent-car-image"><Skeleton variant="rectangular" animation={false} width="100%" height="100%" /></div>
							<div className="recent-car-info">
								<div className="recent-brand"><Skeleton variant="rectangular" animation={false} width="45%" height={22} /></div>
								<div className="recent-model-placeholder">
									<Skeleton variant="rectangular" animation={false} width="80%" height={20} />
									<Skeleton variant="rectangular" animation={false} width="55%" height={20} sx={{ marginTop: '6px' }} />
								</div>
								<div className="recent-price"><Skeleton variant="rectangular" animation={false} width={110} height={32} /></div>
								<div className="recent-specs">
									<span><Skeleton variant="rectangular" animation={false} width={56} height={22} /></span>
									<span><Skeleton variant="rectangular" animation={false} width="70%" height={22} /></span>
									<span className="recent-transmission"><Skeleton variant="rectangular" animation={false} width={110} height={22} /></span>
								</div>
								<div className="recent-location"><Skeleton variant="rectangular" animation={false} width={90} height={22} /></div>
							</div>
						</div>)}
					</div>
				</div> :
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
