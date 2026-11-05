import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { completeSocialLogin, socialLoginError, SocialProvider } from '../../auth/social';

const SocialCallback = ({ provider }: { provider: SocialProvider }) => {
 const router = useRouter();
 const { t } = useTranslation('common');
 const started = useRef(false);
 const [error, setError] = useState(false);

 useEffect(() => {
  if (!router.isReady || started.current) return;
  started.current = true;
  const code = new URLSearchParams(window.location.hash.slice(1)).get('code');
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  if (!code || !/^[\w-]{43}$/.test(code)) {
   setError(true);
   return;
  }
  void completeSocialLogin(provider, code).then(destination => {
   window.location.replace(destination);
  }).catch(() => setError(true));
 }, [router.isReady, provider]);

 return (
  <Box component="main" sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 3, bgcolor: '#f8f9fc', color: '#0b1f33' }}>
   <Box sx={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
    {error ? <>
     <Alert severity="error" sx={{ mb: 2 }}>{t(socialLoginError(provider))}</Alert>
     <Link href="/account/join">{t('Back to log in')}</Link>
    </> : <>
     <CircularProgress aria-label={t('Signing you in...')} />
     <Typography role="status" sx={{ mt: 2 }}>{t('Signing you in...')}</Typography>
    </>}
   </Box>
  </Box>
 );
};

export default SocialCallback;
