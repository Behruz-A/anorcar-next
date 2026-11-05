// Actual social auth helper with isolated transport/session fixtures; no live accounts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { print } = require('graphql');
const { gql } = require('@apollo/client');
const mutations = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('apollo/user/mutation.ts', 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: mutations, require: () => ({ gql }) });

const api = {};
let calls = [], prepared = 0, stored = null, user = null, payload, status = 200;
vm.runInNewContext(ts.transpileModule(fs.readFileSync('libs/auth/social.ts', 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, {
 exports: api, URL, AbortController, setTimeout, clearTimeout, window: { location: { origin: 'http://localhost:3000' } },
 fetch: async (url, options) => {
  calls.push({ url, ...options, body: JSON.parse(options.body) });
  return { ok: status === 200, json: async () => payload };
 },
 require: name => {
  if (name === 'graphql') return { print };
  if (name.includes('mutation')) return mutations;
  if (name === '../config') return { REACT_APP_API_GRAPHQL_URL: 'http://localhost:3007/graphql' };
  if (name === './index') return { updateUserInfo: token => { user = token; }, updateStorage: value => { stored = value; } };
  if (name === './session') return { prepareSessionChange: async () => { prepared++; } };
  throw new Error('Unexpected import: ' + name);
 },
});

(async () => {
 for (const provider of ['google', 'kakao']) {
  const name = provider[0].toUpperCase() + provider.slice(1);
  const origin = provider === 'google' ? 'https://accounts.google.com' : 'https://kauth.kakao.com';
  payload = { data: { ['start' + name + 'Login']: origin + '/oauth/authorize' } };
  assert.equal(await api.startSocialLogin(provider, 'ru', '/ru/car'), origin + '/oauth/authorize');
  const request = calls.at(-1);
  assert.equal(request.credentials, 'include');
  assert.equal(request.headers['X-Anorcar-Client'], 'web');
  assert.equal(request.body.operationName, 'Start' + name + 'Login');
  assert.equal(request.body.variables.input.origin, 'http://localhost:3000');
  assert.equal(request.body.variables.input.locale, 'ru');
  assert.equal(request.body.variables.input.referrer, '/ru/car');
  for (const bad of ['https://evil.test', origin.replace('https:', 'http:'), origin + '.evil.test', origin.replace('https://', 'https://user@')]) {
   payload = { data: { ['start' + name + 'Login']: bad } };
   await assert.rejects(api.startSocialLogin(provider));
  }
  for (const returnTo of ['/ru/car?sort=price', '//evil.test', '/\\evil.test', '/kr/account/google-callback', '/ru/account/kakao-callback', '/account/join', '/bad\npath']) {
   payload = { data: { ['complete' + name + 'Login']: { accessToken: 'fixture-token', returnTo } } };
   assert.equal(await api.completeSocialLogin(provider, 'g'.repeat(43)), returnTo === '/ru/car?sort=price' ? returnTo : '/');
   assert.equal(stored.jwtToken, 'fixture-token');
   assert.equal(user, 'fixture-token');
   assert.equal(calls.at(-1).body.operationName, 'Complete' + name + 'Login');
  }
  const before = calls.length;
  await assert.rejects(api.completeSocialLogin(provider, 'invalid-code'));
  assert.equal(calls.length, before, 'invalid ticket must not trigger exchange');
  for (const failure of [{ errors: [{ message: 'private-provider-error' }] }, { data: {} }, { data: { ['complete' + name + 'Login']: { accessToken: null } } }]) {
   stored = user = null;
   payload = failure;
   await assert.rejects(api.completeSocialLogin(provider, 'g'.repeat(43)), error => !error.message.includes('private-provider-error'));
   assert.equal(stored, null);
   assert.equal(user, null);
  }
  status = 503;
  await assert.rejects(api.startSocialLogin(provider));
  status = 200;
  console.log('PASS ' + name + ' transport, provider URL, local redirects, invalid tickets, session storage and sanitized failures.');
 }
 assert.ok(prepared > 0);
})().catch(error => { console.error(error); process.exitCode = 1; });
