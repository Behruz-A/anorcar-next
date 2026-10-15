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
 const validMemberId = /^[a-f\d]{24}$/i.test(memberId);
 const [page, setPage] = useState(1);
 useEffect(() => setPage(1), [memberId]);
 const input = { ...defaultCarsInquiry, page, limit: 5, search: { memberId } };
 const { data, loading, error } = useQuery<{ getCars: Cars }>(GET_CARS, {
  variables: { input }, skip: !router.isReady || !validMemberId, fetchPolicy: 'network-only', notifyOnNetworkStatusChange: true,
 });
 const total = data?.getCars.metaCounter?.[0]?.total ?? 0;
 if (!router.isReady) return <CircularProgress aria-label={t('Loading cars')} />;
 if (!validMemberId) return <Alert severity="error">{t('Cars could not be loaded. Please try again.')}</Alert>;
 return <div id="member-cars-page">
  <Stack className="main-title-box">
   <Stack className="right-box"><Typography className="main-title">{t('Cars')}</Typography></Stack>
  </Stack>
  <Stack className="cars-list-box">
   <Stack className="list-box">
  {loading && <CircularProgress aria-label={t('Loading cars')} />}
  {error && <Alert severity="error">{t('Cars could not be loaded. Please try again.')}</Alert>}
  {!loading && !error && data?.getCars.list.length === 0 && <div className="no-data">
   <img src="/img/icons/icoAlert.svg" alt="" /><Typography>{t('No cars found.')}</Typography>
  </div>}
  {!!data?.getCars.list.length && <Stack className="listing-title-box">
   {[t('Listings'), t('Date added'), t('Status'), t('Views')].map((title, index) => <Typography key={index} className="title-text">{title}</Typography>)}
  </Stack>}
  {data?.getCars.list.map(car => <CarCard key={car._id} car={car} memberPage />)}
  {total > 0 && <Stack className="pagination-config">
   <Stack className="pagination-box">
    <Pagination page={page} count={Math.ceil(total / input.limit)} shape="circular" color="primary" onChange={(_, next) => setPage(next)} />
   </Stack>
   <Stack className="total-result"><Typography>{t('{{total}} cars available', { total })}</Typography></Stack>
  </Stack>}
   </Stack>
  </Stack>
 </div>;
}
