import { Html, Head, Main, NextScript, DocumentProps } from 'next/document';
import { seoLocale, seoLocales } from '../libs/seo';
export default function Document(props: DocumentProps) {
	return (
		<Html lang={seoLocales[seoLocale(props.__NEXT_DATA__.locale)].language}>
			<Head>
				<link rel="icon" type="image/png" href="/img/anorcar_logo_original.png" />
				<link rel="apple-touch-icon" href="/img/anorcar_logo_original.png" />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
