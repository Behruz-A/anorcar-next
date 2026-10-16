const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const categories = { NEWS: 'NEWS', FREE: 'FREE', RECOMMEND: 'RECOMMEND', HUMOR: 'HUMOR' };
const posts = Object.values(categories).slice(0, 3).map((category, index) => ({ _id: `post-${index}`, articleCategory: category, articleTitle: `Post ${index}`, articleContent: '<p>Readable &amp; safe</p><script>hidden()</script>', articleViews: 0, articleComments: 2, createdAt: '2026-10-16T00:00:00.000Z' }));
let states = [], cursor = 0, query, tabs;
const div = ({ children, className, id }) => React.createElement('div', { className, id }, children);
function load(relative) {
 const filename = path.resolve(__dirname, '..', relative), loaded = new Module(filename, module);
 loaded.filename = filename;
 loaded.paths = Module._nodeModulePaths(path.dirname(filename));
 loaded.require = id => {
  if (id === 'react') return { ...React, useState: initial => {
   const slot = cursor++; if (!(slot in states)) states[slot] = slot === 1 && Array.isArray(initial) ? posts : initial;
   return [states[slot], value => { states[slot] = value; }];
  } };
  if (id === '@apollo/client') return { useQuery: (_, options) => { query = options; return { data: {} }; } };
  if (id === 'next-i18next') return { useTranslation: () => ({ t: key => key, i18n: { language: 'en' } }) };
  if (id === '@mui/material') return { Stack: div, Alert: div, CircularProgress: div, Tabs: props => { tabs = props; return div(props); }, Tab: props => React.createElement('button', { id: props.id }, props.label) };
  if (id.startsWith('@mui/icons-material/')) return () => React.createElement('svg');
  if (id === 'next/link') return ({ children, href, passHref, ...props }) => React.createElement('a', { ...props, href: href.pathname + '?' + new URLSearchParams(href.query) }, children);
  if (id === 'next/image') return ({ fill, unoptimized, ...props }) => React.createElement('img', props);
  if (id === '../../config') return { imageUrl: value => '/assets/' + value };
  if (id === '../../enums/board-article.enum' || id === './enums/board-article.enum') return { BoardArticleCategory: categories };
  if (id === '../../enums/common.enum') return { Direction: { DESC: 'DESC' } };
  if (id === '../../../apollo/user/query') return {};
  if (id === '../../community') return helper;
  if (id === './CommunityCard') return Card;
  return Module.prototype.require.call(loaded, id);
 };
 loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText, filename);
 return loaded.exports;
}
const helper = load('libs/community.ts');
const Card = load('libs/components/homepage/CommunityCard.tsx').default;
const Boards = load('libs/components/homepage/CommunityBoards.tsx').default;
const render = () => { cursor = 0; return renderToStaticMarkup(React.createElement(Boards)); };
let html = render();
assert.equal(query.variables.input.limit, 3);
assert.deepEqual(query.variables.input.search, {});
assert.equal(tabs.value, 'ALL');
assert.equal((html.match(/class="community-highlight-card"/g) || []).length, 3);
assert(html.includes('From Our Community'));
assert(html.includes('Readable &amp; safe'));
assert(!html.includes('hidden()'));
assert(html.includes('/img/event.svg'), 'Missing covers retain the local fallback');
for (const category of Object.values(categories)) {
 tabs.onChange({}, category); render();
 assert.deepEqual(query.variables.input.search, { articleCategory: category });
 assert.equal(query.variables.input.page, 1);
}
tabs.onChange({}, 'ALL'); render();
assert.deepEqual(query.variables.input.search, {});
assert.equal(tabs.value, 'ALL');
states = []; cursor = 0;
const card = renderToStaticMarkup(React.createElement(Card, { article: posts[0] }));
assert(card.includes('/community/detail?articleCategory=NEWS&amp;id=post-0'));
assert(card.includes('<time'));
assert(card.includes('title="Views"'));
assert(card.includes('title="Comments"'));
console.log('Homepage Community passed: 3 real cards, All Posts/four filters, reset, safe excerpts, image fallback, date/counters and detail links.');
