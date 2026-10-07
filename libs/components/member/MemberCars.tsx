import React, { useEffect, useState } from 'react';
import { Alert, CircularProgress, Pagination, Stack, Typography } from '@mui/material';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { GET_CARS } from '../../../apollo/user/query';
import { Cars } from '../../types/car/car';
import { defaultCarsInquiry } from '../../car';
import { CarCard } from '../mypage/CarCard';

export default function MemberCars() {
 const { t } = useTranslation('common');
 const router = useRouter();
 const memberId = typeof router.query.memberId === 'string' ? router.query.memberId : '';
 const [page, setPage] = useState(1);
 useEffect(() => setPage(1), [memberId]);
 const input = { ...defaultCarsInquiry, page, limit: 5, search: { memberId } };
 const { data, loading, error } = useQuery<{ getCars: Cars }>(GET_CARS, {
  variables: { input }, skip: !router.isReady || !/^[a-f\\d]{24}$/i.test(memberId), fetchPolicy: 'network-only',
 });
 const total = data?.getCars.metaCounter?.[0]?.total ?? 0;
 return <div id="member-cars-page">
  <Typography variant="h4">{t('Cars')}</Typography>
  {loading && <CircularProgress aria-label={t('Loading cars')} />}
  {error && <Alert severity="error">{t('Cars could not be loaded. Please try again.')}</Alert>}
  {!loading && !error && !data?.getCars.list.length && <Typography>{t('No cars found.')}</Typography>}
  <Stack className="list-box">{data?.getCars.list.map(car => <CarCard key={car._id} car={car} memberPage />)}</Stack>
  {total > 0 && <Pagination page={page} count={Math.ceil(total / input.limit)} onChange={(_, next) => setPage(next)} />}
 </div>;
}
