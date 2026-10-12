import decodeJWT from 'jwt-decode';
import { print } from 'graphql';
import { REFRESH_ACCESS_TOKEN, LOGOUT } from '../../apollo/user/mutation';
import { REACT_APP_API_GRAPHQL_URL } from '../config';
import { CustomJwtPayload } from '../types/customJwtPayload';
import { MemberType } from '../enums/member.enum';
import { clearUserSession, getJwtToken, setJwtToken, updateUserInfo } from './index';

export class SessionExpiredError extends Error {
	constructor() {
		super('Session expired. Please log in again.');
		this.name = 'SessionExpiredError';
	}
}
export class SessionChangedError extends Error {
	constructor() {
		super('Session changed');
		this.name = 'SessionChangedError';
	}
}
let refreshPromise: Promise<string> | null = null;
let sessionVersion = 0;

export function isAccessTokenCurrent(token: string = getJwtToken()): boolean {
	if (!token) return false;
	try {
		const claims = decodeJWT<CustomJwtPayload>(token);
		const now = Date.now() / 1000;
		return Boolean(
			claims._id &&
				Object.values(MemberType).includes(claims.memberType as MemberType) &&
				claims.exp &&
				claims.exp > now + 10 &&
				(!claims.iat || claims.iat + 900 > now + 10),
		);
	} catch {
		return false;
	}
}

async function sessionRequest(operation: 'refresh' | 'logout'): Promise<{ accessToken?: string; logout?: boolean }> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 10000);
	try {
		const response = await fetch(REACT_APP_API_GRAPHQL_URL, {
			method: 'POST',
			credentials: 'include',
			signal: controller.signal,
			headers: { 'Content-Type': 'application/json', 'X-Anorcar-Client': 'web' },
			body: JSON.stringify({
				query: print(operation === 'refresh' ? REFRESH_ACCESS_TOKEN : LOGOUT),
				operationName: operation === 'refresh' ? 'RefreshAccessToken' : 'Logout',
			}),
		});
		const result: {
			data?: { refreshAccessToken?: { accessToken: string }; logout?: boolean };
			errors?: { message: string; extensions?: { code?: string } }[];
		} = await response.json();
		if (
			response.status === 401 ||
			result.errors?.some(
				(error) => error.message === 'REFRESH_SESSION_EXPIRED' || error.extensions?.code === 'UNAUTHENTICATED',
			)
		)
			throw new SessionExpiredError();
		if (!response.ok || result.errors?.length) throw new Error('Authentication service is unavailable');
		return operation === 'refresh' ? result.data?.refreshAccessToken ?? {} : { logout: result.data?.logout };
	} finally {
		clearTimeout(timer);
	}
}

async function withSessionLock<T>(work: () => Promise<T>): Promise<T> {
	const locks =
		typeof navigator === 'undefined'
			? undefined
			: (navigator as Navigator & { locks?: { request<R>(name: string, callback: () => Promise<R>): Promise<R> } })
					.locks;
	if (locks) return locks.request('anorcar-auth-session', work);
	return work();
}

export function refreshAccessToken(force = false): Promise<string> {
	if (refreshPromise) return refreshPromise;
	const version = sessionVersion;
	const previous = getJwtToken();
	refreshPromise = withSessionLock(async () => {
		if (typeof window === 'undefined' || localStorage.getItem('logoutPending')) throw new SessionExpiredError();
		const current = getJwtToken();
		// Another tab may already have refreshed while this tab waited for the lock.
		if (isAccessTokenCurrent(current) && (!force || current !== previous)) return current;
		try {
			const result = await sessionRequest('refresh');
			if (version !== sessionVersion || localStorage.getItem('logoutPending')) throw new SessionChangedError();
			if (!result.accessToken || !isAccessTokenCurrent(result.accessToken))
				throw new Error('Invalid refreshed access token');
			setJwtToken(result.accessToken);
			localStorage.setItem('authSession', 'cookie');
			updateUserInfo(result.accessToken);
			return result.accessToken;
		} catch (error) {
			if (error instanceof SessionExpiredError && version === sessionVersion) clearUserSession();
			throw error;
		}
	}).finally(() => {
		refreshPromise = null;
	});
	return refreshPromise;
}

export async function getValidJwtToken(): Promise<string> {
	const token = getJwtToken();
	return isAccessTokenCurrent(token) ? token : refreshAccessToken();
}

export async function prepareSessionChange(): Promise<void> {
	sessionVersion++;
	await refreshPromise?.catch(() => undefined);
}

export async function revokeRefreshSession(): Promise<void> {
	await withSessionLock(async () => {
		const result = await sessionRequest('logout');
		if (!result.logout) throw new Error('Logout was not confirmed');
		localStorage.removeItem('logoutPending');
	});
}
