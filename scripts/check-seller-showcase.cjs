const assert = require('assert/strict');
const fs = require('fs');
const Module = require('module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let user = { _id: '', memberType: '' }, overview = { data: { getCars: { metaCounter: [{ total: 53 }] }, getAgents: { metaCounter: [{ total: 4 }] }, getBrands: [{ _id: 'one' }] }, loading: false, error: null, refetch: () => {} };
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText, filename);
const load = Module._load;
Module._load = function(name, ...args) {
 if (name === 'next-i18next') return { useTranslation: () => ({ t: key => key, i18n: { language: 'en' } }) };
 if (name === '@apollo/client') return { ...load.call(this, name, ...args), useReactiveVar: () => user, useQuery: (_document, options) => { assert.equal(options.fetchPolicy, 'no-cache'); assert.equal(options.variables.cars.limit, 1); assert.equal(options.variables.agents.limit, 1); return overview; } };
 return load.call(this, name, ...args);
};
const Showcase = require('../libs/components/homepage/SellerShowcase.tsx').default;
const render = () => renderToStaticMarkup(React.createElement(Showcase));
let html = render();
assert.ok(html.includes('carimg21.png')); assert.ok(!html.includes('<iframe'), 'Video stays unmounted before Play');
assert.ok(html.includes('href="/car"')); assert.ok(html.includes('With Confidence.')); assert.ok(!html.includes('Lamborghini')); assert.ok(html.includes('seller-showcase-play')); assert.ok(html.includes('aria-label="Play video"')); assert.ok(html.includes('class="seller-showcase-value">53</span>'));
for (const name of ['car', 'compare', 'chat', 'agents', 'brand', 'language']) {
 assert.ok(html.includes(`/img/showcase/${name}.svg`));
 assert.ok(fs.existsSync(`public/img/showcase/${name}.svg`));
}
assert.equal((html.match(/<li>/g) || []).length, 3);
assert.ok(!html.includes('seller-showcase-benefit-grid'), 'Features belong beside the video without a duplicate lower grid');
user = { _id: 'agent', memberType: 'AGENT' }; assert.ok(render().includes('/mypage?category=addCar')); assert.ok(render().includes('With Confidence.'));
user = { _id: 'buyer', memberType: 'USER' }; assert.ok(render().includes('href="/car"'));
user = { _id: 'admin', memberType: 'ADMIN' }; assert.ok(render().includes('href="/car"')); assert.ok(!render().includes('category=addCar'));
overview.data = { getCars: { metaCounter: [] }, getAgents: { metaCounter: [] }, getBrands: [] };
assert.equal((render().match(/class="seller-showcase-value">0<\/span>/g) || []).length, 3, 'Empty counts are real zeroes');
overview.error = Error('Fixture outage');
assert.ok(render().includes('Marketplace figures could not be loaded.')); assert.ok(render().includes('Try again'));
const source = fs.readFileSync('pages/index.tsx', 'utf8');
assert.equal((source.match(/<TopAgents \/>\s*<SellerShowcase \/>\s*<RecentlyAddedCars \/>/g) || []).length, 2, 'Desktop and mobile placement');
console.log('Seller showcase checks passed: placement, supplied image, lazy video, real/zero/error counts and role-aware CTA.');

const configPath = require.resolve('../libs/config.ts');
const { youtubeVideoId } = require(configPath);
assert.equal(youtubeVideoId('https://youtu.be/Cdh5Taq7H6A'), 'Cdh5Taq7H6A');
for (const url of ['', 'garbage', 'javascript:alert(1)', 'https://youtube.com.evil.test/watch?v=Cdh5Taq7H6A', 'https://www.youtube.com/watch?v=invalid']) assert.equal(youtubeVideoId(url), null);
const previousVideo = process.env.NEXT_PUBLIC_HOME_PROMOTIONAL_VIDEO_URL;
process.env.NEXT_PUBLIC_HOME_PROMOTIONAL_VIDEO_URL = '';
delete require.cache[configPath]; delete require.cache[require.resolve('../libs/components/homepage/SellerShowcase.tsx')];
const NoVideoShowcase = require('../libs/components/homepage/SellerShowcase.tsx').default;
assert.ok(!renderToStaticMarkup(React.createElement(NoVideoShowcase)).includes('seller-showcase-play'), 'Blank configuration hides play');
if (previousVideo === undefined) delete process.env.NEXT_PUBLIC_HOME_PROMOTIONAL_VIDEO_URL; else process.env.NEXT_PUBLIC_HOME_PROMOTIONAL_VIDEO_URL = previousVideo;
console.log('Video configuration checks passed: approved URL, invalid URL rejection and blank configuration.');
