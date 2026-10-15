const assert = require('assert/strict');
const fs = require('fs');
const ts = require('typescript');
const previous = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
}).outputText, filename);
const { carCategories, applyCarCategory, activeCarCategory } = require('../libs/carCategories.ts');
const { parseCarsInquiry, validateCarInput } = require('../libs/car.ts');
const { CarBodyType, CarFuelType, CarSegment, CarCondition } = require('../libs/enums/car.enum.ts');
const { carBudgets, budgetCarsInquiry } = require('../libs/carBudgets.ts');
assert.deepEqual(carBudgets.slice(0, -1).map(budget => budget.maxPrice),
 [10000000, 20000000, 30000000, 40000000, 50000000, 75000000, 100000000]);
for (const budget of carBudgets) {
 const input = budgetCarsInquiry(budget.maxPrice);
 const parsed = parseCarsInquiry(JSON.stringify(input));
 assert.equal(parsed.page, 1);
 assert.equal(parsed.sort, 'carPrice');
 assert.equal(parsed.direction, 'ASC');
 if (budget.maxPrice === undefined) assert.deepEqual(parsed.search, {});
 else {
  assert.deepEqual(parsed.search.pricesRange, { start: 0, end: budget.maxPrice });
  const millionLabel = Number(budget.label.match(/₩(\d+)M/)[1]);
  assert.equal(millionLabel * 1000000, budget.maxPrice, 'Budget label must match the actual KRW filter');
 }
}
const base = { locations: ['SEOUL'], brandIds: ['0123456789abcdef01234567'], text: 'Model Y',
 pricesRange: { start: 0, end: 50000000 }, conditions: [CarCondition.USED] };
for (const category of carCategories) {
 const result = applyCarCategory(base, category);
 assert.equal(activeCarCategory(result), category.key);
 const parsed = parseCarsInquiry(JSON.stringify({ page: 1, limit: 9, search: result }));
 assert.equal(activeCarCategory(parsed.search), category.key);
 for (const key of Object.keys(base)) assert.deepEqual(parsed.search[key], base[key]);
}
const suv = carCategories.find(category => category.key === 'suv');
const electricSuv = applyCarCategory({ ...base, fuelTypes: [CarFuelType.ELECTRIC] }, suv);
assert.deepEqual(electricSuv.bodyTypes, [CarBodyType.SUV]);
assert.deepEqual(electricSuv.fuelTypes, [CarFuelType.ELECTRIC]);
const all = applyCarCategory({ ...electricSuv, segments: [CarSegment.LUXURY] }, carCategories[0]);
assert.equal(all.bodyTypes, undefined); assert.equal(all.fuelTypes, undefined); assert.equal(all.segments, undefined);
assert.deepEqual(all.conditions, [CarCondition.USED]);
assert.deepEqual(parseCarsInquiry({ search: { bodyTypes: ['SUV', 'PLANE'], segments: ['LUXURY', 'CHEAP'] } }).search,
 { bodyTypes: ['SUV'], segments: ['LUXURY'] });
assert.equal(validateCarInput({ carBodyType: 'PLANE' }), 'Select a valid body type and segment.');
for (const locale of ['en', 'kr', 'ru']) {
 const translations = JSON.parse(fs.readFileSync(`public/locales/${locale}/common.json`, 'utf8'));
 for (const category of carCategories) assert(translations[category.label], `${locale}: ${category.label}`);
 for (const label of ['Any Region', 'Body type', 'Segment', 'More Filters']) assert(translations[label]);
 for (const budget of carBudgets) assert(translations[budget.label], `${locale}: ${budget.label}`);
}
// A wide thumbnail viewport must not expose neighboring sprite cells in its side gutters.
const Module = require('module');
const path = require('path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const categoryFile = path.resolve(__dirname, '../libs/components/homepage/CarTypeCategories.tsx');
const categoryModule = new Module(categoryFile, module);
categoryModule.filename = categoryFile;
categoryModule.paths = Module._nodeModulePaths(path.dirname(categoryFile));
categoryModule.require = id => id === 'next-i18next'
 ? { useTranslation: () => ({ t: key => key }) }
 : Module.prototype.require.call(categoryModule, id);
categoryModule._compile(ts.transpileModule(fs.readFileSync(categoryFile, 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText, categoryFile);
const CategoryRow = categoryModule.exports.default;
const markup = renderToStaticMarkup(React.createElement(React.Fragment, null,
 React.createElement(CategoryRow, { search: {}, onSelect: () => {} }),
 React.createElement(CategoryRow, { search: {}, onSelect: () => {} })));
const clipIds = [...markup.matchAll(/<clipPath id="([^"]+)" clipPathUnits="userSpaceOnUse">/g)].map(match => match[1]);
assert.equal(clipIds.length, 20);
assert.equal(new Set(clipIds).size, 20, 'Repeated rows must have unique clip IDs');
const illustrations = [...markup.matchAll(/<svg viewBox="([^"]+)"[^>]*>([\s\S]*?)<\/svg>/g)];
assert.equal(illustrations.length, 20);
// Measured opaque horizontal bounds in the actual sprite, by reading order.
const vehicleBounds = [[22, 408], [431, 789], [805, 1187], [1202, 1548], [1570, 1966],
 [17, 402], [423, 784], [805, 1179], [1195, 1568], [1586, 1964]];
for (const [index, illustration] of illustrations.entries()) {
 const [x, y, width, height] = illustration[1].split(' ');
 assert(illustration[2].includes(`<rect x="${x}" y="${y}" width="${width}" height="${height}">`));
 assert(illustration[2].includes(`clip-path="url(#${clipIds[index]})"`));
 const vehicleIndex = index % 10;
 const [left, right] = vehicleBounds[vehicleIndex];
 const frameLeft = Number(x), frameRight = frameLeft + Number(width);
 assert(frameLeft < left && frameRight > right, `Vehicle ${vehicleIndex} must remain complete`);
 if (vehicleIndex % 5 > 0) assert(frameLeft >= vehicleBounds[vehicleIndex - 1][1], `Previous car leaks into ${vehicleIndex}`);
 if (vehicleIndex % 5 < 4) assert(frameRight <= vehicleBounds[vehicleIndex + 1][0], `Next car leaks into ${vehicleIndex}`);
}
if (previous) require.extensions['.ts'] = previous; else delete require.extensions['.ts'];
console.log('Home car search passed: 10 categories, combined filters, URL round trips, reset and translations.');
