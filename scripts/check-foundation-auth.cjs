const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');
const decodeJWT = require('jwt-decode');

// Exercise the real auth helpers with isolated storage and Apollo responses.
// No accounts, tokens, or database records are created on the live backend.
module.exports = async function checkAuth() {
 const claims = { _id: '0123456789abcdef01234567', memberType: 'AGENT', memberStatus: 'ACTIVE',
  memberAuthType: 'PHONE', memberNick: 'testagent', memberPhone: '01000000000', memberCars: 3,
  memberFollowers: 2, memberFollowings: 1, memberComments: 4, exp: Math.floor(Date.now() / 1000) + 3600 };
 const token = value => ['header', Buffer.from(JSON.stringify(value)).toString('base64url'), 'signature'].join('.');
 const values = new Map();
 const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
 const reactive = initial => {
  let value = initial;
  return function(next) { if (arguments.length) value = next; return value; };
 };
 const userVar = reactive({ _id: '', memberCars: 0 });
 const authReadyVar = reactive(false);
 let reloads = 0, mutationCalls = 0, response, failure, resolveQuery;
 const client = {
  async mutate(request) { mutationCalls++; if (failure) throw failure; return response ?? { data: { [request.mutation]: { accessToken: token(claims) } } }; },
  query() { return new Promise(resolve => { resolveQuery = resolve; }); },
 };
 const Message = require('../libs/enums/common.enum.ts').Message;
 const MemberType = require('../libs/enums/member.enum.ts').MemberType;
 const filename = path.join(__dirname, '../libs/auth/index.ts');
 const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, esModuleInterop: true },
 }).outputText;
 const context = { exports: {}, localStorage: storage, window: { localStorage: storage, location: { reload() { reloads++; } } },
  console: { log() {}, warn() {} }, require(name) {
   const modules = { 'jwt-decode': decodeJWT, '../../apollo/client': { initializeApollo: () => client },
    '../../apollo/store': { userVar, authReadyVar }, '../enums/common.enum': { Message }, '../enums/member.enum': { MemberType },
    '../../apollo/user/mutation': { LOGIN: 'login', SIGN_UP: 'signup' }, '../../apollo/user/query': { GET_MEMBER: 'getMember' } };
   if (!(name in modules)) throw new Error('Unexpected auth dependency: ' + name);
   return modules[name];
  } };
 vm.runInNewContext(source, context, { filename });
 const auth = context.exports;

 auth.hydrateUser();
 assert.equal(authReadyVar(), true);
 assert.equal(userVar()._id, '');
 for (const role of ['USER', 'AGENT', 'ADMIN']) {
  authReadyVar(false); storage.setItem('accessToken', token({ ...claims, memberType: role })); auth.hydrateUser();
  assert.equal(userVar().memberType, role);
  assert.equal(userVar().memberCars, 3);
  assert.equal(userVar().memberFollowers, 2);
  assert.equal(userVar().memberComments, 4);
 }
 const previous = userVar();
 storage.setItem('accessToken', 'malformed'); auth.hydrateUser();
 assert.equal(userVar(), previous, 'Hydration runs once across multiple layouts');
 for (const value of ['malformed', token({ ...claims, exp: 1 }), token({ ...claims, memberType: 'SELLER' })]) {
  authReadyVar(false); storage.setItem('accessToken', value); auth.hydrateUser();
  assert.equal(storage.getItem('accessToken'), null);
  assert.equal(userVar()._id, '');
  assert.equal(userVar().memberCars, 0);
  assert.equal(authReadyVar(), true);
 }
 const browserWindow = context.window;
 delete context.window; authReadyVar(false); auth.hydrateUser();
 assert.equal(authReadyVar(), false, 'SSR does not access browser storage'); context.window = browserWindow;

 for (const message of [Message.WRONG_PASSWORD, Message.BLOCKED_USER, Message.NO_MEMBER_NICK]) {
  failure = { graphQLErrors: [{ message }] };
  await assert.rejects(auth.logIn('testagent', 'invalid'), error => error.message === message);
 }
 failure = { graphQLErrors: [{ message: Message.USED_MEMBER_NICK_OR_PHONE }] };
 await assert.rejects(auth.signUp('testagent', 'invalid', '01000000000', 'AGENT'), error => error.message === Message.USED_MEMBER_NICK_OR_PHONE);
 failure = new Error('Network unavailable');
 await assert.rejects(auth.signUp('testagent', 'invalid', '01000000000', 'USER'), /Network unavailable/);
 assert.equal(reloads, 0, 'Failed auth stays on the form so errors can be shown');
 failure = undefined;
 const before = mutationCalls;
 for (const role of ['ADMIN', 'SELLER', 'DEALER']) {
  await assert.rejects(auth.signUp('testagent', 'invalid', '01000000000', role), error => error.message === Message.ONLY_SPECIFIC_ROLES_ALLOWED);
 }
 assert.equal(mutationCalls, before, 'Signup only submits USER or AGENT');
 response = { data: { login: {} } };
 await assert.rejects(auth.logIn('testagent', 'invalid'), error => error.message === Message.TOKEN_NOT_EXIST);
 response = undefined;
 await auth.logIn('testagent', 'valid');
 assert.equal(storage.getItem('accessToken'), token(claims));
 assert.equal(userVar().memberType, 'AGENT');
 await auth.signUp('testagent', 'valid', '01000000000', 'AGENT');
 assert.equal(userVar().memberCars, 3);

 const refresh = auth.refreshMemberCars();
 resolveQuery({ data: { getMember: { memberCars: 7 } } }); await refresh;
 assert.equal(userVar().memberCars, 7);
 const stale = auth.refreshMemberCars();
 userVar({ ...userVar(), _id: 'another-member', memberCars: 1 });
 resolveQuery({ data: { getMember: { memberCars: 99 } } }); await stale;
 assert.equal(userVar().memberCars, 1, 'Late requests do not update another session');
 auth.logOut();
 assert.equal(storage.getItem('accessToken'), null);
 assert.equal(userVar()._id, '');
 assert.equal(reloads, 1);
 console.log('Auth checks passed: guest/USER/AGENT/ADMIN hydration, expiry, errors, signup roles, counters, stale responses, and logout.');
};
