import React, { useRef, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	MenuItem,
	Stack,
	Tab,
	Tabs,
	TablePagination,
	TextField,
} from '@mui/material';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { CarPanelList } from '../../../libs/components/admin/cars/CarList';
import { GET_ALL_CARS_BY_ADMIN } from '../../../apollo/admin/query';
import { UPDATE_CAR_BY_ADMIN, REMOVE_CAR_BY_ADMIN } from '../../../apollo/admin/mutation';
import { GET_ALL_BRANDS_BY_ADMIN } from '../../../apollo/admin/query';
import { userVar, authReadyVar } from '../../../apollo/store';
import { Cars } from '../../../libs/types/car/car';
import { Brand } from '../../../libs/types/brand/brand';
import { AllCarsInquiry } from '../../../libs/types/car/car.input';
import { CarUpdate } from '../../../libs/types/car/car.update';
import { CarLocation, CarStatus } from '../../../libs/enums/car.enum';
import { Direction } from '../../../libs/enums/common.enum';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';

function AdminCars() {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar),
		ready = useReactiveVar(authReadyVar);
	const [input, setInput] = useState<AllCarsInquiry>({
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: {},
	});
	const [pending, setPending] = useState(false);
	const actionPending = useRef(false);
	const skip = !ready || user.memberType !== 'ADMIN';
	const { data, loading, error, refetch } = useQuery<{ getAllCarsByAdmin: Cars }>(GET_ALL_CARS_BY_ADMIN, {
		variables: { input },
		skip,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	const { data: brandsData } = useQuery<{ getAllBrandsByAdmin: Brand[] }>(GET_ALL_BRANDS_BY_ADMIN, { skip });
	const [updateCar, { loading: updating }] = useMutation(UPDATE_CAR_BY_ADMIN);
	const [removeCar, { loading: removing }] = useMutation(REMOVE_CAR_BY_ADMIN);
	const busy = pending || updating || removing;
	const cars = data?.getAllCarsByAdmin.list ?? [],
		total = data?.getAllCarsByAdmin.metaCounter?.[0]?.total ?? 0;
	const refresh = async () => {
		const result = await refetch();
		const count = result.data.getAllCarsByAdmin.metaCounter?.[0]?.total ?? 0;
		if (input.page > 1 && (input.page - 1) * input.limit >= count) setInput({ ...input, page: input.page - 1 });
	};
	const update = async (carInput: CarUpdate) => {
		const current = cars.find((car) => car._id === carInput._id);
		if (actionPending.current || !current || current.carStatus === CarStatus.DELETE ||
			(current.carStatus === CarStatus.SOLD && carInput.carStatus !== CarStatus.ACTIVE)) return;
		actionPending.current = true;
		setPending(true);
		try {
			if (
				!(await sweetConfirmAlert(
					t(carInput.carStatus === CarStatus.ACTIVE ? 'Reactivate this car?' : carInput.carStatus === CarStatus.DELETE ? 'Delete this car?' : 'Mark this car as sold?'),
				))
			)
				return;
			await updateCar({ variables: { input: carInput } });
			await refresh();
		} catch (error) {
			await sweetErrorHandling(error);
		} finally {
			actionPending.current = false;
			setPending(false);
		}
	};
	const remove = async (id: string) => {
		if (actionPending.current || cars.find((car) => car._id === id)?.carStatus !== CarStatus.DELETE) return;
		actionPending.current = true;
		setPending(true);
		try {
			if (!(await sweetConfirmAlert(t('Permanently remove this deleted car? This cannot be undone.')))) return;
			await removeCar({ variables: { input: id } });
			await refresh();
		} catch (error) {
			await sweetErrorHandling(error);
		} finally {
			actionPending.current = false;
			setPending(false);
		}
	};
	return (
		<Box component="div" className="content">
			<div className="admin-page-heading">
				<div>
					<h1>{t('Cars')}</h1>
					<p>Manage listing statuses and reactivate cars marked as sold.</p>
				</div>
				<span className="admin-total">{total} cars</span>
			</div>
			<Tabs
				value={input.search.carStatus ?? 'ALL'}
				onChange={(_, value) =>
					setInput({ ...input, page: 1, search: { ...input.search, carStatus: value === 'ALL' ? undefined : value } })
				}
			>
				<Tab value="ALL" label={t('All')} />
				{Object.values(CarStatus).map((status) => (
					<Tab key={status} value={status} label={t(status)} />
				))}
			</Tabs>
			<Stack className="admin-filters">
				<TextField
					select
					label={t('Location')}
					value={input.search.carLocations?.[0] ?? ''}
					onChange={(e) =>
						setInput({
							...input,
							page: 1,
							search: { ...input.search, carLocations: e.target.value ? [e.target.value as CarLocation] : undefined },
						})
					}
				>
					<MenuItem value="">{t('All')}</MenuItem>
					{Object.values(CarLocation).map((value) => (
						<MenuItem key={value} value={value}>
							{value}
						</MenuItem>
					))}
				</TextField>
				<TextField
					select
					label={t('Brand')}
					value={input.search.brandIds?.[0] ?? ''}
					onChange={(e) =>
						setInput({
							...input,
							page: 1,
							search: { ...input.search, brandIds: e.target.value ? [e.target.value] : undefined },
						})
					}
				>
					<MenuItem value="">{t('All brands')}</MenuItem>
					{brandsData?.getAllBrandsByAdmin.map((brand) => (
						<MenuItem key={brand._id} value={brand._id}>
							{brand.brandName}
						</MenuItem>
					))}
				</TextField>
			</Stack>
			{loading && <CircularProgress aria-label={t('Loading cars')} />}
			{error && (
				<Alert severity="error">
					{t('Cars could not be loaded. Please try again.')} <Button onClick={() => void refetch()}>Retry</Button>
				</Alert>
			)}
			<div className="admin-table-panel" aria-busy={busy}>
				{!error && (
					<CarPanelList cars={cars} pending={busy || loading} updateCarHandler={update} removeCarHandler={remove} />
				)}
				<TablePagination
					component="div"
					count={total}
					page={input.page - 1}
					rowsPerPage={input.limit}
					rowsPerPageOptions={[10, 20, 40, 60]}
					onPageChange={(_, page) => setInput({ ...input, page: page + 1 })}
					onRowsPerPageChange={(e) => setInput({ ...input, page: 1, limit: Number(e.target.value) })}
				/>
			</div>
		</Box>
	);
}
export default withAdminLayout(AdminCars);
