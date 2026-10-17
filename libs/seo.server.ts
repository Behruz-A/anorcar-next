import type { GetServerSideProps } from 'next';
import { print } from 'graphql';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GET_CAR, GET_MEMBER, GET_BOARD_ARTICLE } from '../apollo/user/query';
import { REACT_APP_API_GRAPHQL_URL, REACT_APP_API_URL } from './config';
import { articleExcerpt } from './community';
import { Car } from './types/car/car';
import { Member } from './types/member/member';
import { BoardArticle } from './types/board-article/board-article';
import { defaultSeoImage, PageSeo, SEO_SITE_URL, SeoImage, seoLocale, seoRouteKey } from './seo';

type DetailKind = 'car' | 'agent' | 'article';
const details = {
	car: { route: '/car/detail', idKey: 'id', field: 'getCar', document: GET_CAR },
	agent: { route: '/agent/detail', idKey: 'agentId', field: 'getMember', document: GET_MEMBER },
	article: { route: '/community/detail', idKey: 'id', field: 'getBoardArticle', document: GET_BOARD_ARTICLE },
};

// Only configured public origins are probed; arbitrary stored URLs cannot trigger server-side requests.
export async function publicSeoImage(path?: string | null): Promise<SeoImage> {
	if (!path) return defaultSeoImage;
	try {
		const base = path.startsWith('/img/') ? SEO_SITE_URL : REACT_APP_API_URL.replace(/\/$/, '') + '/';
		const url = new URL(path, base);
		const allowed = [new URL(SEO_SITE_URL).origin, new URL(REACT_APP_API_URL).origin];
		if (
			url.protocol !== 'https:' ||
			url.username ||
			url.password ||
			!allowed.includes(url.origin) ||
			/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[|.*\.local$)/i.test(url.hostname) ||
			/^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname)
		)
			return defaultSeoImage;
		const response = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(3000) });
		const type = response.headers.get('content-type')?.split(';')[0];
		return response.ok && (type === 'image/jpeg' || type === 'image/png') ? { url: url.href, type } : defaultSeoImage;
	} catch {
		return defaultSeoImage;
	}
}

export function detailSeoProps(kind: DetailKind): GetServerSideProps<{ seo: PageSeo }> {
	return async (context) => {
		const config = details[kind];
		const id = context.query[config.idKey];
		context.res.setHeader('Cache-Control', 'private, no-store');
		if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) return { notFound: true };
		const locale = seoLocale(context.locale);
		const translations = await serverSideTranslations(locale, ['common']);
		const key = seoRouteKey(config.route, context.query);
		try {
			// Deliberately anonymous: no cookies, tokens, personalized cache or member fields are serialized.
			const response = await fetch(REACT_APP_API_GRAPHQL_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				cache: 'no-store',
				body: JSON.stringify({ query: print(config.document), variables: { input: id } }),
				signal: AbortSignal.timeout(8000),
			});
			const result = (await response.json()) as {
				data?: { getCar?: Car; getMember?: Member; getBoardArticle?: BoardArticle };
				errors?: { message: string }[];
			};
			if (result.errors?.some((error) => error.message === 'No data found!')) return { notFound: true };
			if (!response.ok || result.errors?.length) throw new Error('Public metadata unavailable');
			const record = result.data?.[config.field as keyof NonNullable<typeof result.data>];
			if (!record) return { notFound: true };
			let seo: PageSeo;
			if (kind === 'car') {
				const car = record as Car;
				if (car.carStatus !== 'ACTIVE' || car.deletedAt || car.soldAt) return { notFound: true };
				const brand = car.brandData?.brandName?.trim() || '';
				const model = car.carModel?.trim() || '';
				const name = articleExcerpt(
					model
						? [brand && !model.toLowerCase().startsWith(brand.toLowerCase()) ? brand : '', model]
								.filter(Boolean)
								.join(' ')
						: car.carTitle,
				);
				seo = {
					key,
					title: `${car.carYear > 0 ? `${car.carYear} ` : ''}${name} | ANORCAR`,
					descriptionKey:
						'Explore this {{car}} listing on ANORCAR. View vehicle details, photos, price, and seller information.',
					values: { car: name },
					image: await publicSeoImage(car.carImages?.[0]),
				};
			} else if (kind === 'agent') {
				const agent = record as Member;
				if (agent.memberType !== 'AGENT' || agent.memberStatus !== 'ACTIVE') return { notFound: true };
				const name = articleExcerpt(agent.memberFullName?.trim() || agent.memberNick);
				seo = {
					key,
					title: `${name} | ANORCAR`,
					type: 'profile',
					descriptionKey: 'View {{agent}} on ANORCAR. Explore their car listings and public agent profile.',
					values: { agent: name },
					image: await publicSeoImage(agent.memberImage),
				};
			} else {
				const article = record as BoardArticle;
				if (article.articleStatus !== 'ACTIVE') return { notFound: true };
				const excerpt = articleExcerpt(article.articleContent, 160);
				seo = {
					key,
					title: `${articleExcerpt(article.articleTitle)} | ANORCAR`,
					type: 'article',
					...(excerpt ? { description: excerpt } : {}),
					image: await publicSeoImage(article.articleImage),
				};
			}
			return { props: { ...translations, seo } };
		} catch {
			// A temporary API outage is not a permanent 404 and must not be indexed as a valid listing.
			context.res.statusCode = 503;
			context.res.setHeader('Retry-After', '60');
			return { props: { ...translations, seo: { key, noindex: true } } };
		}
	};
}
