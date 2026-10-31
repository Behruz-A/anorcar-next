import { print } from 'graphql';
import { START_GOOGLE_LOGIN, COMPLETE_GOOGLE_LOGIN } from '../../apollo/user/mutation';
import { REACT_APP_API_GRAPHQL_URL } from '../config';
import { updateStorage, updateUserInfo } from './index';
import { prepareSessionChange } from './session';

const errorMessage = 'Google sign-in could not be completed. Please try again.';

async function googleRequest(operation: 'start' | 'complete', variables: Record<string, unknown>) {
 const controller = new AbortController();
 const timer = setTimeout(() => controller.abort(), 15000);
 try {
  const response = await fetch(REACT_APP_API_GRAPHQL_URL, {
   method: 'POST', credentials: 'include', signal: controller.signal,
   headers: { 'Content-Type': 'application/json', 'X-Anorcar-Client': 'web' },
   body: JSON.stringify({
    operationName: operation === 'start' ? 'StartGoogleLogin' : 'CompleteGoogleLogin',
    query: print(operation === 'start' ? START_GOOGLE_LOGIN : COMPLETE_GOOGLE_LOGIN), variables,
   }),
  });
  const result: { data?: { startGoogleLogin?: string; completeGoogleLogin?: { accessToken: string; returnTo: string } }; errors?: unknown[] } = await response.json();
  if (!response.ok || result.errors?.length || !result.data) throw new Error(errorMessage);
  return result.data;
 } finally {
  clearTimeout(timer);
 }
}

export async function startGoogleLogin(locale?: string, referrer?: string): Promise<string> {
 const result = await googleRequest('start', { input: { origin: window.location.origin, locale: locale ?? 'en', referrer } });
 if (!result.startGoogleLogin) throw new Error(errorMessage);
 const url = new URL(result.startGoogleLogin);
 if (url.origin !== 'https://accounts.google.com') throw new Error(errorMessage);
 return url.href;
}

export async function completeGoogleLogin(code: string): Promise<string> {
 await prepareSessionChange();
 const result = (await googleRequest('complete', { code })).completeGoogleLogin;
 if (!result?.accessToken) throw new Error(errorMessage);
 updateUserInfo(result.accessToken);
 updateStorage({ jwtToken: result.accessToken });
 const returnTo = result.returnTo;
 return typeof returnTo === 'string' && /^\/(?!\/)/.test(returnTo) && !/[\\\u0000-\u0020]/.test(returnTo) &&
  !/^\/(?:en\/|kr\/|ru\/)?account\/(?:join|google-callback)(?:[/?#]|$)/.test(returnTo) ? returnTo : '/';
}
