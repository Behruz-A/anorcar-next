import { Button } from '@mui/material';
import { FcGoogle } from 'react-icons/fc';
import { RiKakaoTalkFill } from 'react-icons/ri';
import { useTranslation } from 'next-i18next';

interface SocialLoginButtonsProps {
 disabled: boolean;
 onGoogleLogin: () => void;
}

const SocialLoginButtons = ({ disabled, onGoogleLogin }: SocialLoginButtonsProps) => {
 const { t } = useTranslation('common');

 return (
  <div className="auth-social" aria-describedby="auth-social-notice">
   <div className="auth-separator"><span>{t('or continue with')}</span></div>
   <Button className="auth-social-button auth-google" variant="outlined" disabled={disabled} onClick={onGoogleLogin} startIcon={<FcGoogle aria-hidden="true" />}>
    {t('Continue with Google')}
   </Button>
   <Button className="auth-social-button auth-kakao" variant="contained" disabled startIcon={<RiKakaoTalkFill aria-hidden="true" />}>
    {t('Continue with Kakao')}
   </Button>
   <p id="auth-social-notice" className="auth-social-notice">{t('Kakao sign-in coming soon.')}</p>
  </div>
 );
};

export default SocialLoginButtons;
