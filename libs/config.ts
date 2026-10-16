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
// Previously approved automotive film. Set an empty value to hide the homepage play button.
export const HOME_PROMOTIONAL_VIDEO_URL =
 process.env.NEXT_PUBLIC_HOME_PROMOTIONAL_VIDEO_URL ?? 'https://www.youtube.com/watch?v=Cdh5Taq7H6A';
export function youtubeVideoId(value: string): string | null {
 try {
  const url = new URL(value);
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase();
  let id: string | null = null;
  if (host === 'youtu.be') id = url.pathname.slice(1);
  else if (['youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
   if (url.pathname === '/watch') id = url.searchParams.get('v');
   else if (url.pathname.startsWith('/embed/')) id = url.pathname.slice(7);
  }
  return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
 } catch { return null; }
}
export function imageUrl(path?: string | null): string {
 if (!path) return '/img/car/placeholder.svg';
 if (/^https?:\/\//i.test(path) || path.startsWith('/img/')) return path;
 return `${REACT_APP_API_URL.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
}

export function brandLogoUrl(name: string, path?: string | null): string {
 const key = name.trim().toLowerCase().replace(/[\s_-]+/g, '');
 const logos: Record<string, string> = {
  audi: 'audi', bmw: 'bmw', genesis: 'genesis', hyundai: 'hyundai', kia: 'kia',
  mercedes: 'mercedes-benz', mercedesbenz: 'mercedes-benz', tesla: 'tesla',
 };
 return logos[key] ? `/img/brands/${logos[key]}-logo.svg` : imageUrl(path);
}
