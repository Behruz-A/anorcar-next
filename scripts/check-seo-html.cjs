// Run against a built frontend: FRONTEND_ORIGIN=http://localhost:3010 yarn node scripts/check-seo-html.cjs
const assert = require('assert/strict');
const { JSDOM } = require('jsdom');
const sharp = require('sharp');
const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:3010';
const endpoint = process.env.REACT_APP_API_GRAPHQL_URL || 'http://localhost:3007/graphql';
const production = 'https://anorcar.io';
async function graphql(query) {
 const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }), signal: AbortSignal.timeout(15000) });
 const result = await response.json();
 assert(response.ok && !result.errors, JSON.stringify(result.errors));
 return result.data;
}
async function inspect(route, { status = 200, noindex = false, locale = 'en', canonical = route, title } = {}) {
 const response = await fetch(origin + route, { redirect: 'manual', signal: AbortSignal.timeout(180000) });
 const html = await response.text();
 assert.equal(response.status, status, route);
 const dom = new JSDOM(html); // No JavaScript executes: these are the initial server-rendered tags.
 const doc = dom.window.document;
 const one = selector => { const values = doc.head.querySelectorAll(selector); assert.equal(values.length, 1, `${route}: ${selector}`); return values[0]; };
 one('title'); if (title) assert.equal(doc.title, title);
 for (const name of ['description', 'robots', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) one(`meta[name="${name}"]`);
 for (const property of ['og:site_name', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:type', 'og:type', 'og:locale']) one(`meta[property="${property}"]`);
 assert.equal(one('link[rel="canonical"]').href, production + canonical);
 assert.equal(one('meta[property="og:url"]').content, production + canonical);
 assert.equal(one('meta[property="og:title"]').content, doc.title);
 assert.equal(one('meta[name="twitter:title"]').content, doc.title);
 assert.equal(one('meta[name="twitter:card"]').content, 'summary_large_image');
 assert.equal(one('meta[name="robots"]').content.includes('noindex'), noindex);
 assert.equal(doc.documentElement.lang, { en: 'en', kr: 'ko', ru: 'ru' }[locale]);
 const image = one('meta[property="og:image"]').content;
 assert(image.startsWith('https://') && !/localhost|127\.0\.0\.1/.test(image));
 assert.equal(one('meta[name="twitter:image"]').content, image);
 assert.equal(one('meta[property="og:locale"]').content, { en: 'en_US', kr: 'ko_KR', ru: 'ru_RU' }[locale]);
 assert.equal(doc.head.querySelectorAll('link[rel="alternate"][hreflang]').length, noindex ? 0 : 4);
 if (image === production + '/og-image.jpg') {
  assert.equal(one('meta[property="og:image:width"]').content, '1200');
  assert.equal(one('meta[property="og:image:height"]').content, '630');
  assert.equal(one('meta[property="og:image:type"]').content, 'image/jpeg');
 }
 dom.window.close();
 console.log(`SEO HTML ${response.status} ${route}`);
 return html;
}
(async () => {
 const { getCars, getAgents, getBoardArticles } = await graphql(`query SeoFixtures {
  getCars(input:{page:1,limit:1,search:{}}) { list { _id carYear carModel carTitle brandData { brandName } } }
  getAgents(input:{page:1,limit:1,search:{}}) { list { _id memberNick memberFullName } }
  getBoardArticles(input:{page:1,limit:1,search:{}}) { list { _id articleTitle } }
 }`);
 const car = getCars.list[0], agent = getAgents.list[0], article = getBoardArticles.list[0];
 assert(car && agent && article, 'Real car, agent and article fixtures must exist');
 const brand = car.brandData?.brandName?.trim() || '';
 const model = car.carModel?.trim() || '';
 const name = model ? [brand && !model.toLowerCase().startsWith(brand.toLowerCase()) ? brand : '', model].filter(Boolean).join(' ') : car.carTitle;
 for (const locale of ['en', 'kr', 'ru']) {
  const prefix = locale === 'en' ? '' : '/' + locale;
  const root = prefix || '/';
  const messages = require(`../public/locales/${locale}/common.json`);
  const home = await inspect(root, { locale, title: 'ANORCAR | ' + messages['Find Your Next Car'] });
  const homeDocument = new JSDOM(home).window.document;
  assert.equal(homeDocument.querySelector('meta[name="description"]').content, messages['Discover new and used cars on ANORCAR. Compare vehicles, explore listings, and connect with trusted sellers.']);
  await inspect(prefix + '/car/detail?id=' + car._id, { locale, title: `${car.carYear > 0 ? car.carYear + ' ' : ''}${name} | ANORCAR` });
  await inspect(prefix + '/agent/detail?agentId=' + agent._id, { locale, title: `${agent.memberFullName?.trim() || agent.memberNick} | ANORCAR` });
  await inspect(prefix + '/community/detail?id=' + article._id, { locale, title: `${article.articleTitle} | ANORCAR` });
 }
 for (const route of ['/car', '/car/compare', '/agent', '/community', '/cs', '/about']) await inspect(route);
 for (const route of ['/mypage', '/member', '/account/join', '/_admin/users']) {
  const html = await inspect(route + '?token=private-query-value', { noindex: true, canonical: route });
  const head = html.slice(0, html.indexOf('</head>'));
  assert(!head.includes('private-query-value'));
 }
 // Static listing HTML is shared across queries; canonical consolidates it before router hydration.
 await inspect('/car?input=%7B%7D&utm_source=test', { canonical: '/car' });
 for (const route of ['/car/detail?id=invalid', '/car/detail?id=000000000000000000000000']) {
  const response = await fetch(origin + route);
  assert.equal(response.status, 404);
  const doc = new JSDOM(await response.text()).window.document;
  assert(doc.querySelector('meta[name="robots"]').content.includes('noindex'));
 }
 const response = await fetch(origin + '/og-image.jpg');
 assert.equal(response.status, 200); assert(response.headers.get('content-type').startsWith('image/jpeg'));
 const image = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
 assert.equal(image.width, 1200); assert.equal(image.height, 630);
 console.log('Initial HTML SEO passed: EN/KR/RU home/car/agent/article, canonical/alternates, unique tags, private noindex, missing listings and real 1200x630 OG asset.');
})().catch(error => { console.error(error); process.exitCode = 1; });
