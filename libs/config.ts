export const REACT_APP_API_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:3007';

export const Messages = {
	error1: 'Something went wrong!',
	error2: 'Please login first!',
	error3: 'Please fulfill all inputs!',
	error4: 'Message is empty!',
	error5: 'Only images with jpeg, jpg, png format allowed!',
};


export const REACT_APP_API_GRAPHQL_URL = process.env.REACT_APP_API_GRAPHQL_URL ?? `${REACT_APP_API_URL}/graphql`;
export const REACT_APP_API_WS = process.env.REACT_APP_API_WS ?? 'ws://127.0.0.1:3007';
export const maxCarYear = new Date().getFullYear() + 1;
export const topCarRank = 2;
export function imageUrl(path?: string | null): string {
 if (!path) return '/img/car/placeholder.svg';
 if (/^https?:\/\//i.test(path) || path.startsWith('/img/')) return path;
 return `${REACT_APP_API_URL.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
}
