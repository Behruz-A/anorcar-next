import { useTranslation } from 'next-i18next';
import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Alert, Button, Checkbox, CircularProgress, FormControlLabel, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { CREATE_CAR, UPDATE_CAR } from '../../../apollo/user/mutation';
import { GET_CAR } from '../../../apollo/user/query';
import { GET_BRANDS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { getJwtToken, refreshMemberCars } from '../../auth';
import { CarCondition, CarFuelType, CarLocation, CarTransmission, CarStatus } from '../../enums/car.enum';
import { MemberType } from '../../enums/member.enum';
import { CarInput } from '../../types/car/car.input';
import { Car } from '../../types/car/car';
import { Brand } from '../../types/brand/brand';
import { carLabel, validateCarInput } from '../../car';
import { imageUrl, maxCarYear, REACT_APP_API_GRAPHQL_URL } from '../../config';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';

type Draft = Omit<CarInput, 'carFuelType' | 'carCondition' | 'carLocation' | 'carTransmission'> & {
 carFuelType: CarFuelType | ''; carCondition: CarCondition | ''; carLocation: CarLocation | ''; carTransmission: CarTransmission | '';
};
const emptyDraft = (): Draft => ({
 carFuelType: '', carCondition: '', carLocation: '', carTransmission: '', brandId: '',
 carModel: '', carYear: new Date().getFullYear(), carTitle: '', carPrice: 0, carColor: '',
 carAddress: '', carImages: [], carDesc: '', carBarter: false, carRent: false,
});
export default function AddCar() {
 const { t } = useTranslation('common');
 const router = useRouter();
 const user = useReactiveVar(userVar);
 const carId = typeof router.query.carId === 'string' ? router.query.carId : undefined;
 const [draft, setDraft] = useState<Draft>(emptyDraft);
 const [uploading, setUploading] = useState(false);
 const [message, setMessage] = useState('');
 const { data: brandsData, loading: brandsLoading, error: brandsError } = useQuery<{ getBrands: Brand[] }>(GET_BRANDS);
 const { data, loading, error } = useQuery<{ getCar: Car }>(GET_CAR, { variables: { input: carId }, skip: !carId, fetchPolicy: 'network-only' });
 const [createCar, { loading: creating }] = useMutation(CREATE_CAR);
 const [updateCar, { loading: updating }] = useMutation(UPDATE_CAR);
 const busy = uploading || creating || updating;
 useEffect(() => { setDraft(emptyDraft()); setMessage(''); }, [carId]);
 useEffect(() => {
  const car = data?.getCar;
  if (!car || car._id !== carId) return;
  setDraft({
   carFuelType: car.carFuelType, carCondition: car.carCondition, carLocation: car.carLocation,
   carTransmission: car.carTransmission, brandId: car.brandId, carModel: car.carModel,
   carYear: car.carYear, carTitle: car.carTitle, carPrice: car.carPrice, carColor: car.carColor,
   carMileage: car.carMileage ?? null,
   carAddress: car.carAddress, carImages: car.carImages, carDesc: car.carDesc ?? '',
   carBarter: car.carBarter, carRent: car.carRent,
  });
 }, [data, carId]);
 const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft(current => ({ ...current, [key]: value }));
 const upload = async (event: ChangeEvent<HTMLInputElement>) => {
  const input = event.currentTarget;
  const files = Array.from(input.files ?? []);
  if (!files.length) return;
  setUploading(true); setMessage('');
  try {
   if (draft.carImages.length + files.length > 5) throw new Error('A listing can contain up to 5 photos.');
   if (files.some(file => !['image/png', 'image/jpeg'].includes(file.type))) throw new Error('Choose JPEG or PNG photos.');
   const compressed = await Promise.all(files.map(file => imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true })));
   const form = new FormData();
   form.append('operations', JSON.stringify({
    query: 'mutation ImagesUploader($files: [Upload!]!, $target: String!) { imagesUploader(files: $files, target: $target) }',
    variables: { files: compressed.map(() => null), target: 'car' },
   }));
   form.append('map', JSON.stringify(Object.fromEntries(compressed.map((_, index) => [String(index), [`variables.files.${index}`]]))));
   compressed.forEach((file, index) => form.append(String(index), file, files[index].name));
   const response = await axios.post(REACT_APP_API_GRAPHQL_URL, form, { headers: {
    'apollo-require-preflight': 'true', Authorization: `Bearer ${getJwtToken()}`,
   } });
   if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
   const images = response.data.data?.imagesUploader;
   if (!Array.isArray(images) || images.length !== files.length || images.some(image => typeof image !== 'string' || !image)) throw new Error('Upload failed. Please try again.');
   setDraft(current => ({ ...current, carImages: [...current.carImages, ...images] }));
  } catch (error: any) { setMessage(error.message); }
  finally { setUploading(false); input.value = ''; }
 };
 const submit = async (event: FormEvent) => {
  event.preventDefault();
  if (busy || user.memberType !== MemberType.AGENT) return;
  const input = {
   ...draft, carTitle: draft.carTitle.trim(), carModel: draft.carModel.trim(),
   carAddress: draft.carAddress.trim(), carColor: draft.carColor.trim(),
   carDesc: draft.carDesc?.trim() || undefined,
  } as CarInput;
  const validation = validateCarInput(input);
  if (validation) { setMessage(validation); return; }
  if (!brandsData?.getBrands.some(brand => brand._id === input.brandId)) { setMessage('Select an active brand.'); return; }
  try {
   if (carId) await updateCar({ variables: { input: { ...input, _id: carId } } });
   else await createCar({ variables: { input } });
   await refreshMemberCars().catch(() => undefined);
   await sweetMixinSuccessAlert(t(carId ? 'Your car has been updated.' : 'Your car has been created.'));
   await router.push({ pathname: '/mypage', query: { category: 'myCars' } });
  } catch (error: any) { await sweetErrorHandling(error); }
 };
 if (user.memberType !== MemberType.AGENT) return <Alert severity="info">{t("Sign in as a seller to manage cars.")}</Alert>;
 if (carId && loading) return <CircularProgress />;
 if (carId && error) return <Alert severity="error">{t("This car could not be loaded.")}</Alert>;
 if (carId && (!data?.getCar || data.getCar.memberId !== user._id || data.getCar.carStatus !== CarStatus.ACTIVE))
  return <Alert severity="warning">{t("Only your active cars can be edited.")}</Alert>;
 const brands = brandsData?.getBrands ?? [];
 const selects = [
  { key: 'carFuelType', label: 'Fuel', values: Object.values(CarFuelType) },
  { key: 'carCondition', label: 'Condition', values: Object.values(CarCondition) },
  { key: 'carTransmission', label: 'Transmission', values: Object.values(CarTransmission) },
  { key: 'carLocation', label: 'Location', values: Object.values(CarLocation) },
 ] as const;
 return <div id="add-car-page">
  <Stack className="main-title-box"><Typography className="main-title">{t(carId ? 'Edit car' : 'Add car')}</Typography></Stack>
  <form onSubmit={submit} className="car-form">
   <fieldset disabled={busy}>
    <Stack spacing={2}>
     {message && <Alert severity="error">{t(message)}</Alert>}
     {brandsError && <Alert severity="error">{t("Brands could not be loaded.")}</Alert>}
     {!brandsLoading && !brandsError && !brands.length && <Alert severity="info">{t("No brands are available yet. Please try again later.")}</Alert>}
     <TextField select label={t("Brand")} required value={draft.brandId} disabled={brandsLoading || !!brandsError} onChange={e => set('brandId', e.target.value)}>
      <MenuItem value="" disabled>{t("Select a brand")}</MenuItem>
      {brands.map(brand => <MenuItem key={brand._id} value={brand._id}>{brand.brandName}</MenuItem>)}
      {draft.brandId && !brands.some(brand => brand._id === draft.brandId) && <MenuItem value={draft.brandId} disabled>{t("Unavailable brand — select another")}</MenuItem>}
     </TextField>
     {(['carTitle', 'carModel', 'carColor', 'carAddress'] as const).map(key => <TextField key={key} required
      label={t({ carTitle: 'Title', carModel: 'Model', carColor: 'Color', carAddress: 'Address' }[key])}
      value={draft[key]} inputProps={{ minLength: key === 'carTitle' || key === 'carAddress' ? 3 : 1,
       maxLength: key === 'carModel' ? 80 : key === 'carColor' ? 40 : 100 }}
      onChange={e => set(key, e.target.value)} />)}
     <Stack direction="row" spacing={2}>
      <TextField type="number" required label={t("Model year")} value={draft.carYear || ''} inputProps={{ min: 1886, max: maxCarYear, step: 1 }} onChange={e => set('carYear', Number(e.target.value))} />
      <TextField type="number" required label={t("Price")} value={draft.carPrice || ''} inputProps={{ min: 1, step: 'any' }} onChange={e => set('carPrice', Number(e.target.value))} />
     </Stack>
     <TextField type="number" label={t('Mileage (km)')} value={draft.carMileage ?? ''}
      inputProps={{ min: 0, max: 2147483647, step: 1 }} helperText={t('Leave empty if mileage is not known.')}
      onChange={e => set('carMileage', e.target.value === '' ? null : Number(e.target.value))} />
     {selects.map(({ key, label, values }) => <TextField key={key} select required label={t(label)} value={draft[key]}
      onChange={e => setDraft(current => ({ ...current, [key]: e.target.value }))}>
      <MenuItem value="" disabled>{t('Select an option')}</MenuItem>
      {values.map(value => <MenuItem key={value} value={value}>{t(carLabel(value))}</MenuItem>)}
     </TextField>)}
     <TextField multiline minRows={4} label={t("Description (optional)")} value={draft.carDesc ?? ''} inputProps={{ maxLength: 500 }} onChange={e => set('carDesc', e.target.value)} />
     <Stack direction="row"><FormControlLabel label={t("Available for barter")} control={<Checkbox checked={draft.carBarter ?? false} onChange={e => set('carBarter', e.target.checked)} />} />
      <FormControlLabel label={t("Available for rent")} control={<Checkbox checked={draft.carRent ?? false} onChange={e => set('carRent', e.target.checked)} />} /></Stack>
     <Typography>{t("Car photos (up to 5)")}</Typography>
     <input aria-label={t("Upload car photos")} type="file" multiple accept="image/jpeg,image/png" onChange={upload} disabled={busy || draft.carImages.length >= 5} />
     {uploading && <Typography role="status">{t("Uploading photos…")}</Typography>}
     <Stack className="car-photo-previews" direction="row" spacing={2}>
      {draft.carImages.map(image => <Stack key={image}><img src={imageUrl(image)} alt="Car photo" width={140} height={100} style={{ objectFit: 'cover' }} />
       <Button disabled={busy} onClick={() => set('carImages', draft.carImages.filter(item => item !== image))}>{t("Remove photo")}</Button></Stack>)}
     </Stack>
     <Button type="submit" variant="contained" disabled={busy || !brands.length || !!brandsError}>{creating || updating ? t('Saving…') : t(carId ? 'Save changes' : 'Create car')}</Button>
    </Stack>
   </fieldset>
  </form>
 </div>;
}
