import { useMemo } from 'react';
import { ApolloClient, ApolloLink, split, from, NormalizedCacheObject, Observable } from '@apollo/client';
import createUploadLink from 'apollo-upload-client/public/createUploadLink.js';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';
import { getJwtToken } from '../libs/auth';
import {
	isAccessTokenCurrent,
	refreshAccessToken,
	SessionChangedError,
	SessionExpiredError,
} from '../libs/auth/session';
import { TokenRefreshLink } from 'apollo-link-token-refresh';
import { sweetErrorAlert } from '../libs/sweetAlert';
import { socketVar, userVar } from './store';
import { REACT_APP_API_GRAPHQL_URL, REACT_APP_API_WS } from '../libs/config';
import { createApolloCache, updateLikeCache } from './cache';
let apolloClient: ApolloClient<NormalizedCacheObject>;

function getHeaders() {
	const headers = {} as HeadersInit;
	const token = getJwtToken();
	// @ts-ignore
	if (token) headers['Authorization'] = `Bearer ${token}`;
	return headers;
}

let refreshError: Error | null = null;
const tokenRefreshLink = new TokenRefreshLink({
	accessTokenField: 'accessToken',
	isTokenValidOrUndefined: (operation) => {
		if (['Login', 'Signup'].includes(operation.operationName)) return true;
		const token = getJwtToken();
		const waiting = Boolean(token && !isAccessTokenCurrent(token));
		operation.setContext({ waitingForRefresh: waiting });
		return !waiting;
	},
	fetchAccessToken: async () => {
		refreshError = null;
		return new Response(JSON.stringify({ accessToken: await refreshAccessToken() }), {
			headers: { 'Content-Type': 'application/json' },
		});
	},
	handleFetch: () => {
		refreshError = null;
	},
	handleError: (error) => {
		refreshError = error;
	},
});

// The installed TokenRefreshLink drains its queue even after failure. Keep failed
// authenticated requests out of the transport rather than forwarding stale tokens.
const refreshResultLink = new ApolloLink((operation, forward) => {
	if (operation.getContext().waitingForRefresh && refreshError)
		return new Observable((observer) => observer.error(refreshError));
	return forward(operation);
});

// Custom Websocket client
class LoggingWebSocket {
	private socket: WebSocket;
	private token = '';
	private readonly authChanged = () => {
		const token = isAccessTokenCurrent() ? getJwtToken() : '';
		if (token === this.token) return;
		this.socket.close();
		this.connect(token);
	};

	constructor(private readonly url: string) {
		this.socket = new WebSocket(`${url}?token=${isAccessTokenCurrent() ? getJwtToken() : ''}`);
		this.token = isAccessTokenCurrent() ? getJwtToken() : '';
		window.addEventListener('anorcar:auth-changed', this.authChanged);
		socketVar(this.socket);
	}

	private connect(token: string) {
		this.token = token;
		this.socket = new WebSocket(`${this.url}?token=${token}`);
		socketVar(this.socket);
	}

	send(data: string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView) {
		this.socket.send(data as string | Blob | ArrayBuffer);
	}
	close() {
		window.removeEventListener('anorcar:auth-changed', this.authChanged);
		this.socket.close();
	}
}

function createIsomorphicLink() {
	if (typeof window !== 'undefined') {
		const authLink = new ApolloLink((operation, forward) => {
			operation.setContext(({ headers = {} }) => ({
				headers: {
					...headers,
					...getHeaders(),
				},
			}));
			return forward(operation);
		});

		// @ts-ignore
		const link = new createUploadLink({
			uri: REACT_APP_API_GRAPHQL_URL,
			credentials: 'include',
			headers: { 'X-Anorcar-Client': 'web' },
		});

		/* WEBSOCKET SUBSCRIPTION LINK */
		const wsLink = new WebSocketLink({
			uri: REACT_APP_API_WS,
			options: {
				reconnect: false,
				timeout: 30000,
				connectionParams: () => {
					return { headers: getHeaders() };
				},
			},
			webSocketImpl: LoggingWebSocket,
		});

		const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
			if (graphQLErrors?.some((error) => error.message === 'ACCESS_TOKEN_EXPIRED')) {
				if (operation.getContext().refreshRetried) return;
				operation.setContext({ refreshRetried: true });
				return new Observable((observer) => {
					let cancelled = false;
					let subscription: { unsubscribe: () => void } | undefined;
					refreshAccessToken(true)
						.then(() => {
							if (!cancelled) subscription = forward(operation).subscribe(observer);
						})
						.catch((error) => {
							if (!cancelled) observer.error(error);
						});
					return () => {
						cancelled = true;
						subscription?.unsubscribe();
					};
				});
			}
			if (networkError instanceof SessionExpiredError || networkError instanceof SessionChangedError) return;
			// The AI panel presents its own short, localized inline errors.
			if (operation.operationName === 'AskAiAssistant' || operation.getContext().skipGlobalError) return;
			if (graphQLErrors) {
				graphQLErrors.forEach(({ message }) => {
					if (!message.includes('input')) sweetErrorAlert(message);
				});
			}
		});

		const splitLink = split(
			({ query }) => {
				const definition = getMainDefinition(query);
				return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
			},
			wsLink,
			authLink.concat(link),
		);

		return from([errorLink, tokenRefreshLink, refreshResultLink, splitLink]);
	}
	return ApolloLink.empty();
}

function createApolloClient() {
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		link: createIsomorphicLink(),
		cache: createApolloCache(),
		defaultOptions: {
			mutate: { update: (cache, result) => updateLikeCache(cache, result, userVar()._id) },
		},
		resolvers: {},
	});
}

export function initializeApollo(initialState = null) {
	const _apolloClient = apolloClient ?? createApolloClient();
	if (initialState) _apolloClient.cache.restore(initialState);
	if (typeof window === 'undefined') return _apolloClient;
	if (!apolloClient) apolloClient = _apolloClient;

	return _apolloClient;
}

export function useApollo(initialState: any) {
	return useMemo(() => initializeApollo(initialState), [initialState]);
}
