const assert = require('assert/strict');
const fs = require('fs');
const Module = require('module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

for (const extension of ['.ts', '.tsx']) {
	require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, jsx: ts.JsxEmit.React, esModuleInterop: true },
	}).outputText, filename);
}
const load = Module._load;
Module._load = function (name, ...args) {
	if (name === 'next-i18next') return { useTranslation: () => ({ t: key => key, i18n: { language: 'en' } }) };
	return load.call(this, name, ...args);
};
const Table = require('../libs/components/car/CarComparisonTable.tsx').default;
const { formatCarMileage } = require('../libs/carCompare.ts');
const cars = [0, null, 28000].map((carMileage, index) => ({
	_id: `${index}123456789abcdef01234567`, carMileage, carPrice: 20000 + index,
	carYear: 2024, carModel: `Model ${index}`, carTitle: `Car ${index}`, carImages: [],
	carCondition: 'USED', carFuelType: 'GASOLINE', carTransmission: 'AUTOMATIC',
	carLocation: 'SEOUL', carColor: 'White', carBarter: false, carRent: false,
}));
for (const count of [2, 3]) {
	const html = renderToStaticMarkup(React.createElement(Table, { cars: cars.slice(0, count), onRemove: () => {} }));
	const body = html.match(/<tbody>(.*?)<\/tbody>/s)[1];
	const rows = body.match(/<tr\b.*?<\/tr>/gs);
	assert.equal(rows.length, 12, 'Preserve all supported fields');
	rows.forEach(row => assert.equal((row.match(/<td\b/g) || []).length, count, 'Aligned listing columns'));
	const mileage = rows.find(row => row.includes('>Mileage</th>'));
	assert.ok(mileage.includes('>0 km</td>'), 'Zero mileage stays zero');
	assert.ok(mileage.includes('>\u2014</td>'), 'Missing mileage uses an em dash');
	if (count === 3) assert.ok(mileage.includes('>28,000 km</td>'));
	cars.slice(0, count).forEach(car => assert.ok(html.includes(`/car/detail?id=${car._id}`), 'Correct listing detail URL'));
}
assert.equal(formatCarMileage({ carMileage: undefined }, 'en'), undefined, 'Shared homepage formatter stays unchanged');
console.log('Results checks passed: two/three columns, twelve fields, missing/zero/nonzero mileage and detail URLs.');
