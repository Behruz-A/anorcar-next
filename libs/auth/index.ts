import decodeJWT from 'jwt-decode';
import { initializeApollo } from '../../apollo/client';
import { userVar, authReadyVar } from '../../apollo/store';
import { CustomJwtPayload } from '../types/customJwtPayload';
import { Message } from '../enums/common.enum';
import { MemberType } from '../enums/member.enum';
import { LOGIN, SIGN_UP } from '../../apollo/user/mutation';
import { GET_MEMBER } from '../../apollo/user/query';
import {
	isAccessTokenCurrent,
	prepareSessionChange,
	refreshAccessToken,
	revokeRefreshSession,
	SessionExpiredError,
} from './session';
export { getValidJwtToken } from './session';

export function getJwtToken(): string {
	if (typeof window !== 'undefined') {
		return localStorage.getItem('accessToken') ?? '';
	}
	return '';
}

export function setJwtToken(token: string) {
	localStorage.setItem('accessToken', token);
	window.dispatchEvent?.(new Event('anorcar:auth-changed'));
}

export const logIn = async (nick: string, password: string): Promise<void> => {
	try {
		await prepareSessionChange();
		const { jwtToken } = await requestJwtToken({ nick, password });

		if (jwtToken) {
			updateStorage({ jwtToken });
			updateUserInfo(jwtToken);
		}
	} catch (err) {
		console.warn('login err', err);
		throw err;
	}
};

const requestJwtToken = async ({
	nick,
	password,
}: {
	nick: string;
	password: string;
}): Promise<{ jwtToken: string }> => {
	const apolloClient = await initializeApollo();

	try {
		const result = await apolloClient.mutate({
			mutation: LOGIN,
			variables: { input: { memberNick: nick, memberPassword: password } },
			fetchPolicy: 'network-only',
		});

		console.log('---------- login ----------');
		const { accessToken } = result?.data?.login;
		if (!accessToken) throw new Error(Message.TOKEN_NOT_EXIST);

		return { jwtToken: accessToken };
	} catch (err: any) {
		console.log('request token err', err.graphQLErrors);
		throw new Error(err.graphQLErrors?.[0]?.message ?? err.message ?? Message.SOMETHING_WENT_WRONG);
	}
};

export const signUp = async (nick: string, password: string, phone: string, type: string): Promise<void> => {
	try {
		await prepareSessionChange();
		const { jwtToken } = await requestSignUpJwtToken({ nick, password, phone, type });

		if (jwtToken) {
			updateStorage({ jwtToken });
			updateUserInfo(jwtToken);
		}
	} catch (err) {
		console.warn('login err', err);
		throw err;
	}
};

const requestSignUpJwtToken = async ({
	nick,
	password,
	phone,
	type,
}: {
	nick: string;
	password: string;
	phone: string;
	type: string;
}): Promise<{ jwtToken: string }> => {
	if (type !== MemberType.USER && type !== MemberType.AGENT) throw new Error(Message.ONLY_SPECIFIC_ROLES_ALLOWED);
	const apolloClient = await initializeApollo();

	try {
		const result = await apolloClient.mutate({
			mutation: SIGN_UP,
			variables: {
				input: { memberNick: nick, memberPassword: password, memberPhone: phone, memberType: type },
			},
			fetchPolicy: 'network-only',
		});

		console.log('---------- login ----------');
		const { accessToken } = result?.data?.signup;
		if (!accessToken) throw new Error(Message.TOKEN_NOT_EXIST);

		return { jwtToken: accessToken };
	} catch (err: any) {
		console.log('request token err', err.graphQLErrors);
		throw new Error(err.graphQLErrors?.[0]?.message ?? err.message ?? Message.SOMETHING_WENT_WRONG);
	}
};

export const updateStorage = ({ jwtToken }: { jwtToken: any }) => {
	setJwtToken(jwtToken);
	window.localStorage.setItem('authSession', 'cookie');
	window.localStorage.removeItem('logoutPending');
	window.localStorage.setItem('login', Date.now().toString());
};

