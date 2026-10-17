const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

let open = false, swiper, dialog, chargingButton;
const hrefString = href => typeof href === 'string' ? href : href.pathname + '?' + new URLSearchParams(href.query);
const Link = ({ href, children, className }) => React.createElement('a', { href: hrefString(href), className }, children);
const wrapper = ({ children, className, id }) => React.createElement('div', { className, id }, children);
const filename = path.resolve(__dirname, '../libs/components/homepage/SellerShowcase.tsx');
const sourceText = fs.readFileSync(filename, 'utf8');
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
loaded.require = id => {
 if (id === 'react') return { ...React, createElement: (type, props, ...children) => {
  if (type === 'button' && props?.className === 'electric-card') chargingButton = props;
  return React.createElement(type, props, ...children);
 }, useState: () => [open, value => { open = value; }] };
 if (id === 'next/link') return Link;
 if (id === 'next/image') return ({ src, alt }) => React.createElement('img', { src, alt });
 if (id === 'next-i18next') return { useTranslation: () => ({ t: key => key }) };
 if (id.startsWith('@mui/icons-material/')) return () => React.createElement('svg');
 if (id === '@mui/material') return {
  Button: ({ href, children }) => React.createElement(Link, { href }, children),
  IconButton: ({ children, ...props }) => React.createElement('button', props, children),
  Dialog: props => { dialog = props; return props.open ? wrapper(props) : null; },
  DialogTitle: wrapper, DialogContent: wrapper,
 };
 if (id === 'swiper/react') return {
  Swiper: props => { swiper = props; return wrapper(props); }, SwiperSlide: wrapper,
 };
 if ((id === 'swiper' || id === 'swiper/modules')) return { A11y: {}, Keyboard: {}, Navigation: {} };
 if (id === '../../enums/car.enum') return { CarFuelType: { ELECTRIC: 'ELECTRIC' } };
 if (id === '../../enums/common.enum') return { Direction: { DESC: 'DESC' } };
 return Module.prototype.require.call(loaded, id);
};
loaded._compile(ts.transpileModule(sourceText, { compilerOptions: {
 module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true,
} }).outputText, filename);
const Showcase = loaded.exports.default;
{
 let html = renderToStaticMarkup(React.createElement(Showcase));
 assert.equal((html.match(/class="electric-card"/g) || []).length, 3);
 assert(html.includes('Discover Electric Cars at ANORCAR'));
 assert(!html.includes('<iframe') && !html.includes('seller-showcase-play'));
 assert.equal(dialog.open, false);
 assert.equal(swiper.breakpoints[1201].slidesPerView, 3);
 assert.equal(swiper.breakpoints[700].slidesPerView, 2);
 assert.equal(swiper.slidesPerView, 1);
 assert.equal(swiper.keyboard.enabled, true);
 assert.equal(swiper.watchOverflow, true);
 assert.deepEqual(swiper.navigation, { prevEl: '.electric-prev', nextEl: '.electric-next' });
 const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1].replaceAll('&amp;', '&'));
 const electricLinks = hrefs.filter(href => href.startsWith('/car?'));
 assert.equal(electricLinks.length, 1);
 for (const href of electricLinks) {
  const input = JSON.parse(new URL(href, 'http://localhost').searchParams.get('input'));
  assert.deepEqual(input.search, { fuelTypes: ['ELECTRIC'] });
  assert.equal(input.page, 1);
 }
 assert(hrefs.includes('/car/compare'));
 assert.equal(hrefs.filter(href => href === '/car/compare').length, 2);
 assert(!html.includes('electric-card-icon') && !html.includes('electric-card-arrow'));
 for (const match of html.matchAll(/src="([^"]+)"/g)) {
  assert(match[1].startsWith('/img/electric-guides/'));
  assert(fs.existsSync(path.resolve(__dirname, '../public' + match[1])));
 }
 chargingButton.onClick();
 html = renderToStaticMarkup(React.createElement(Showcase));
 assert(dialog.open);
 assert(html.includes('AC and DC charging') && html.includes('Check compatibility') && html.includes('Plan your charging stops'));
 dialog.onClose();
 renderToStaticMarkup(React.createElement(Showcase));
 assert.equal(dialog.open, false);
 const source = ts.createSourceFile(filename, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
 const keys = new Set();
 function inspect(node) {
  if (ts.isPropertyAssignment(node) && ['title', 'text', 'alt'].includes(node.name.getText(source)) && ts.isStringLiteral(node.initializer)) keys.add(node.initializer.text);
  if (ts.isCallExpression(node) && node.expression.getText(source) === 't' && ts.isStringLiteral(node.arguments[0])) keys.add(node.arguments[0].text);
  ts.forEachChild(node, inspect);
 }
 inspect(source);
 for (const locale of ['en', 'kr', 'ru']) {
  const labels = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/locales/' + locale + '/common.json'), 'utf8'));
  for (const key of keys) assert(key in labels, locale + ': ' + key);
 }
 console.log('Electric discovery passed: three image/title cards, electric-only browse, comparison CTA, charging dialog, responsive Swiper controls and EN/KR/RU labels.');
}
