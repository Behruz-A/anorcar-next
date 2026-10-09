const assert = require('assert/strict');
const fs = require('fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
}).outputText, filename);

const { selectCompareCar, formatCarMileage, MAX_COMPARE_CARS, parseCompareIds } = require('../libs/carCompare.ts');
const { validateCarInput } = require('../libs/car.ts');
const a = { _id: 'a', carMileage: null };
const b = { _id: 'b', carMileage: 0 };
const c = { _id: 'c', carMileage: 28000 };
const d = { _id: 'd' };
assert.deepEqual(selectCompareCar([null, null, null], a, 2), [null, null, a], 'Third slot can be selected first');
assert.deepEqual(selectCompareCar([a, null, null], { ...a, carMileage: 900 }, 1), [a, null, null], 'A duplicate must not replace the selected listing');
assert.deepEqual(selectCompareCar([a, null, c], b, 1), [a, b, c]);
assert.deepEqual(selectCompareCar([a, b, c], d, 3), [a, b, c], 'The fourth slot must not exist');
assert.deepEqual(selectCompareCar([a, null, null], d, 0), [a, null, null], 'An occupied slot must not be replaced');
for (const index of [-1, 1.5, NaN]) assert.deepEqual(selectCompareCar([null, null, null], a, index), [null, null, null]);
assert.equal(MAX_COMPARE_CARS, 3);
const ids = ['0123456789abcdef01234567', '1123456789abcdef01234567', '2123456789abcdef01234567', '3123456789abcdef01234567'];
assert.deepEqual(parseCompareIds(undefined), []);
assert.deepEqual(parseCompareIds('invalid,../../secret'), []);
assert.deepEqual(parseCompareIds([ids[0], ids[0].toUpperCase(), ...ids]), ids.slice(0, 3), 'URL IDs must be valid, unique and capped at three');
assert.equal(formatCarMileage(a, 'en'), undefined, 'Unknown mileage must not become zero');
assert.equal(formatCarMileage(d, 'en'), undefined);
assert.equal(formatCarMileage(b, 'en'), '0 km');
assert.equal(formatCarMileage(c, 'en'), '28,000 km');
assert.equal(formatCarMileage({ carMileage: -1 }, 'en'), undefined);
assert.equal(formatCarMileage({ carMileage: 1.5 }, 'en'), undefined);

const valid = {
	brandId: '0123456789abcdef01234567', carTitle: 'Electric city car', carPrice: 12000,
	carModel: 'Model 3', carYear: 2024, carColor: 'White', carLocation: 'SEOUL',
	carAddress: 'Seoul showroom', carFuelType: 'ELECTRIC', carCondition: 'USED',
	carTransmission: 'AVTOMATIC', carImages: ['uploads/car/example.jpg'],
};
for (const carMileage of [undefined, null, 0, 28000, 2147483647]) assert.equal(validateCarInput({ ...valid, carMileage }), undefined);
for (const carMileage of [-1, 1.5, NaN, Infinity, 2147483648, '28000']) assert.ok(validateCarInput({ ...valid, carMileage }));

for (const locale of ['en', 'kr', 'ru']) {
	const data = JSON.parse(fs.readFileSync(`public/locales/${locale}/common.json`, 'utf8'));
	for (const key of ['Compare Cars', 'Compare now', 'Mileage', 'Not provided', 'Show differences only']) {
		assert.ok(data[key] && !data[key].includes('???'), `${locale}: ${key}`);
	}
	assert.ok(data['{{selected}} of {{max}} cars selected'].includes('{{selected}}') && data['{{selected}} of {{max}} cars selected'].includes('{{max}}'));
}
console.log('Compare checks passed: maximum three, duplicate prevention, unknown/zero mileage, input boundaries and localized labels.');
