import { useTranslation } from 'next-i18next';
import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Alert, Box, CircularProgress, MenuItem, Pagination, Stack, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import CarCard from '../../libs/components/car/CarCard';
import Filter from '../../libs/components/car/Filter';
import { defaultCarsInquiry, parseCarsInquiry } from '../../libs/car';
import { Cars } from '../../libs/types/car/car';
import { CarsInquiry } from '../../libs/types/car/car.input';
import { GET_CARS } from '../../apollo/user/query';
import { LIKE_TARGET_CAR } from '../../apollo/user/mutation';
import { Direction, Message } from '../../libs/enums/common.enum';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
export const getStaticProps = async ({ locale }: any) => ({ props: { ...(await serverSideTranslations(locale, ['common'])) } });
const CarList: NextPage = () => {
 const { t } = useTranslation('common');
 const router = useRouter();
 const [input, setInput] = useState<CarsInquiry>(defaultCarsInquiry);
 useEffect(() => { if (router.isReady) setInput(parseCarsInquiry(router.query.input)); }, [router.isReady, router.query.input]);
 const { data, loading, error, refetch } = useQuery<{ getCars: Cars }>(GET_CARS, {
  variables: { input }, skip: !router.isReady, notifyOnNetworkStatusChange: true, fetchPolicy: 'network-only',
 });
 const [likeCar] = useMutation(LIKE_TARGET_CAR);
 const apply = (next: CarsInquiry) => { setInput(next); void router.push({ pathname: '/car', query: { input: JSON.stringify(next) } }, undefined, { scroll: false }); };
 const likeCarHandler = async (user: { _id: string }, id: string) => {
  try { if (!user._id) throw new Error(Message.NOT_AUTHENTICATED); await likeCar({ variables: { input: id } }); await refetch(); }
  catch (error: any) { await sweetMixinErrorAlert(error.message); }
 };
 const cars = data?.getCars.list ?? [];
 const total = data?.getCars.metaCounter?.[0]?.total ?? 0;
 const sortValue = input.sort === 'carPrice' ? (input.direction === Direction.ASC ? 'lowest' : 'highest') : 'new';
 return <div id="car-list-page"><div className="container">
  <Stack className="car-browse-toolbar" direction="row" justifyContent="space-between">
   <Typography variant="h4">{t("Cars")}</Typography>
   <TextField select label={t("Sort by")} size="small" value={sortValue} onChange={e => apply({
    ...input, page: 1, sort: e.target.value === 'new' ? 'createdAt' : 'carPrice',
    direction: e.target.value === 'lowest' ? Direction.ASC : Direction.DESC,
   })}><MenuItem value="new">{t("Newest")}</MenuItem><MenuItem value="lowest">{t("Lowest price")}</MenuItem><MenuItem value="highest">{t("Highest price")}</MenuItem></TextField>
  </Stack>
  <Stack className="car-page">
   <Stack className="filter-config"><Filter searchFilter={input} onApply={apply} /></Stack>
   <Stack className="main-config">
     {loading && <div role="status" style={{ padding: 16 }}><CircularProgress size={24} /><Typography>{t("Loading cars…")}</Typography></div>}
    {error && <Alert severity="error">{t("Cars could not be loaded. Please try again.")}</Alert>}
    {!loading && !error && !cars.length && <Typography sx={{ p: 3 }}>{t("No cars found. Try changing your filters.")}</Typography>}
    <Stack className="list-config">{cars.map(car => <CarCard key={car._id} car={car} likeCarHandler={likeCarHandler} />)}</Stack>
    {total > 0 && <Stack className="pagination-config" spacing={2}>
     <Pagination page={input.page} count={Math.ceil(total / input.limit)} onChange={(_, page) => apply({ ...input, page })} />
     <Typography>{t('Available cars: {{count}}', { count: total })}</Typography>
    </Stack>}
   </Stack>
  </Stack>
 </div></div>;
};
export default withLayoutBasic(CarList);
