const assert = require('assert/strict');
const fs = require('fs');
const ts = require('typescript');
// Load client TypeScript in memory without producing build files.
require.extensions['.ts'] = (module, filename) => {
 const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
 }).outputText;
 module._compile(compiled, filename);
};
const { parseCarsInquiry, validateCarInput, carLabel } = require('../libs/car.ts');
const { maxCarYear, imageUrl, REACT_APP_API_URL } = require('../libs/config.ts');
const { CarTransmission, CarLocation } = require('../libs/enums/car.enum.ts');
const { Direction } = require('../libs/enums/common.enum.ts');
const { MemberType } = require('../libs/enums/member.enum.ts');
assert.deepEqual(Object.values(CarTransmission), ['AUTOMATIC', 'MANUAL']);
assert.deepEqual(Object.values(CarLocation), ['SEOUL', 'BUSAN', 'INCHEON', 'DAEGU', 'GYEONGJU', 'GWANGJU', 'CHONJU', 'DAEJEON', 'JEJU']);
assert.deepEqual(Object.values(MemberType).sort(), ['ADMIN', 'AGENT', 'USER']);
assert.equal(JSON.stringify({ direction: Direction.ASC, transmission: CarTransmission.AUTOMATIC, locations: [CarLocation.CHONJU, CarLocation.DAEJEON] }),
 '{"direction":"ASC","transmission":"AUTOMATIC","locations":["CHONJU","DAEJEON"]}');
const invalid = ['{', 'null', '[]', '42'];
for (const value of invalid) assert.deepEqual(parseCarsInquiry(value).search, {});
const input = parseCarsInquiry(JSON.stringify({
 page: -1, limit: 500, sort: 'propertyPrice', search: {
  roomsList: [2], squaresRange: { start: 0, end: 100 }, fuelTypes: ['ELECTRIC', 'HOUSE'],
  yearsRange: { start: 2020, end: 2010 }, locations: ['SEOUL'], brandIds: ['invalid'],
 },
}));
assert.equal(input.page, 1); assert.equal(input.limit, 9); assert.equal(input.sort, 'createdAt');
assert.deepEqual(input.search, { locations: ['SEOUL'], fuelTypes: ['ELECTRIC'] });
const valid = {
 brandId: '0123456789abcdef01234567', carTitle: 'Electric city car', carPrice: 12000,
 carModel: 'Model 3', carYear: 2024, carColor: 'White', carLocation: 'SEOUL',
 carAddress: 'Seoul showroom', carFuelType: 'ELECTRIC', carCondition: 'USED',
 carTransmission: 'AUTOMATIC', carImages: ['uploads/car/example.jpg'],
};
assert.equal(validateCarInput(valid), undefined);
for (const change of [{ carPrice: NaN }, { carYear: maxCarYear + 1 }, { carImages: [] },
 { carTransmission: 'AVTOMATIC' }, { carLocation: 'DAEJON' }, { brandId: 'invalid' }, { carDesc: 'abc' }]) {
 assert.ok(validateCarInput({ ...valid, ...change }));
}
assert.equal(carLabel('AUTOMATIC'), 'Automatic');
assert.equal(carLabel('DAEJEON'), 'Daejeon');
assert.deepEqual(parseCarsInquiry({ search: { transmissions: ['AVTOMATIC', 'AUTOMATIC'], locations: ['DAEJON', 'DAEJEON'] } }).search,
 { transmissions: ['AUTOMATIC'], locations: ['DAEJEON'] });
assert.equal(imageUrl('uploads/car/a.jpg'), `${REACT_APP_API_URL}/uploads/car/a.jpg`);
assert.equal(imageUrl('https://example.com/a.jpg'), 'https://example.com/a.jpg');
assert.equal(imageUrl(undefined), '/img/car/placeholder.svg');
const { Kind } = require('graphql');
let count = 0;
for (const file of ['../apollo/user/query.ts', '../apollo/user/mutation.ts', '../apollo/admin/query.ts', '../apollo/admin/mutation.ts']) {
 for (const document of Object.values(require(file))) {
  const operation = document.definitions.find(definition => definition.kind === Kind.OPERATION_DEFINITION);
  if (!operation) continue;
  assert.ok(!/property|memberProperties|constructedAt|carBeds|carRooms|carSquare|carType/i.test(require('graphql').print(document)));
  count++;
 }
}
console.log(`Migration checks passed; ${count} GraphQL operations parsed with no legacy domain fields.`);

