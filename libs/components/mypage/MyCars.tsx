import React, { useState } from 'react';
import { Alert, CircularProgress, Pagination, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { GET_AGENT_CARS } from '../../../apollo/user/query';
import { UPDATE_CAR } from '../../../apollo/user/mutation';
import { userVar, authReadyVar } from '../../../apollo/store';
import { refreshMemberCars } from '../../auth';
import { Cars } from '../../types/car/car';
import { AgentCarsInquiry } from '../../types/car/car.input';
import { CarStatus } from '../../enums/car.enum';
import { Direction } from '../../enums/common.enum';
import { CarCard } from './CarCard';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';

export default function MyCars() {
 const { t } = useTranslation('common');
 const user = useReactiveVar(userVar);
 const ready = useReactiveVar(authReadyVar);
 const [input, setInput] = useState<AgentCarsInquiry>({ page: 1, limit: 5, sort: 'createdAt', direction: Direction.DESC, search: { carStatus: CarStatus.ACTIVE } });
 const { data, loading, error, refetch } = useQuery<{ getAgentCars: Cars }>(GET_AGENT_CARS, {
  variables: { input }, skip: !ready || user.memberType !== 'AGENT', fetchPolicy: 'network-only', notifyOnNetworkStatusChange: true,
 });
 const [updateCar, { loading: updating }] = useMutation(UPDATE_CAR);
 const total = data?.getAgentCars.metaCounter?.[0]?.total ?? 0;
 const changeStatus = async (status: CarStatus, id: string) => {
  if (updating) return;
  if (!await sweetConfirmAlert(t(status === CarStatus.DELETE ? 'Delete this car?' : 'Mark this car as sold?'))) return;
  try {
   await updateCar({ variables: { input: { _id: id, carStatus: status } } });
   await refreshMemberCars().catch(() => undefined);
   const next = await refetch();
   const count = next.data.getAgentCars.metaCounter?.[0]?.total ?? 0;
   if (input.page > 1 && (input.page - 1) * input.limit >= count) setInput({ ...input, page: input.page - 1 });
  } catch (error) { await sweetErrorHandling(error); }
 };
 if (!ready) return null;
 if (user.memberType !== 'AGENT') return <Alert severity="info">{t('Sign in as a seller to manage cars.')}</Alert>;
 return <div id="my-car-page" aria-busy={updating}>
  <Typography variant="h4">{t('My cars')}</Typography>
  <Tabs value={input.search.carStatus} onChange={(_, carStatus) => setInput({ ...input, page: 1, search: { carStatus } })}>
   <Tab value={CarStatus.ACTIVE} label={t('On sale')} /><Tab value={CarStatus.SOLD} label={t('Sold')} />
  </Tabs>
  {loading && <CircularProgress aria-label={t('Loading cars')} />}
  {error && <Alert severity="error">{t('Cars could not be loaded. Please try again.')}</Alert>}
  {!loading && !error && !data?.getAgentCars.list.length && <Typography>{t('No cars found.')}</Typography>}
  <Stack className="list-box" sx={{ pointerEvents: updating ? 'none' : 'auto', opacity: updating ? 0.6 : 1 }}>
   {data?.getAgentCars.list.map(car => <CarCard key={car._id} car={car}
    deleteCarHandler={(id: string) => changeStatus(CarStatus.DELETE, id)} updateCarHandler={changeStatus} />)}
  </Stack>
  {total > 0 && <Pagination page={input.page} count={Math.ceil(total / input.limit)} onChange={(_, page) => setInput({ ...input, page })} />}
 </div>;
}
