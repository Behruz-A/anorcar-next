// Real frontend session coordinator, isolated storage/fetch/Web Locks; no live accounts.
const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');
const ts = require('typescript');
const decodeJWT = require('jwt-decode');
const { print } = require('graphql');
const { gql } = require('@apollo/client');
const token = (patch = {}) =>
	[
		'header',
		Buffer.from(
			JSON.stringify({
				_id: '507f1f77bcf86cd799439011',
				memberType: 'USER',
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 900,
				...patch,
			}),
		).toString('base64url'),
		'signature',
	].join('.');
const fresh = token(),
	expired = token({ exp: 1 });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const source = ts.transpileModule(fs.readFileSync('libs/auth/session.ts', 'utf8'), {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, esModuleInterop: true },
}).outputText;
let mutex = Promise.resolve();
const locks = {
	request(_name, task) {
		const result = mutex.then(task);
		mutex = result.catch(() => {});
		return result;
	},
};
function createSession(values = new Map([['accessToken', expired]])) {
	const storage = {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, value),
		removeItem: (key) => values.delete(key),
	};
	const state = { calls: [], updates: 0, clears: 0, mode: 'success', release: null };
	const context = {
		exports: {},
		window: {},
		localStorage: storage,
		navigator: { locks },
		AbortController,
		setTimeout,
		clearTimeout,
		Date,
		console,
		async fetch(url, options) {
			state.calls.push({ url, ...options, body: JSON.parse(options.body) });
			if (state.release) await state.release;
			await delay(10);
			if (state.mode === 'network') throw new TypeError('Offline');
			if (JSON.parse(options.body).operationName === 'Logout')
				return { ok: true, status: 200, json: async () => ({ data: { logout: true } }) };
			if (state.mode === 'expired')
				return { ok: true, status: 200, json: async () => ({ errors: [{ message: 'REFRESH_SESSION_EXPIRED' }] }) };
			return { ok: true, status: 200, json: async () => ({ data: { refreshAccessToken: { accessToken: fresh } } }) };
		},
		require(name) {
			if (name === '../firebase/client') return { endChatFirebaseSession: async () => {} };
			const modules = {
				'jwt-decode': decodeJWT,
				graphql: { print },
				'../../apollo/user/mutation': {
					REFRESH_ACCESS_TOKEN: gql`
						mutation RefreshAccessToken {
							refreshAccessToken {
								accessToken
							}
						}
					`,
					LOGOUT: gql`
						mutation Logout {
							logout
						}
					`,
				},
				'../config': { REACT_APP_API_GRAPHQL_URL: 'http://localhost:3007/graphql' },
				'../enums/member.enum': { MemberType: { USER: 'USER', AGENT: 'AGENT', ADMIN: 'ADMIN' } },
				'./index': {
					getJwtToken: () => storage.getItem('accessToken') ?? '',
					setJwtToken: (value) => storage.setItem('accessToken', value),
					updateUserInfo: () => {
						state.updates++;
					},
					clearUserSession: () => {
						state.clears++;
						storage.removeItem('accessToken');
					},
				},
			};
			if (!(name in modules)) throw Error('Unexpected session dependency ' + name);
			return modules[name];
		},
	};
	vm.runInNewContext(source, context, { filename: 'libs/auth/session.ts' });
	return { api: context.exports, state, storage };
}
(async () => {
	const session = createSession();
	assert.equal(session.api.isAccessTokenCurrent(expired), false);
	assert.equal(session.api.isAccessTokenCurrent(fresh), true);
	assert.equal(
		session.api.isAccessTokenCurrent(
			token({ iat: Math.floor(Date.now() / 1000) - 1000, exp: Math.floor(Date.now() / 1000) + 30000 }),
		),
		false,
		'legacy access age capped',
	);
	assert.deepEqual(
		await Promise.all(Array.from({ length: 8 }, () => session.api.refreshAccessToken())),
		Array(8).fill(fresh),
	);
	assert.equal(session.state.calls.length, 1, 'concurrent refresh shared');
	assert.equal(session.state.updates, 1);
	const request = session.state.calls[0];
	assert.equal(request.credentials, 'include');
	assert.equal(request.headers['X-Anorcar-Client'], 'web');
	assert.equal(request.body.operationName, 'RefreshAccessToken');
	assert.ok(!request.body.query.includes('refreshToken'));
	await session.api.getValidJwtToken();
	assert.equal(session.state.calls.length, 1, 'fresh token does not refresh');
	session.storage.setItem('accessToken', expired);
	session.state.mode = 'network';
	await assert.rejects(session.api.refreshAccessToken(), /Offline/);
	assert.equal(session.storage.getItem('accessToken'), expired);
	assert.equal(session.state.clears, 0, 'offline does not log out');
	session.state.mode = 'success';
	await session.api.refreshAccessToken();
	assert.equal(session.storage.getItem('accessToken'), fresh, 'retry succeeds');
	session.storage.setItem('accessToken', expired);
	session.state.mode = 'expired';
	await assert.rejects(session.api.refreshAccessToken(), (error) => error.name === 'SessionExpiredError');
	assert.equal(session.storage.getItem('accessToken'), null);
	const race = createSession();
	let release;
	race.state.release = new Promise((resolve) => {
		release = resolve;
	});
	const renewing = race.api.refreshAccessToken();
	await delay(5);
	const changing = race.api.prepareSessionChange();
	release();
	await assert.rejects(renewing, (error) => error.name === 'SessionChangedError');
	await changing;
	assert.equal(race.state.updates, 0, 'late refresh cannot restore replaced session');
	race.storage.setItem('logoutPending', '1');
	const calls = race.state.calls.length;
	await assert.rejects(race.api.refreshAccessToken(), (error) => error.name === 'SessionExpiredError');
	assert.equal(race.state.calls.length, calls, 'pending logout never refreshes');
	race.state.release = null;
	await race.api.revokeRefreshSession();
	assert.equal(race.storage.getItem('logoutPending'), null);
	assert.equal(race.state.calls.at(-1).body.operationName, 'Logout');
	const shared = new Map([['accessToken', expired]]),
		one = createSession(shared),
		two = createSession(shared);
	await Promise.all([one.api.refreshAccessToken(), two.api.refreshAccessToken()]);
	assert.equal(one.state.calls.length + two.state.calls.length, 1, 'cross-tab Web Lock prevents cookie replay');
	console.log(
		'Auth session checks passed: 15m access age, single refresh, credentials, cross-tab lock, offline retry, expiry, logout and stale-response protection.',
	);
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