const { CommentGroup } = require('../libs/enums/comment.enum.ts');
const { LikeGroup } = require('../libs/enums/like.enum.ts');
const { ViewGroup } = require('../libs/enums/view.enum.ts');
const { NotificationGroup } = require('../libs/enums/notification.enum.ts');
for (const group of [CommentGroup, LikeGroup, ViewGroup, NotificationGroup]) {
 assert.equal(group.CAR, 'CAR');
 assert.ok(!Object.values(group).includes('PROPERTY'));
}
assert.equal(imageUrl('/uploads/car/a.jpg'), `${REACT_APP_API_URL}/uploads/car/a.jpg`);
assert.equal(imageUrl('/img/profile/defaultUser.svg'), '/img/profile/defaultUser.svg');
assert.deepEqual(parseCarsInquiry({ page: 2, limit: 6, sort: 'carPrice', direction: 'ASC', search: {
 brandIds: ['0123456789abcdef01234567'], transmissions: ['AUTOMATIC'], options: ['carRent'],
} }), { page: 2, limit: 6, sort: 'carPrice', direction: 'ASC', search: {
 brandIds: ['0123456789abcdef01234567'], transmissions: ['AUTOMATIC'], options: ['carRent'],
} });
for (const change of [{ carYear: 1885 }, { carYear: 2024.5 }, { carPrice: Infinity }, { carTitle: 'ab' },
 { carModel: '' }, { carAddress: 'ab' }, { carColor: '' }, { carDesc: 'a'.repeat(501) }]) {
 assert.ok(validateCarInput({ ...valid, ...change }));
}
assert.equal(validateCarInput({ ...valid, carYear: 1886, carDesc: 'a'.repeat(500) }), undefined);
const documents = ({ ...require('../apollo/user/query.ts'), ...require('../apollo/admin/query.ts') });
for (const name of ['GET_CARS', 'GET_AGENT_CARS', 'GET_FAVORITES', 'GET_VISITED', 'GET_ALL_CARS_BY_ADMIN']) {
 const operation = documents[name].definitions.find(definition => definition.kind === Kind.OPERATION_DEFINITION);
 const names = operation.selectionSet.selections[0].selectionSet.selections.map(field => field.name.value);
 assert.deepEqual(names, ['list', 'metaCounter']);
}
for (const name of ['GET_BRANDS', 'GET_ALL_BRANDS_BY_ADMIN']) {
 const operation = ({ ...require('../apollo/user/query.ts'), ...require('../apollo/admin/query.ts') })[name].definitions.find(definition => definition.kind === Kind.OPERATION_DEFINITION);
 assert.ok(!operation.selectionSet.selections[0].selectionSet.selections.some(field => field.name?.value === 'list'));
}
const memberQuery = require('graphql').print(require('../apollo/user/query.ts').GET_MEMBER);
assert.ok(memberQuery.includes('memberCars'));
assert.ok(!memberQuery.includes('memberProperties'));
const path = require('path');
const localeData = ['en', 'kr', 'ru'].map(locale => JSON.parse(fs.readFileSync(path.join(__dirname, '../public/locales', locale, 'common.json'), 'utf8')));
function checkTranslation(key) {
 for (const [i, locale] of localeData.entries()) assert.ok(typeof locale[key] === 'string' && locale[key], `Missing ${['en', 'kr', 'ru'][i]} translation: ${key}`);
}
function inspectSource(directory) {
 for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
  const filename = path.join(directory, entry.name);
  if (entry.isDirectory()) inspectSource(filename);
  else if (/\.tsx?$/.test(entry.name)) {
   const source = fs.readFileSync(filename, 'utf8');
   for (const match of source.matchAll(/\bt\(['"]([^'"]+)['"]\)/g)) checkTranslation(match[1]);
  }
 }
}
inspectSource(path.join(__dirname, '../pages/car'));
inspectSource(path.join(__dirname, '../pages/_admin/cars'));
inspectSource(path.join(__dirname, '../pages/_admin/brands'));
inspectSource(path.join(__dirname, '../libs/components/car'));
inspectSource(path.join(__dirname, '../libs/components/mypage'));
inspectSource(path.join(__dirname, '../libs/components/member'));
require('../next.config.js').redirects().then(async redirects => {
 assert.deepEqual(redirects.map(({ source, destination, permanent }) => [source, destination, permanent]), [
  ['/property/detail', '/car/detail', true], ['/property', '/car', true], ['/_admin/properties', '/_admin/cars', true],
 ]);
 console.log('Car contracts, counters, engagement, images, input boundaries, translations, and redirects passed.');
 await require('./check-foundation-auth.cjs')();
}).catch(error => { console.error(error); process.exitCode = 1; });
