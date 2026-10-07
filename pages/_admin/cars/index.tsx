import React, { useState } from 'react';
import { Alert, Box, CircularProgress, MenuItem, Stack, Tab, Tabs, TablePagination, TextField, Typography } from '@mui/material';
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
 const user = useReactiveVar(userVar), ready = useReactiveVar(authReadyVar);
 const [input, setInput] = useState<AllCarsInquiry>({ page: 1, limit: 10, sort: 'createdAt', direction: Direction.DESC, search: {} });
 const [anchorEl, setAnchorEl] = useState<Record<number, HTMLElement>>({});
 const skip = !ready || user.memberType !== 'ADMIN';
 const { data, loading, error, refetch } = useQuery<{ getAllCarsByAdmin: Cars }>(GET_ALL_CARS_BY_ADMIN, { variables: { input }, skip, fetchPolicy: 'network-only', notifyOnNetworkStatusChange: true });
 const { data: brandsData } = useQuery<{ getAllBrandsByAdmin: Brand[] }>(GET_ALL_BRANDS_BY_ADMIN, { skip });
 const [updateCar, { loading: updating }] = useMutation(UPDATE_CAR_BY_ADMIN);
 const [removeCar, { loading: removing }] = useMutation(REMOVE_CAR_BY_ADMIN);
 const busy = updating || removing;
 const cars = data?.getAllCarsByAdmin.list ?? [], total = data?.getAllCarsByAdmin.metaCounter?.[0]?.total ?? 0;
 const refresh = async () => {
  const result = await refetch();
  const count = result.data.getAllCarsByAdmin.metaCounter?.[0]?.total ?? 0;
  if (input.page > 1 && (input.page - 1) * input.limit >= count) setInput({ ...input, page: input.page - 1 });
 };
 const update = async (carInput: CarUpdate) => {
  if (busy || !await sweetConfirmAlert(t(carInput.carStatus === CarStatus.DELETE ? 'Delete this car?' : 'Mark this car as sold?'))) return;
  try { await updateCar({ variables: { input: carInput } }); setAnchorEl({}); await refresh(); }
  catch (error) { await sweetErrorHandling(error); }
 };
 const remove = async (id: string) => {
  if (busy || cars.find(car => car._id === id)?.carStatus !== CarStatus.DELETE) return;
  if (!await sweetConfirmAlert(t('Permanently remove this deleted car? This cannot be undone.'))) return;
  try { await removeCar({ variables: { input: id } }); await refresh(); }
  catch (error) { await sweetErrorHandling(error); }
 };
 return <Box component="div" className="content">
  <Typography variant="h4" sx={{ mb: 3 }}>{t('Cars')}</Typography>
  <Tabs value={input.search.carStatus ?? 'ALL'} onChange={(_, value) => setInput({ ...input, page: 1, search: { ...input.search, carStatus: value === 'ALL' ? undefined : value } })}>
   <Tab value="ALL" label={t('All')} />{Object.values(CarStatus).map(status => <Tab key={status} value={status} label={t(status)} />)}
  </Tabs>
  <Stack direction="row" spacing={2} sx={{ my: 3 }}>
   <TextField select label={t('Location')} value={input.search.carLocations?.[0] ?? ''} onChange={e => setInput({ ...input, page: 1, search: { ...input.search, carLocations: e.target.value ? [e.target.value as CarLocation] : undefined } })}>
    <MenuItem value="">{t('All')}</MenuItem>{Object.values(CarLocation).map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}
   </TextField>
   <TextField select label={t('Brand')} value={input.search.brandIds?.[0] ?? ''} onChange={e => setInput({ ...input, page: 1, search: { ...input.search, brandIds: e.target.value ? [e.target.value] : undefined } })}>
    <MenuItem value="">{t('All brands')}</MenuItem>{brandsData?.getAllBrandsByAdmin.map(brand => <MenuItem key={brand._id} value={brand._id}>{brand.brandName}</MenuItem>)}
   </TextField>
  </Stack>
  {loading && <CircularProgress aria-label={t('Loading cars')} />}
  {error && <Alert severity="error">{t('Cars could not be loaded. Please try again.')}</Alert>}
  <div style={{ pointerEvents: busy ? 'none' : 'auto', opacity: busy ? 0.6 : 1 }} aria-busy={busy}>
   <CarPanelList cars={cars} anchorEl={anchorEl} menuIconClickHandler={(e: React.MouseEvent<HTMLElement>, index: number) => setAnchorEl({ [index]: e.currentTarget })}
    menuIconCloseHandler={() => setAnchorEl({})} updateCarHandler={update} removeCarHandler={remove} />
  </div>
  <TablePagination component="div" count={total} page={input.page - 1} rowsPerPage={input.limit} rowsPerPageOptions={[10, 20, 40, 60]}
   onPageChange={(_, page) => setInput({ ...input, page: page + 1 })} onRowsPerPageChange={e => setInput({ ...input, page: 1, limit: Number(e.target.value) })} />
 </Box>;
}
export default withAdminLayout(AdminCars);
