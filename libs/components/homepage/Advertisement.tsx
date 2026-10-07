import React from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
export default function Advertisement() {
 const { t } = useTranslation('common');
 return <Stack className="video-frame car-advertisement" spacing={2} sx={{ p: 4, alignItems: 'center', justifyContent: 'center', color: 'white', background: "#16232e url('/img/car/hero.svg') center / cover" }}>
  <Typography variant="h4">{t('Find your next car')}</Typography>
  <Link href="/car"><Button variant="contained">{t('Browse cars')}</Button></Link>
 </Stack>;
}
