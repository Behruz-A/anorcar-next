import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html lang="en">
			<Head>
				<meta name="robots" content="index,follow" />
				<link rel="icon" type="image/png" href="/img/logo/favicon.svg" />

				{/* SEO */}
				<meta name="keyword" content={'nestar, nestar.uz, devex mern, mern nestjs fullstack'} />
				<meta
					name={'description'}
					content={
						'Buy and sell properties anywhere anytime in South Korea. Best Properties at Best prices on nestar.uz | ' +
						'Покупайте и продавайте недвижимость в любой точке Южной Кореи в любое время. Лучшая недвижимость по лучшим ценам на nestar.uz | ' +
						'대한민국 언제 어디서나 부동산을 사고팔 수 있습니다. Nestar.uz에서 최적의 가격으로 최고의 부동산을 만나보세요'
					}
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