export const updateUserInfo = (jwtToken: string, ready = true) => {
	if (!jwtToken) return false;

	const claims = decodeJWT<CustomJwtPayload>(jwtToken);
	if (!claims._id || !Object.values(MemberType).includes(claims.memberType as MemberType)) {
		throw new Error(Message.NOT_AUTHENTICATED);
	}
	userVar({
		_id: claims._id ?? '',
		memberType: claims.memberType ?? '',
		memberStatus: claims.memberStatus ?? '',
		memberAuthType: claims.memberAuthType,
		memberPhone: claims.memberPhone ?? '',
		memberNick: claims.memberNick ?? '',
		memberFullName: claims.memberFullName ?? '',
		memberImage:
			claims.memberImage === null || claims.memberImage === undefined
				? '/img/profile/defaultUser.svg'
				: `${claims.memberImage}`,
		memberAddress: claims.memberAddress ?? '',
		memberDesc: claims.memberDesc ?? '',
		memberCars: claims.memberCars ?? 0,
		memberRank: claims.memberRank ?? 0,
		memberArticles: claims.memberArticles ?? 0,
		memberPoints: claims.memberPoints ?? 0,
		memberLikes: claims.memberLikes ?? 0,
		memberViews: claims.memberViews ?? 0,
		memberFollowers: claims.memberFollowers ?? 0,
		memberFollowings: claims.memberFollowings ?? 0,
		memberComments: claims.memberComments ?? 0,
		memberWarnings: claims.memberWarnings ?? 0,
		memberBlocks: claims.memberBlocks ?? 0,
	});
	if (ready) authReadyVar(true);
};

export const logOut = async () => {
	localStorage.setItem('logoutPending', '1');
	const changing = prepareSessionChange();
	deleteStorage();
	deleteUserInfo();
	authReadyVar(true);
	await changing;
	try {
		await revokeRefreshSession();
	} catch {
		/* Retry server revocation on next hydration; never restore this session. */
	}
	window.location.reload();
};

const deleteStorage = (broadcast = true) => {
	localStorage.removeItem('accessToken');
	localStorage.removeItem('authSession');
	window.dispatchEvent?.(new Event('anorcar:auth-changed'));
	if (broadcast) window.localStorage.setItem('logout', Date.now().toString());
};

const deleteUserInfo = () => {
	userVar({
		_id: '',
		memberType: '',
		memberStatus: '',
		memberAuthType: '',
		memberPhone: '',
		memberNick: '',
		memberFullName: '',
		memberImage: '',
		memberAddress: '',
		memberDesc: '',
		memberCars: 0,
		memberRank: 0,
		memberArticles: 0,
		memberPoints: 0,
		memberLikes: 0,
		memberViews: 0,
		memberFollowers: 0,
		memberFollowings: 0,
		memberComments: 0,
		memberWarnings: 0,
		memberBlocks: 0,
	});
};

export function clearUserSession(broadcast = true) {
	deleteStorage(broadcast);
	deleteUserInfo();
	authReadyVar(true);
}

let hydration: Promise<void> | null = null;
let listening = false;
export async function hydrateUser(): Promise<void> {
	if (typeof window === 'undefined' || authReadyVar()) return;
	if (hydration) return hydration;
	if (!listening && window.addEventListener) {
		listening = true;
		window.addEventListener('storage', (event) => {
			if (event.key === 'logout' || (event.key === 'logoutPending' && event.newValue)) {
				void prepareSessionChange();
				clearUserSession(false);
			} else if (event.key === 'accessToken' && event.newValue && isAccessTokenCurrent(event.newValue)) {
				updateUserInfo(event.newValue);
				window.dispatchEvent(new Event('anorcar:auth-changed'));
			}
		});
	}
	if (localStorage.getItem('logoutPending')) {
		clearUserSession();
		await revokeRefreshSession().catch(() => undefined);
		return;
	}
	const token = getJwtToken();
	if (isAccessTokenCurrent(token)) {
		updateUserInfo(token);
		return;
	}
	if (!token && !localStorage.getItem('authSession')) {
		authReadyVar(true);
		return;
	}
	try {
		if (token) updateUserInfo(token, false);
	} catch {
		clearUserSession();
	}
	authReadyVar(false);
	hydration = refreshAccessToken()
		.then(() => undefined)
		.catch((error) => {
			if (error instanceof SessionExpiredError) clearUserSession();
			// A temporary network error retains the known user; the next request retries.
		})
		.finally(() => {
			authReadyVar(true);
			hydration = null;
		});
	return hydration;
}

export async function refreshMemberCars() {
	const user = userVar();
	if (!user._id) return;
	const client = initializeApollo();
	const { data } = await client.query({
		query: GET_MEMBER,
		variables: { input: user._id },
		fetchPolicy: 'network-only',
	});
	if (userVar()._id === user._id && data?.getMember)
		userVar({ ...userVar(), memberCars: data.getMember.memberCars ?? 0 });
}
