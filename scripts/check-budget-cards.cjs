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

const filename = path.resolve(__dirname, '../libs/components/homepage/BrowseByBudget.tsx');
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
const div = ({ children, className }) => React.createElement('div', { className }, children);
loaded.require = id => {
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
}
assert(!html.includes('<small'), 'Budget cards must not display counts');
if (previous) require.extensions['.ts'] = previous; else delete require.extensions['.ts'];
console.log('Budget cards passed: labels without counts and matching Cars URL filters.');