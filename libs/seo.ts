import type { ParsedUrlQuery } from 'querystring';

export const SEO_SITE_URL = 'https://anorcar.io';
export const seoLocales = {
	en: { language: 'en', og: 'en_US' },
	kr: { language: 'ko', og: 'ko_KR' },
	ru: { language: 'ru', og: 'ru_RU' },
};
export type SeoLocale = keyof typeof seoLocales;
export interface SeoImage {
	url: string;
	type: string;
	width?: number;
	height?: number;
}
export interface PageSeo {
	key: string;
	title?: string;
	description?: string;
	descriptionKey?: string;
	values?: Record<string, string>;
	image?: SeoImage;
	type?: 'website' | 'article' | 'profile';
	noindex?: boolean;
}
export const defaultSeoImage: SeoImage = {
	url: `${SEO_SITE_URL}/og-image.jpg`,
	type: 'image/jpeg',
	width: 1200,
	height: 630,
};
export const detailSeoRoutes = { '/car/detail': 'id', '/agent/detail': 'agentId', '/community/detail': 'id' } as const;

export function seoLocale(locale?: string): SeoLocale {
	return locale === 'kr' || locale === 'ru' ? locale : 'en';
}

export function seoRouteKey(pathname: string, query: ParsedUrlQuery): string {
	const idKey = detailSeoRoutes[pathname as keyof typeof detailSeoRoutes];
	const id = idKey ? query[idKey] : undefined;
	return idKey && typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)
		? `${pathname}?${idKey}=${id.toLowerCase()}`
		: pathname;
}

export function seoCanonical(pathname: string, query: ParsedUrlQuery, locale?: string): string {
	const prefix = seoLocale(locale) === 'en' ? '' : `/${seoLocale(locale)}`;
	const route = seoRouteKey(pathname, query);
	return `${SEO_SITE_URL}${prefix}${route === '/' ? (prefix ? '' : '/') : route.replace(/\/$/, '')}`;
}

const pageCopy: Record<string, { title: string; description: string }> = {
	'/': {
		title: 'Find Your Next Car',
		description:
			'Discover new and used cars on ANORCAR. Compare vehicles, explore listings, and connect with trusted sellers.',
	},
	'/car': {
		title: 'Cars for Sale',
		description:
			'Browse new and used cars on ANORCAR. Filter by brand, price, year, and location to find your next car.',
	},
	'/car/compare': {
		title: 'Compare Cars',
		description: 'Compare vehicle prices, specifications, and features side by side on ANORCAR.',
	},
	'/car/detail': {
		title: 'Car Details',
		description: 'Explore car listings, vehicle details, photos, and seller information on ANORCAR.',
	},
	'/agent': {
		title: 'Agents',
		description: 'Find car agents on ANORCAR. Explore their profiles and listings, and connect with sellers.',
	},
	'/agent/detail': {
		title: 'Agent Profile',
		description: 'Explore agent profiles and their available car listings on ANORCAR.',
	},
	'/community': {
		title: 'Community',
		description: 'Read automotive news, discussions, recommendations, and stories from the ANORCAR community.',
	},
	'/community/detail': {
		title: 'Community',
		description: 'Read automotive stories and discussions from the ANORCAR community.',
	},
	'/cs': { title: 'Help Center', description: 'Find answers, explore guides, and get the support you need.' },
	'/about': {
		title: 'About Us',
		description: 'Discover ANORCAR, an automotive marketplace connecting car buyers and sellers.',
	},
};

export function resolveSeo(
	pathname: string,
	query: ParsedUrlQuery,
	locale: string | undefined,
	translate: (key: string, values?: Record<string, string>) => string,
	metadata?: PageSeo,
) {
	const copy = pageCopy[pathname];
	const privatePage = pathname.startsWith('/_admin') || ['/mypage', '/member', '/account/join'].includes(pathname);
	const key = seoRouteKey(pathname, query);
	// Shallow navigation must never show the previous listing's metadata.
	const current = !privatePage && metadata?.key === key ? metadata : undefined;
	const detail = pathname in detailSeoRoutes;
	const noindex =
		privatePage ||
		!copy ||
		(detail && (!current || key === pathname)) ||
		!!current?.noindex ||
		(['/car', '/agent', '/community', '/car/compare'].includes(pathname) && Object.keys(query).length > 0);
	const label = translate(copy?.title ?? (privatePage ? 'Account' : 'Page not found'));
	const title = current?.title || (pathname === '/' ? `ANORCAR | ${label}` : `${label} | ANORCAR`);
	const description =
		current?.description ||
		translate(
			current?.descriptionKey ||
				copy?.description ||
				(privatePage ? 'Manage your ANORCAR account.' : 'The requested page could not be found on ANORCAR.'),
			current?.values,
		);
	const socialDescription =
		pathname === '/'
			? translate('Explore new and used cars, compare your favorites, and connect with sellers on ANORCAR.')
			: description;
	return {
		title,
		description,
		socialDescription,
		canonical: seoCanonical(pathname, query, locale),
		image: current?.image ?? defaultSeoImage,
		type: current?.type ?? 'website',
		noindex,
		locale: seoLocale(locale),
	};
}
