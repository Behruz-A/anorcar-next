import React, { useState } from 'react';
import { Alert, CircularProgress, Pagination, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { GET_FAVORITES, GET_VISITED } from '../../../apollo/user/query';
import { LIKE_TARGET_CAR } from '../../../apollo/user/mutation';
import { userVar, authReadyVar } from '../../../apollo/store';
import { Cars } from '../../types/car/car';
import CarCard from '../car/CarCard';
import { sweetErrorHandling } from '../../sweetAlert';

export default function SavedCars({ visited = false }: { visited?: boolean }) {
 const { t } = useTranslation('common');
 const user = useReactiveVar(userVar);
 const ready = useReactiveVar(authReadyVar);
 const [input, setInput] = useState({ page: 1, limit: 6 });
 const { data, loading, error, refetch } = useQuery<{ getFavorites?: Cars; getVisited?: Cars }>(visited ? GET_VISITED : GET_FAVORITES, {
  variables: { input }, skip: !ready || !user._id, fetchPolicy: 'network-only', notifyOnNetworkStatusChange: true,
 });
 const [likeCar, { loading: liking }] = useMutation(LIKE_TARGET_CAR);
 const result = visited ? data?.getVisited : data?.getFavorites;
 const total = result?.metaCounter?.[0]?.total ?? 0;
 const toggleLike = async (_user: unknown, id: string) => {
  if (liking || !user._id) return;
  try {
   await likeCar({ variables: { input: id } });
   const next = await refetch();
   const count = next.data.getFavorites?.metaCounter?.[0]?.total ?? 0;
   if (input.page > 1 && (input.page - 1) * input.limit >= count) setInput({ ...input, page: input.page - 1 });
  } catch (error) { await sweetErrorHandling(error); }
 };
 return <div id="my-favorites-page">
  <Typography variant="h4" sx={{ mb: 3 }}>{t(visited ? 'Recently visited' : 'My favorites')}</Typography>
  {loading && <CircularProgress aria-label={t('Loading cars')} />}
  {error && <Alert severity="error">{t('Cars could not be loaded. Please try again.')}</Alert>}
  {!loading && !error && !result?.list.length && <Typography>{t('No cars found.')}</Typography>}
  <Stack className="favorites-list-box">{result?.list.map(car => <CarCard key={car._id} car={car} recentlyVisited={visited} myFavorites={!visited} likeCarHandler={toggleLike} />)}</Stack>
  {total > 0 && <Pagination sx={{ mt: 3 }} page={input.page} count={Math.ceil(total / input.limit)} onChange={(_, page) => setInput({ ...input, page })} />}
 </div>;
}
