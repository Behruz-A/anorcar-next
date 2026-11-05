import { completeSocialLogin, startSocialLogin } from './social';

export const startGoogleLogin = (locale?: string, referrer?: string) => startSocialLogin('google', locale, referrer);
export const completeGoogleLogin = (code: string) => completeSocialLogin('google', code);
