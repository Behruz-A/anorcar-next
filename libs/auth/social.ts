import { print } from 'graphql';
import { START_GOOGLE_LOGIN, COMPLETE_GOOGLE_LOGIN, START_KAKAO_LOGIN, COMPLETE_KAKAO_LOGIN } from '../../apollo/user/mutation';
import { REACT_APP_API_GRAPHQL_URL } from '../config';
import { updateStorage, updateUserInfo } from './index';
import { prepareSessionChange } from './session';

export type SocialProvider = 'google' | 'kakao';
const providers = {
 google: { name: 'Google', origin: 'https://accounts.google.com', start: START_GOOGLE_LOGIN, complete: COMPLETE_GOOGLE_LOGIN },
 kakao: { name: 'Kakao', origin: 'https://kauth.kakao.com', start: START_KAKAO_LOGIN, complete: COMPLETE_KAKAO_LOGIN },
};
export const socialLoginError = (provider: SocialProvider) => `${providers[provider].name} sign-in could not be completed. Please try again.`;

async function socialRequest(provider: SocialProvider, operation: 'start' | 'complete', variables: Record<string, unknown>) {
 const controller = new AbortController();
 const timer = setTimeout(() => controller.abort(), 15000);
 const settings = providers[provider];
 try {
  const response = await fetch(REACT_APP_API_GRAPHQL_URL, {
   method: 'POST', credentials: 'include', signal: controller.signal,
   headers: { 'Content-Type': 'application/json', 'X-Anorcar-Client': 'web' },
   body: JSON.stringify({
    operationName: `${operation === 'start' ? 'Start' : 'Complete'}${settings.name}Login`,
    query: print(settings[operation]), variables,
   }),
  });
  const result: { data?: Record<string, unknown>; errors?: unknown[] } = await response.json();
  if (!response.ok || result.errors?.length || !result.data) throw new Error(socialLoginError(provider));
  return result.data[`${operation}${settings.name}Login`];
 } finally {
  clearTimeout(timer);
 }
}

export async function startSocialLogin(provider: SocialProvider, locale?: string, referrer?: string): Promise<string> {
 const result = await socialRequest(provider, 'start', { input: { origin: window.location.origin, locale: locale ?? 'en', referrer } });
 if (typeof result !== 'string') throw new Error(socialLoginError(provider));
 const url = new URL(result);
 if (url.origin !== providers[provider].origin || url.username || url.password) throw new Error(socialLoginError(provider));
 return url.href;
}

export async function completeSocialLogin(provider: SocialProvider, code: string): Promise<string> {
 if (!/^[\w-]{43}$/.test(code)) throw new Error(socialLoginError(provider));
 await prepareSessionChange();
 const result = await socialRequest(provider, 'complete', { code }) as { accessToken?: unknown; returnTo?: unknown } | undefined;
 if (typeof result?.accessToken !== 'string' || !result.accessToken) throw new Error(socialLoginError(provider));
 updateUserInfo(result.accessToken);
 updateStorage({ jwtToken: result.accessToken });
 const returnTo = result.returnTo;
 return typeof returnTo === 'string' && /^\/(?!\/)/.test(returnTo) && !/[\\\u0000-\u0020]/.test(returnTo) &&
  !/^\/(?:en\/|kr\/|ru\/)?account\/(?:join|google-callback|kakao-callback)(?:[/?#]|$)/.test(returnTo) ? returnTo : '/';
}
