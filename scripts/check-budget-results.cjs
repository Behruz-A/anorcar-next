// Read-only integration check against a running matching backend.
// Counts, pages, ordering and references must describe the same visible car set.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const previous = require.extensions['.ts'];
require.extensions['.ts'] = (loaded, filename) => loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
}).outputText, filename);
const { carBudgets, budgetCarsInquiry } = require('../libs/carBudgets.ts');
const { parseCarsInquiry } = require('../libs/car.ts');
if (previous) require.extensions['.ts'] = previous; else delete require.extensions['.ts'];
const endpoint = process.env.BUDGET_CHECK_API_URL || 'http://localhost:3007/graphql';
const query = `query BudgetResults($input:CarsInquiry!){getCars(input:$input){list{_id carPrice carStatus memberId brandId memberData{_id} brandData{_id}}metaCounter{total}}}`;
async function request(input) {
 const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { input } }), signal: AbortSignal.timeout(30000) });
 assert(response.ok, `GraphQL HTTP ${response.status}`);
 const result = await response.json();
 assert(!result.errors, JSON.stringify(result.errors));
 return result.data.getCars;
}
(async () => {
 for (const budget of carBudgets) {
  // Use the actual shortcut's serialized URL and the actual Cars route parser.
  const input = parseCarsInquiry(JSON.stringify(budgetCarsInquiry(budget.maxPrice)));
  const first = await request(input), total = first.metaCounter[0]?.total || 0;
  const cars = [];
  for (let page = 1; page <= Math.max(1, Math.ceil(total / input.limit)); page++) {
   const result = page === 1 ? first : await request({ ...input, page });
   assert.equal(result.metaCounter[0]?.total || 0, total, 'Inventory changed during the check');
   assert.equal(result.list.length, Math.min(input.limit, Math.max(0, total - (page - 1) * input.limit)), `${budget.key}: incomplete/empty page ${page} while count claims available cars`);
   cars.push(...result.list);
  }
  assert.equal(cars.length, total);
  assert.equal(new Set(cars.map(car => car._id)).size, total, `${budget.key}: duplicate IDs across pages`);
  for (let i = 0; i < cars.length; i++) {
   const car = cars[i];
   assert.equal(car.carStatus, 'ACTIVE');
   assert.equal(car.memberData?._id, car.memberId);
   assert.equal(car.brandData?._id, car.brandId);
   assert(car.carPrice >= 0 && (budget.maxPrice === undefined || car.carPrice <= budget.maxPrice));
   if (i) assert(cars[i - 1].carPrice <= car.carPrice, `${budget.key}: price ordering changed`);
  }
  const afterLast = await request({ ...input, page: Math.ceil(total / input.limit) + 1 });
  assert.equal(afterLast.list.length, 0);
  assert.equal(afterLast.metaCounter[0]?.total || 0, total);
  console.log(`${budget.key}: ${total} visible cars; all pages, joins and price bounds passed`);
 }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
