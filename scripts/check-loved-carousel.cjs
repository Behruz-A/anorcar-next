const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let carousel, queryOptions;
const cars = Array.from({ length: 8 }, (_, index) => ({ _id: `car-${index}` }));
const Navigation = Symbol('Navigation'), Keyboard = Symbol('Keyboard'), A11y = Symbol('A11y');
const filename = path.resolve(__dirname, '../libs/components/homepage/TrendCars.tsx');
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
const div = ({ children, className }) => React.createElement('div', { className }, children);
loaded.require = id => {
 if (id === 'react') return { ...React, useState: () => [cars, () => {}] };
 if (id === 'next-i18next') return { useTranslation: () => ({ t: value => value }) };
 if (id === '@mui/material') return { Stack: div, Alert: div, CircularProgress: div,
  IconButton: ({ children, ...props }) => React.createElement('button', props, children) };
 if (id.startsWith('@mui/icons-material/')) return () => React.createElement('svg');
 if (id === 'next/link') return ({ children }) => React.createElement('a', null, children);
 if (id === 'swiper') return { Navigation, Keyboard, A11y };
 if (id === 'swiper/react') return {
  Swiper: props => { carousel = props; return div(props); }, SwiperSlide: div,
 };
 if (id === '@apollo/client') return {
  useMutation: () => [() => {}], useQuery: (_, options) => { queryOptions = options; return { data: { getCars: { list: cars } } }; },
 };
 if (id === './TrendCarCard') return ({ car }) => React.createElement('article', null, car._id);
 if (id === '../../enums/common.enum') return { Direction: { DESC: 'DESC' }, Message: {} };
 if (id.includes('/apollo/') || id === '../../sweetAlert') return {};
 return Module.prototype.require.call(loaded, id);
};
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText, filename);
const html = renderToStaticMarkup(React.createElement(loaded.exports.default));
assert.equal(queryOptions.variables.input.limit, 8);
assert.equal(queryOptions.variables.input.sort, 'carLikes');
assert.equal(queryOptions.variables.input.direction, 'DESC');
assert.equal(carousel.slidesPerView, 1.15);
assert.equal(carousel.breakpoints[600].slidesPerView, 2);
assert.equal(carousel.breakpoints[1440].slidesPerView, 4);
assert(carousel.modules.includes(Navigation));
assert(carousel.modules.includes(Keyboard));
assert(carousel.modules.includes(A11y));
for (const selector of [carousel.navigation.prevEl, carousel.navigation.nextEl]) {
 assert(html.includes(`class="${selector.slice(1)}"`), 'Navigation must target actual rendered buttons');
}
assert.equal((html.match(/<article>/g) ?? []).length, 8);
assert(html.includes('aria-label="Previous cars"'));
assert(html.includes('aria-label="Next cars"'));
console.log('Loved carousel passed: 8 records, 4/2/1.15 responsive slides and connected accessible arrow controls.');
