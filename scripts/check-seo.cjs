const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');
const previous = require.extensions['.ts'];
require.extensions['.ts'] = (loaded, filename) => loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, esModuleInterop: true },
}).outputText, filename);
const { resolveSeo, seoCanonical, defaultSeoImage } = require('../libs/seo.ts');
const id = '0123456789abcdef01234567';
const translate = locale => (key, values = {}) => {
 const messages = require(`../public/locales/${locale}/common.json`);
 assert(messages[key], `Missing ${locale} SEO translation: ${key}`);
 return messages[key].replace(/\{\{(\w+)\}\}/g, (_, name) => values[name]);
};
for (const locale of ['en', 'kr', 'ru']) {
 const home = resolveSeo('/', {}, locale, translate(locale));
 assert(home.title.startsWith('ANORCAR | '));
 assert.equal(home.image.url, 'https://anorcar.io/og-image.jpg');
 assert.equal(home.image.width, 1200); assert.equal(home.image.height, 630);
 assert.equal(home.noindex, false);
 for (const pathname of ['/car', '/car/compare', '/agent', '/community', '/cs', '/about']) {
  assert.equal(resolveSeo(pathname, {}, locale, translate(locale)).noindex, false);
 }
 for (const pathname of ['/mypage', '/member', '/account/join', '/_admin/users']) {
  const page = resolveSeo(pathname, { memberId: id, token: 'secret', email: 'private@example.com' }, locale,
   translate(locale), { key: pathname, title: 'private name', description: 'private phone' });
  assert(page.noindex);
  assert(!JSON.stringify(page).includes('private') && !page.canonical.includes('?'));
 }
 const query = { id, tracking: 'discard', articleCategory: 'NEWS' };
 assert.equal(seoCanonical('/community/detail', query, locale), `https://anorcar.io${locale === 'en' ? '' : '/' + locale}/community/detail?id=${id}`);
 assert(resolveSeo('/car/detail', { id }, locale, translate(locale), { key: '/car/detail?id=different', title: 'stale' }).noindex);
}
assert.equal(resolveSeo('/', {}, 'en', translate('en')).title, 'ANORCAR | Find Your Next Car');
assert.equal(seoCanonical('/car', { input: '{}', utm_source: 'x' }, 'en'), 'https://anorcar.io/car');

const filename = path.resolve(__dirname, '../libs/seo.server.ts');
const loaded = new Module(filename, module);
loaded.filename = filename; loaded.paths = Module._nodeModulePaths(path.dirname(filename));
loaded.require = name => name === 'next-i18next/serverSideTranslations'
 ? { serverSideTranslations: async () => ({ _nextI18Next: { initialLocale: 'en' } }) }
 : Module.prototype.require.call(loaded, name);
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const { detailSeoProps, publicSeoImage } = loaded.exports;
const originalFetch = global.fetch;
let calls = [], mode = 'success';
const fixtures = {
 getCar: { _id: id, carStatus: 'ACTIVE', carYear: 2024, carModel: 'Sonata', brandData: { brandName: 'Hyundai' }, carImages: [], memberPhone: 'private-phone', accessToken: 'secret-token' },
 getMember: { _id: id, memberType: 'AGENT', memberStatus: 'ACTIVE', memberFullName: 'Public Agent', memberNick: 'Agent', memberPhone: 'private-phone', accessToken: 'secret-token' },
 getBoardArticle: { _id: id, articleStatus: 'ACTIVE', articleTitle: 'Public news', articleContent: '<p>Real public article.</p><script>hidden()</script>', memberData: { memberPhone: 'private-phone' } },
};
const context = (kind = 'car', query = {}) => ({ locale: 'en', query: { [kind === 'agent' ? 'agentId' : 'id']: id, ...query },
 req: { headers: { cookie: 'private-session', authorization: 'private-token' } },
 res: { statusCode: 200, headers: {}, setHeader(name, value) { this.headers[name] = value; } } });
global.fetch = async (url, options) => {
 calls.push({ url: String(url), ...options });
 if (options.method === 'HEAD') return new Response(null, { status: mode === 'badImage' ? 404 : 200, headers: { 'content-type': 'image/jpeg' } });
 assert.deepEqual(options.headers, { 'Content-Type': 'application/json' });
 if (mode === 'offline') throw Error('offline');
 if (mode === 'missing') return new Response(JSON.stringify({ errors: [{ message: 'No data found!' }] }));
 return new Response(JSON.stringify({ data: fixtures }));
};
(async () => {
 const car = await detailSeoProps('car')(context());
 assert.equal(car.props.seo.title, '2024 Hyundai Sonata | ANORCAR');
 assert.deepEqual(car.props.seo.image, defaultSeoImage);
 assert(!JSON.stringify(car.props).includes('private-phone') && !JSON.stringify(car.props).includes('secret-token'));
 for (const kind of ['agent', 'article']) {
  const page = await detailSeoProps(kind)(context(kind));
  assert(page.props.seo.title.includes(kind === 'agent' ? 'Public Agent' : 'Public news'));
  assert(!JSON.stringify(page.props).includes('private-phone') && !JSON.stringify(page.props).includes('hidden()'));
 }
 const count = calls.length;
 assert.deepEqual(await detailSeoProps('car')(context('car', { id: 'invalid' })), { notFound: true });
 assert.equal(calls.length, count);
 fixtures.getCar.carStatus = 'SOLD';
 assert.deepEqual(await detailSeoProps('car')(context()), { notFound: true });
 fixtures.getCar.carStatus = 'ACTIVE';
 fixtures.getMember.memberStatus = 'BLOCK';
 assert.deepEqual(await detailSeoProps('agent')(context('agent')), { notFound: true });
 fixtures.getMember.memberStatus = 'ACTIVE';
 fixtures.getBoardArticle.articleStatus = 'DELETE';
 assert.deepEqual(await detailSeoProps('article')(context('article')), { notFound: true });
 mode = 'missing'; assert.deepEqual(await detailSeoProps('car')(context()), { notFound: true });
 mode = 'offline'; const unavailable = context();
 assert((await detailSeoProps('car')(unavailable)).props.seo.noindex);
 assert.equal(unavailable.res.statusCode, 503); assert.equal(unavailable.res.headers['Retry-After'], '60');
 mode = 'success';
 assert.equal((await publicSeoImage('https://anorcar.io/car.jpg')).url, 'https://anorcar.io/car.jpg');
 mode = 'badImage'; assert.deepEqual(await publicSeoImage('https://anorcar.io/missing.jpg'), defaultSeoImage);
 const before = calls.length;
 for (const url of ['http://localhost/car.jpg', 'https://127.0.0.1/car.jpg', 'https://untrusted.example/car.jpg', 'data:image/png;base64,abc']) {
  assert.deepEqual(await publicSeoImage(url), defaultSeoImage);
 }
 assert.equal(calls.length, before, 'Untrusted image origins are never requested');
 console.log('SEO passed: localized canonical/default metadata, private noindex, stale-data guards, anonymous SSR car/agent/article props, missing/sold/deleted records, outage handling and image fallback/origin safety.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
 global.fetch = originalFetch;
 if (previous) require.extensions['.ts'] = previous; else delete require.extensions['.ts'];
});
