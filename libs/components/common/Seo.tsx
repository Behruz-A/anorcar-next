import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { PageSeo, resolveSeo, seoCanonical, seoLocales, SeoLocale } from '../../seo';

const Seo = ({ metadata }: { metadata?: PageSeo }) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const seo = resolveSeo(
		router.pathname,
		router.query,
		router.locale,
		(key, values) => String(t(key, values)),
		metadata,
	);
	return (
		<Head>
			<title>{seo.title}</title>
			<meta name="description" content={seo.description} key="description" />
			<link rel="canonical" href={seo.canonical} key="canonical" />
			<meta
				name="robots"
				content={seo.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large'}
				key="robots"
			/>
			<meta property="og:site_name" content="ANORCAR" key="og:site_name" />
			<meta property="og:title" content={seo.title} key="og:title" />
			<meta property="og:description" content={seo.socialDescription} key="og:description" />
			<meta property="og:url" content={seo.canonical} key="og:url" />
			<meta property="og:type" content={seo.type} key="og:type" />
			<meta property="og:locale" content={seoLocales[seo.locale].og} key="og:locale" />
			<meta property="og:image" content={seo.image.url} key="og:image" />
			<meta property="og:image:secure_url" content={seo.image.url} key="og:image:secure_url" />
			<meta property="og:image:type" content={seo.image.type} key="og:image:type" />
			{seo.image.width && <meta property="og:image:width" content={String(seo.image.width)} key="og:image:width" />}
			{seo.image.height && <meta property="og:image:height" content={String(seo.image.height)} key="og:image:height" />}
			<meta property="og:image:alt" content={seo.title} key="og:image:alt" />
			<meta name="twitter:card" content="summary_large_image" key="twitter:card" />
			<meta name="twitter:title" content={seo.title} key="twitter:title" />
			<meta name="twitter:description" content={seo.socialDescription} key="twitter:description" />
			<meta name="twitter:image" content={seo.image.url} key="twitter:image" />
			<meta name="twitter:image:alt" content={seo.title} key="twitter:image:alt" />
			{!seo.noindex &&
				(Object.keys(seoLocales) as SeoLocale[]).map((locale) => (
					<link
						rel="alternate"
						hrefLang={seoLocales[locale].language}
						href={seoCanonical(router.pathname, router.query, locale)}
						key={`alternate-${locale}`}
					/>
				))}
			{!seo.noindex && (
				<link
					rel="alternate"
					hrefLang="x-default"
					href={seoCanonical(router.pathname, router.query, 'en')}
					key="alternate-default"
				/>
			)}
			{!seo.noindex &&
				(Object.keys(seoLocales) as SeoLocale[])
					.filter((locale) => locale !== seo.locale)
					.map((locale) => (
						<meta property="og:locale:alternate" content={seoLocales[locale].og} key={`og-locale-${locale}`} />
					))}
		</Head>
	);
};

export default Seo;
