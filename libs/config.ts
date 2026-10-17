export const REACT_APP_API_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:3007';

export const Messages = {
	error1: 'Something went wrong!',
	error2: 'Please login first!',
	error3: 'Please fulfill all inputs!',
	error4: 'Message is empty!',
	error5: 'Only images with jpeg, jpg, png format allowed!',
};

export const REACT_APP_API_GRAPHQL_URL = process.env.REACT_APP_API_GRAPHQL_URL ?? `${REACT_APP_API_URL}/graphql`;
export const REACT_APP_API_WS = process.env.REACT_APP_API_WS ?? REACT_APP_API_URL.replace(/^http/, 'ws');
export const maxCarYear = new Date().getFullYear() + 1;
export const topCarRank = 2;
export function imageUrl(path?: string | null): string {
	if (!path) return '/img/car/placeholder.svg';
	if (/^https?:\/\//i.test(path) || path.startsWith('/img/')) return path;
	return `${REACT_APP_API_URL.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
}

export function brandLogoUrl(name: string, path?: string | null): string {
	const key = name
		.trim()
		.toLowerCase()
		.replace(/[\s_-]+/g, '');
	const logos: Record<string, string> = {
		audi: 'audi-logo.svg',
		bentley: 'bentley-logo.svg',
		bmw: 'bmw-logo.svg',
		chevrolet: 'chevrolet-logo.png',
		ford: 'ford-logo.png',
		genesis: 'genesis-logo.svg',
		hyundai: 'hyundai-logo.svg',
		jaguar: 'jaguar-logo.svg',
		kia: 'kia-logo.svg',
		lexus: 'lexus-logo.png',
		maserati: 'maserati-logo.png',
		mazda: 'mazda-logo.svg',
		mercedes: 'mercedes-benz-logo.svg',
		mercedesbenz: 'mercedes-benz-logo.svg',
		mini: 'mini-logo.svg',
		mitsubishi: 'mitsubishi-logo.svg',
		nissan: 'nissan-logo.svg',
		porsche: 'porsche-logo.svg',
		rollsroyce: 'rolls-royce-logo.svg',
		ssangyong: 'ssangyong-logo.png',
		tesla: 'tesla-logo.svg',
		toyota: 'toyota-logo.svg',
		volkswagen: 'volkswagen-logo.svg',
	};
	return logos[key] ? `/img/brands/${logos[key]}` : imageUrl(path);
}
