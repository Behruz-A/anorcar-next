const assert = require('assert/strict');
const fs = require('fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText, filename);
const { rangeDrafts, rangeBounds, validateRange, applyBrowseDraft, escapeSearchText, displaySearchText } = require('../libs/components/car/browseFilter.ts');
const { parseCarsInquiry } = require('../libs/car.ts');
const blank = rangeDrafts({});
for (const key of ['yearsRange', 'pricesRange']) {
 const bounds = rangeBounds(key);
 assert.equal(validateRange(key, blank[key]).range, undefined);
 assert.deepEqual(validateRange(key, { start: '', end: String(bounds.end) }).range, bounds);
 assert.deepEqual(validateRange(key, { start: String(bounds.start), end: '' }).range, bounds);
 for (const value of ['-1', '1.5', 'Infinity', 'abc', '1e3', String(bounds.end + 1)]) assert.equal(validateRange(key, { start: value, end: '' }).error, 'bounds');
 assert.equal(validateRange(key, { start: String(bounds.start + 1), end: String(bounds.start) }).error, 'order');
}
assert.deepEqual(validateRange('pricesRange', { start: '', end: '25000' }).range, { start: 0, end: 25000 });
assert.deepEqual(validateRange('yearsRange', { start: '2020', end: '' }).range, { start: 2020, end: rangeBounds('yearsRange').end });
assert.deepEqual(rangeDrafts({ yearsRange: { start: 2020, end: 2024 } }).yearsRange, { start: '2020', end: '2024' });
assert.deepEqual(rangeDrafts({ pricesRange: { start: 0, end: 25000 } }).pricesRange, { start: '', end: '25000' });
const search = { text: 'Model (2024)+', brandIds: ['0123456789abcdef01234567'], locations: ['SEOUL'] };
const untouched = applyBrowseDraft(search, blank, displaySearchText(search.text), false);
assert.equal(untouched.text, search.text, 'incoming URL search syntax is preserved until edited');
const edited = applyBrowseDraft(search, blank, search.text, true);
assert.equal(edited.text, 'Model \\(2024\\)\\+');
assert.equal(displaySearchText(edited.text), search.text);
assert.equal(escapeSearchText('[a].*'), '\\[a\\]\\.\\*');
assert.deepEqual(edited.brandIds, search.brandIds);
assert.equal(applyBrowseDraft(search, { ...blank, pricesRange: { start: '2', end: '1' } }, '', true), undefined);
assert.equal(applyBrowseDraft(search, blank, '', true).text, undefined);
const inquiry = { page: 1, limit: 9, sort: 'carPrice', direction: 'ASC', search: applyBrowseDraft(search, { ...blank, pricesRange: { start: '', end: '25000' } }, search.text, true) };
assert.deepEqual(parseCarsInquiry(JSON.stringify(inquiry)).search.pricesRange, { start: 0, end: 25000 });
assert.ok(!Object.keys(inquiry.search).some(key => ['model', 'min', 'max'].includes(key)));
console.log('Cars browse checks passed: independent range drafts, inclusive integer inquiry bounds, invalid input, existing URL text, literal edited search, and unchanged supported fields.');

// Verify the running backend's actual inclusive range behavior without writes.
(async () => {
 const query = 'query BrowseRangeCheck($input: CarsInquiry!) { getCars(input: $input) { list { _id carPrice carYear } metaCounter { total } } }';
 const read = async (search, limit = 100) => {
  const response = await fetch('http://localhost:3007/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables: { input: { page: 1, limit, sort: 'createdAt', direction: 'DESC', search } } }) });
  assert.equal(response.status,200);
  const result = await response.json(); assert.ok(!result.errors,JSON.stringify(result.errors)); return result.data.getCars.list;
 };
 const inventory = await read({});
 const car = inventory.find(item=>Number.isInteger(item.carPrice));
 assert.ok(car,'a real integer-priced listing is required for range boundary QA');
 const brandsResponse = await fetch('http://localhost:3007/graphql',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'query { getBrands { _id } }'})});
 const brands = (await brandsResponse.json()).data.getBrands;
 if(brands[0]) {
  const branded = await read({brandIds:[brands[0]._id]},9);
  assert.ok(Array.isArray(branded));
  const fullQuery = require('graphql').print(require('../apollo/user/query.ts').GET_CARS);
  const fullResponse = await fetch('http://localhost:3007/graphql',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:fullQuery,variables:{input:{page:1,limit:9,sort:'createdAt',direction:'DESC',search:{brandIds:[brands[0]._id]}}}})});
  const fullData = await fullResponse.json(); assert.ok(!fullData.errors,JSON.stringify(fullData.errors)); assert.ok(Array.isArray(fullData.data.getCars.list));
 }
 const priceMatch = await read({ pricesRange: { start: car.carPrice, end: car.carPrice } });
 assert.ok(priceMatch.some(item=>item._id===car._id)); assert.ok(priceMatch.every(item=>item.carPrice===car.carPrice));
 const yearMatch = await read({ yearsRange: { start: car.carYear, end: car.carYear } });
 assert.ok(yearMatch.some(item=>item._id===car._id)); assert.ok(yearMatch.every(item=>item.carYear===car.carYear));
 const lower = await read({pricesRange:{start:car.carPrice,end:2147483647}});
 assert.ok(lower.some(item=>item._id===car._id)); assert.ok(lower.every(item=>item.carPrice>=car.carPrice));
 const upper = await read({pricesRange:{start:0,end:car.carPrice}});
 assert.ok(upper.some(item=>item._id===car._id)); assert.ok(upper.every(item=>item.carPrice<=car.carPrice));
 console.log('Live backend range checks passed: required start/end fields, inclusive price/year equality and supported one-sided UI fallbacks. No data writes.');
})().catch(error=>{ console.error(error); process.exitCode=1; });
