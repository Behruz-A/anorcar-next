import { useTranslation } from 'next-i18next';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { CarsInquiry } from '../../types/car/car.input';
import CarSearchFields from './CarSearchFields';
import { parseCarsInquiry } from '../../car';
interface Props { searchFilter: CarsInquiry; onApply: (input: CarsInquiry) => void; }
export default function Filter({ searchFilter, onApply }: Props) {
 const { t } = useTranslation('common');
 const [search, setSearch] = useState(searchFilter.search);
 useEffect(() => setSearch(searchFilter.search), [searchFilter]);
 const invalid = [search.yearsRange, search.pricesRange].some(range => range &&
  (!Number.isInteger(range.start) || !Number.isInteger(range.end) || range.start > range.end));
 return <Stack className="car-filter" spacing={2}>
  <Typography variant="h6">{t('Find your car')}</Typography>
  <CarSearchFields search={search} onChange={setSearch} />
  {invalid && <Alert severity="error">{t("Enter a valid range, with the minimum no greater than the maximum.")}</Alert>}
  <Button variant="contained" disabled={invalid} onClick={() => onApply(parseCarsInquiry({ ...searchFilter, page: 1, search }))}>{t('Apply filters')}</Button>
  <Button onClick={() => { setSearch({}); onApply({ ...searchFilter, page: 1, search: {} }); }}>{t('Reset filters')}</Button>
 </Stack>;
}
