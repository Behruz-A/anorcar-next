// Read-only local OAuth configuration/redirect checks; no Google account or token exchange.
const assert = require('node:assert/strict');
const endpoint = process.env.GOOGLE_QA_API || 'http://localhost:3007/graphql';
const origin = process.env.GOOGLE_QA_ORIGIN || 'http://localhost:3000';
async function start(input, headers = {}) {
 const response = await fetch(endpoint, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, 'X-Anorcar-Client': 'web', ...headers },
  body: JSON.stringify({ query: 'mutation($input:GoogleLoginInput!){startGoogleLogin(input:$input)}', variables: { input } }),
 });
 return { response, result: await response.json() };
}
(async () => {
 const { response, result } = await start({ origin, locale: 'en', referrer: '/car' });
 assert.ok(result.data?.startGoogleLogin, 'Google start must return an authorization URL');
 const url = new URL(result.data.startGoogleLogin);
 assert.equal(url.origin, 'https://accounts.google.com');
 assert.equal(url.searchParams.get('redirect_uri'), new URL('/auth/google/callback', endpoint).href);
 assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
 assert.equal(url.searchParams.get('response_type'), 'code');
 assert.ok(url.searchParams.get('nonce'));
 assert.ok(url.searchParams.get('state'));
 assert.ok(url.searchParams.get('scope').includes('openid'));
 assert.equal(url.searchParams.has('client_secret'), false);
 const flowCookie = response.headers.getSetCookie().find(value => value.startsWith('anorcar_google_flow='));
 assert.ok(flowCookie && /HttpOnly/i.test(flowCookie) && /SameSite=Lax/i.test(flowCookie));
 const denied = await start({ origin: 'https://untrusted.example' });
 assert.ok(denied.result.errors?.length);
 const callback = await fetch(new URL('/auth/google/callback?state=invalid&code=invalid', endpoint), { redirect: 'manual' });
 assert.equal(callback.status, 303);
 assert.equal(callback.headers.get('location'), origin + '/account/join?google=error');
 assert.equal(callback.headers.get('cache-control'), 'no-store');
 console.log('PASS live local GraphQL start, PKCE/nonce/state, HttpOnly cookie, untrusted origin and invalid callback; no account writes.');
 if (process.env.GOOGLE_QA_PROVIDER === '1') {
  const provider = await fetch(url, { signal: AbortSignal.timeout(15000) });
  assert.ok(provider.ok, 'Google authorization page must load');
  assert.equal(new URL(provider.url).pathname.includes('/oauth/error'), false, 'Google rejected OAuth configuration');
  console.log('PASS Google authorization page accepted configuration; no account selection, consent or token exchange.');
 }
})().catch(error => { console.error(error instanceof assert.AssertionError ? error.message : 'OAuth check could not complete'); process.exitCode = 1; });
