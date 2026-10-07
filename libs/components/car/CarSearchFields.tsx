import { useTranslation } from 'next-i18next';
import React from 'react';
import { Alert, Checkbox, FormControlLabel, MenuItem, Stack, TextField } from '@mui/material';
import { useQuery } from '@apollo/client';
import { GET_BRANDS } from '../../../apollo/user/query';
import { Brand } from '../../types/brand/brand';
import { CarSearch } from '../../types/car/car.input';
import { CarCondition, CarFuelType, CarLocation, CarTransmission } from '../../enums/car.enum';
import { carLabel } from '../../car';
import { maxCarYear } from '../../config';

interface Props { search: CarSearch; onChange: (search: CarSearch) => void; }
export default function CarSearchFields({ search, onChange }: Props) {
 const { t } = useTranslation('common');
 const { data, loading, error } = useQuery<{ getBrands: Brand[] }>(GET_BRANDS);
 const setList = (key: keyof CarSearch, value: string) => onChange({ ...search, [key]: value ? [value] : undefined });
 const selections = [
  { key: 'locations', label: 'Location', values: Object.values(CarLocation) },
  { key: 'fuelTypes', label: 'Fuel', values: Object.values(CarFuelType) },
  { key: 'conditions', label: 'Condition', values: Object.values(CarCondition) },
  { key: 'transmissions', label: 'Transmission', values: Object.values(CarTransmission) },
 ] as const;
 return <Stack spacing={2}>
  <TextField label={t('Search cars')} value={search.text ?? ''} onChange={e => onChange({ ...search, text: e.target.value })} size="small" />
  <TextField select label={t('Brand')} size="small" value={search.brandIds?.[0] ?? ''} disabled={loading}
   onChange={e => setList('brandIds', e.target.value)}>
   <MenuItem value="">{t('All brands')}</MenuItem>
   {data?.getBrands.map(brand => <MenuItem key={brand._id} value={brand._id}>{brand.brandName}</MenuItem>)}
  </TextField>
  {error && <Alert severity="warning">{t("Brands could not be loaded. Other filters are available.")}</Alert>}
  {selections.map(({ key, label, values }) => <TextField key={key} select label={t(label)} size="small"
   SelectProps={{ multiple: true }} value={search[key] ?? []}
   onChange={e => onChange({ ...search, [key]: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}>
   {values.map(value => <MenuItem key={value} value={value}>{t(carLabel(value))}</MenuItem>)}
  </TextField>)}
  {(['yearsRange', 'pricesRange'] as const).map(key => <Stack key={key} direction="row" spacing={1}>
   {(['start', 'end'] as const).map(part => <TextField key={part} type="number" size="small"
    label={t(key === 'yearsRange' ? (part === 'start' ? 'Year from' : 'Year to') : (part === 'start' ? 'Price from' : 'Price to'))}
    value={search[key]?.[part] ?? ''}
    inputProps={{ min: key === 'yearsRange' ? 1886 : 0, max: key === 'yearsRange' ? maxCarYear : 2147483647, step: 1 }}
    onChange={e => {
     if (!e.target.value) { onChange({ ...search, [key]: undefined }); return; }
     const fallback = key === 'yearsRange' ? { start: 1886, end: maxCarYear } : { start: 0, end: 2147483647 };
     onChange({ ...search, [key]: { ...fallback, ...search[key], [part]: Number(e.target.value) } });
    }} />)}
  </Stack>)}
  <Stack direction="row">
   {(['carBarter', 'carRent'] as const).map(option => <FormControlLabel key={option} label={t(option === 'carRent' ? 'Rent' : 'Barter')}
    control={<Checkbox checked={search.options?.includes(option) ?? false} onChange={e =>
     onChange({ ...search, options: e.target.checked ? [...(search.options ?? []), option] : search.options?.filter(item => item !== option) })} />} />)}
  </Stack>
 </Stack>;
}
