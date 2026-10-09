import React, { useEffect, useState } from 'react';
import { Alert, Breadcrumbs, Button, CircularProgress } from '@mui/material';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { useApolloClient } from '@apollo/client';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GET_CAR } from '../../apollo/user/query';
import { Car } from '../../libs/types/car/car';
import { parseCompareIds } from '../../libs/carCompare';
import CarComparisonTable from '../../libs/components/car/CarComparisonTable';
import withLayoutFull from '../../libs/components/layout/LayoutFull';

export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const CarComparePage = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const client = useApolloClient();
	const [cars, setCars] = useState<Car[]>([]);
	const [loading, setLoading] = useState(true);
	const [failed, setFailed] = useState(false);
	const [attempt, setAttempt] = useState(0);
	const idsKey = parseCompareIds(router.query.ids).join(',');
	useEffect(() => {
		if (!router.isReady) return;
		let active = true;
		const ids = parseCompareIds(idsKey);
		setCars([]);
		setFailed(false);
		if (!ids.length) {
			setLoading(false);
			return;
		}
		setLoading(true);
		void Promise.allSettled(
			ids.map((id) =>
				client.query<{ getCar: Car }>({
					query: GET_CAR,
					variables: { input: id },
					fetchPolicy: 'network-only',
				}),
			),
		).then((results) => {
			if (!active) return;
			const loaded = results.flatMap((result, index) =>
				result.status === 'fulfilled' && result.value.data.getCar?._id === ids[index] ? [result.value.data.getCar] : [],
			);
			setCars(loaded);
			setFailed(loaded.length !== ids.length);
			setLoading(false);
		});
		return () => {
			active = false;
		};
	}, [client, router.isReady, idsKey, attempt]);
	const removeCar = (id: string) => {
		const ids = parseCompareIds(idsKey).filter((item) => item !== id);
		void router.replace({ pathname: '/car/compare', query: ids.length ? { ids: ids.join(',') } : {} }, undefined, {
			shallow: true,
		});
	};
	return (
		<div className="compare-results-page">
			<section className="compare-cars" aria-labelledby="compare-cars-heading">
				<div className="compare-container">
					<header className="compare-heading compare-page-heading">
						<Breadcrumbs aria-label={t('Breadcrumb navigation')} separator={<NavigateNextRoundedIcon fontSize="small" />}>
							<Link href="/">{t('Home')}</Link>
							<Link href="/car">{t('Cars')}</Link>
							<span aria-current="page">{t('Compare')}</span>
						</Breadcrumbs>
						<h1 id="compare-cars-heading">{t('Compare Cars')}</h1>
						<p>{t('See key specifications, features and prices side by side to find the perfect car for your needs.')}</p>
					</header>
					{loading ? (
						<div className="compare-status">
							<CircularProgress aria-label={t('Loading cars')} />
						</div>
					) : (
						<>
							{failed && (
								<Alert
									severity="warning"
									action={<Button onClick={() => setAttempt((value) => value + 1)}>{t('Try again')}</Button>}
								>
									{t('Some selected cars could not be loaded.')}
								</Alert>
							)}
							{cars.length >= 2 ? (
								<CarComparisonTable cars={cars} onRemove={removeCar} />
							) : (
								<div className="compare-status">
									<p>{t('Select at least two cars to compare.')}</p>
									<Button component={Link} href="/#compare-cars-heading">
										{t('Edit selection')}
									</Button>
								</div>
							)}
						</>
					)}
				</div>
			</section>
		</div>
	);
};
export default withLayoutFull(CarComparePage, { showChat: false });
