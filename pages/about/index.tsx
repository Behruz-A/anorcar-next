import React from 'react';
import { Stack, Typography, Button } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
export const getStaticProps = async ({ locale }: any) => ({ props: { ...(await serverSideTranslations(locale, ['common'])) } });
function About() {
 const { t } = useTranslation('common');
 return <Stack className="car-about" spacing={3}>
  <Typography variant="h3">{t('About ANORCAR')}</Typography>
  <Typography>{t('Find your next car and connect with sellers across South Korea.')}</Typography>
  <img src="/img/car/hero.svg" alt={t('Cars')} style={{ width: '100%', borderRadius: 16 }} />
  <Typography variant="h5">{t('Browse cars your way')}</Typography>
  <Typography>{t('Search by brand, model, year, fuel, transmission, condition, location, and price.')}</Typography>
  <Typography variant="h5">{t('Manage your listings')}</Typography>
  <Typography>{t('Seller accounts can publish cars, upload photos, and manage their inventory.')}</Typography>
  <Typography variant="h5">{t('Stay connected')}</Typography>
  <Typography>{t('Save favorites, revisit cars, follow members, and join the community.')}</Typography>
  <Link href="/car"><Button variant="contained">{t('Browse cars')}</Button></Link>
 </Stack>;
}
export default withLayoutBasic(About);
