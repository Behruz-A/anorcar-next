const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const previous = require.extensions['.ts'];
require.extensions['.ts'] = (loaded, filename) => loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
}).outputText, filename);
const { carBudgets, budgetCarsInquiry } = require('../libs/carBudgets.ts');
const { parseCarsInquiry } = require('../libs/car.ts');
const { GET_CAR_BUDGET_COUNTS } = require('../apollo/user/query.ts');
let options, loading = false, data = Object.fromEntries(carBudgets.map((budget, index) => [budget.key, { metaCounter: [{ total: index * 3 }] }]));
const filename = path.resolve(__dirname, '../libs/components/homepage/BrowseByBudget.tsx');
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
const div = ({ children, className }) => React.createElement('div', { className }, children);
loaded.require = id => {
 if (id === '@apollo/client') return { useQuery: (_query, value) => { options = value; return { data, loading }; } };
 if (id === 'next-i18next') return { useTranslation: () => ({ t: (key, values) => key === 'Cars available' ? `${values.count} cars available` : key }) };
 if (id === '@mui/material') return { Stack: div, Typography: div, IconButton: div };
 if (id.startsWith('@mui/icons-material/')) return () => null;
 if (id === 'next/link') return ({ children, href }) => React.createElement('a', { href: href.pathname + '?' + new URLSearchParams(href.query) }, children);
 if (id === 'next/image') return () => null;
 if (id === 'swiper/react') return { Swiper: div, SwiperSlide: div };
 if (id === 'swiper/modules') return {};
 return Module.prototype.require.call(loaded, id);
};
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText, filename);
const render = () => renderToStaticMarkup(React.createElement(loaded.exports.default));
const html = render();
const links = [...html.matchAll(/href="([^\"]+)"/g)];
assert.equal(links.length, carBudgets.length);
for (const [index, budget] of carBudgets.entries()) {
 const inquiry = budgetCarsInquiry(budget.maxPrice);
 const url = new URL(links[index][1], 'http://localhost');
 assert.deepEqual(parseCarsInquiry(url.searchParams.get('input')), inquiry);
 assert.deepEqual(options.variables[budget.key], { ...inquiry, limit: 1 });
 assert(html.includes(`${index * 3} cars available`));
}
assert(html.includes('0 cars available'), 'A real zero is displayed');
data = { under10: { metaCounter: [] } };
assert(render().includes('0 cars available'), 'An empty successful counter is zero');
data = undefined; loading = true;
assert(!render().includes('0 cars available'), 'Loading must not invent zero results');
loading = false;
assert(!render().includes('0 cars available'), 'Unavailable counts must not invent zero results');
const { print } = require('graphql');
async function live() {
 const endpoint = process.env.REACT_APP_API_GRAPHQL_URL || 'http://localhost:3007/graphql';
 const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: print(GET_CAR_BUDGET_COUNTS), variables: options.variables }), signal: AbortSignal.timeout(15000) });
 const result = await response.json();
 assert(response.ok && !result.errors, JSON.stringify(result.errors));
 let previousCount = 0;
 for (const budget of carBudgets) {
  const count = result.data[budget.key].metaCounter[0]?.total ?? 0;
  assert(Number.isInteger(count) && count >= previousCount);
  previousCount = count;
 }
 console.log('Budget cards passed: real counts, zero/loading/error states, matching Cars URL filters and live backend budget queries.');
}
live().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
 if (previous) require.extensions['.ts'] = previous; else delete require.extensions['.ts'];
});
