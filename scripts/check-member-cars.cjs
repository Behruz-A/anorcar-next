const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Render the actual component with isolated router/Apollo boundaries. No network or writes.
let router, response, options, pagination, cards;
const filename = path.resolve(__dirname, '../libs/components/member/MemberCars.tsx');
const componentModule = new Module(filename, module);
componentModule.filename = filename;
componentModule.paths = Module._nodeModulePaths(path.dirname(filename));
const element = tag => ({ children, className, ...props }) => React.createElement(tag, { className }, children);
componentModule.require = id => {
 if (id === 'next/router') return { useRouter: () => router };
 if (id === '@apollo/client') return { useQuery: (_, input) => { options = input; return response; } };
 if (id === 'next-i18next') return { useTranslation: () => ({ t: (text, values) => text.replace('{{total}}', values?.total) }) };
 if (id === '@mui/material') return {
  Stack: element('div'), Typography: element('p'), Alert: element('aside'),
  CircularProgress: () => React.createElement('span', null, 'Loading cars'),
  Pagination: props => { pagination = props; return React.createElement('nav', null, `Pages: ${props.count}`); },
 };
 if (id === '../../../apollo/user/query') return { GET_CARS: {} };
 if (id === '../../car') return { defaultCarsInquiry: { page: 1, limit: 9, sort: 'createdAt', direction: 'DESC', search: {} } };
 if (id === '../mypage/CarCard') return { CarCard: props => { cards.push(props); return React.createElement('article', null, props.car.carTitle); } };
 return module.require(id);
};
componentModule._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText, filename);
const MemberCars = componentModule.exports.default;
function render(memberId, result = {}, isReady = true) {
 router = { isReady, query: { memberId } }; response = result; pagination = undefined; cards = [];
 return renderToStaticMarkup(React.createElement(MemberCars));
}
const memberId = '6ace1b3d206b7e8e8eedb92b';
for (const id of [memberId, '0123456789abcdef01234567', 'ABCDEF0123456789ABCDEF01']) {
 render(id, { loading: true });
 assert.equal(options.skip, false, `Real member ID must query: ${id}`);
 assert.equal(options.variables.input.search.memberId, id);
 assert.equal(options.variables.input.limit, 5);
}
for (const id of ['invalid', 'g'.repeat(24), '\\'.repeat(24), undefined, [memberId]]) {
 const html = render(id);
 assert.equal(options.skip, true);
 assert(!html.includes('No cars found.'));
}
assert(!render(memberId, {}, false).includes('No cars found.'));
assert.equal(options.skip, true);
assert(!render(memberId, { loading: true }).includes('No cars found.'));
assert(!render(memberId, { error: new Error('Network error') }).includes('No cars found.'));
assert(!render(memberId).includes('No cars found.'));
assert(render(memberId, { data: { getCars: { list: [], metaCounter: [{ total: 0 }] } } }).includes('No cars found.'));
assert.equal(pagination, undefined);
const list = Array.from({ length: 5 }, (_, index) => ({ _id: String(index), carTitle: `Car ${index}` }));
const html = render(memberId, { data: { getCars: { list, metaCounter: [{ total: 14 }] } } });
assert.equal(cards.length, 5);
assert(cards.every(card => card.memberPage && !card.deleteCarHandler && !card.updateCarHandler));
assert.equal(pagination.count, 3);
assert.equal(pagination.page, 1);
assert(html.includes('14 cars available'));
assert(!html.includes('No cars found.'));
for (const className of ['main-title-box', 'cars-list-box', 'list-box', 'listing-title-box', 'pagination-config']) assert(html.includes(className));
console.log('Member cars regression passed: valid IDs query, skipped/loading/error/empty states, 14-car pagination and Nestar list structure.');
