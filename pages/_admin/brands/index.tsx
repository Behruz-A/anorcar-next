import { useTranslation } from 'next-i18next';
import React, { FormEvent, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { CREATE_BRAND, REMOVE_BRAND_BY_ADMIN, UPDATE_BRAND_BY_ADMIN } from '../../../apollo/admin/mutation';
import { GET_ALL_BRANDS_BY_ADMIN } from '../../../apollo/admin/query';
import { Brand } from '../../../libs/types/brand/brand';
import { BrandInput } from '../../../libs/types/brand/brand.input';
import { BrandStatus } from '../../../libs/enums/brand.enum';
import { MemberType } from '../../../libs/enums/member.enum';
import { userVar } from '../../../apollo/store';
import { imageUrl } from '../../../libs/config';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';

function AdminBrands() {
 const { t } = useTranslation('common');
 const user = useReactiveVar(userVar);
 const { data, loading, error, refetch } = useQuery<{ getAllBrandsByAdmin: Brand[] }>(GET_ALL_BRANDS_BY_ADMIN, {
  skip: user.memberType !== MemberType.ADMIN, fetchPolicy: 'network-only',
 });
 const [createBrand, { loading: creating }] = useMutation(CREATE_BRAND);
 const [updateBrand, { loading: updating }] = useMutation(UPDATE_BRAND_BY_ADMIN);
 const [removeBrand, { loading: removing }] = useMutation(REMOVE_BRAND_BY_ADMIN);
 const [open, setOpen] = useState(false);
 const [editing, setEditing] = useState<Brand | null>(null);
 const [draft, setDraft] = useState<BrandInput>({ brandName: '', brandLogo: '' });
 const busy = creating || updating || removing;
 const edit = (brand: Brand | null) => {
  setEditing(brand); setDraft({ brandName: brand?.brandName ?? '', brandLogo: brand?.brandLogo ?? '' }); setOpen(true);
 };
 const save = async (event: FormEvent) => {
  event.preventDefault(); if (busy) return;
  const input = { brandName: draft.brandName.trim(), brandLogo: draft.brandLogo.trim() };
  if (!input.brandName || !input.brandLogo) return;
  try {
   if (editing) await updateBrand({ variables: { input: { ...input, _id: editing._id } } });
   else await createBrand({ variables: { input } });
   setOpen(false); await refetch();
  } catch (error) { await sweetErrorHandling(error); }
 };
 const deactivate = async (brand: Brand) => {
  if (busy || !await sweetConfirmAlert(`Deactivate ${brand.brandName}? It will no longer be available for new cars.`)) return;
  try { await removeBrand({ variables: { input: brand._id } }); await refetch(); }
  catch (error) { await sweetErrorHandling(error); }
 };
 const reactivate = async (brand: Brand) => {
  try { await updateBrand({ variables: { input: { _id: brand._id, brandStatus: BrandStatus.ACTIVE } } }); await refetch(); }
  catch (error) { await sweetErrorHandling(error); }
 };
 return <Box component="div" className="content">
  <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}><Typography variant="h4">{t("Brands")}</Typography><Button variant="contained" onClick={() => edit(null)}>{t("Add brand")}</Button></Stack>
  {loading && <CircularProgress />}
  {error && <Alert severity="error">{t("Brands could not be loaded.")}</Alert>}
  <Table><TableHead><TableRow><TableCell>{t("Logo")}</TableCell><TableCell>{t("Name")}</TableCell><TableCell>{t("Status")}</TableCell><TableCell>{t("Actions")}</TableCell></TableRow></TableHead>
   <TableBody>{data?.getAllBrandsByAdmin.map(brand => <TableRow key={brand._id}>
    <TableCell><img src={imageUrl(brand.brandLogo)} alt={brand.brandName} width={50} height={40} style={{ objectFit: 'contain' }} /></TableCell>
    <TableCell>{brand.brandName}</TableCell><TableCell>{brand.brandStatus}</TableCell>
    <TableCell><Button disabled={busy} onClick={() => edit(brand)}>{t("Edit")}</Button>
     {brand.brandStatus === BrandStatus.ACTIVE ? <Button disabled={busy} onClick={() => deactivate(brand)}>{t("Deactivate")}</Button> :
      <Button disabled={busy} onClick={() => reactivate(brand)}>{t("Reactivate")}</Button>}
    </TableCell>
   </TableRow>)}</TableBody>
  </Table>
  {!loading && !error && !data?.getAllBrandsByAdmin.length && <Alert severity="info">{t("Add a brand before agents can create cars.")}</Alert>}
  <Dialog open={open} onClose={() => { if (!busy) setOpen(false); }} fullWidth>
   <form onSubmit={save}><DialogTitle>{t(editing ? 'Edit brand' : 'Add brand')}</DialogTitle>
    <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
     <TextField required label={t("Brand name")} value={draft.brandName} inputProps={{ maxLength: 60 }} onChange={e => setDraft({ ...draft, brandName: e.target.value })} />
     <TextField required label={t("Logo URL or uploaded path")} value={draft.brandLogo} inputProps={{ maxLength: 300 }} onChange={e => setDraft({ ...draft, brandLogo: e.target.value })} />
    </Stack></DialogContent>
    <DialogActions><Button disabled={busy} onClick={() => setOpen(false)}>{t("Cancel")}</Button><Button type="submit" disabled={busy}>{t("Save")}</Button></DialogActions>
   </form>
  </Dialog>
 </Box>;
}
export default withAdminLayout(AdminBrands);
