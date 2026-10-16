const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');
const React = require('react');

// Exercise existing components with isolated Apollo/router responses; never write live admin data.
let state, refs, effects, cursor, refCursor, effectCursor, scheduled, queries, mutations, confirms, errors;
let ready = true, role = 'ADMIN', confirmation = true, mutationError = false, pageError = false;
let route = { pathname: '/_admin/users', query: {}, isReady: true };
const records = [{ _id: '0123456789abcdef01234567', memberNick: 'Agent', memberType: 'AGENT', memberStatus: 'ACTIVE', createdAt: '2026-10-16', memberCars: 3 }];
const cars = ['ACTIVE', 'SOLD', 'DELETE'].map((status, i) => ({ _id: `car-${i}`, carTitle: `Car ${i}`, carStatus: status, carImages: [] }));
const symbols = {};
const components = new Proxy({}, { get: (_, name) => symbols[name] ||= function Control() {} });
const queriesDocument = { GET_ALL_MEMBERS_BY_ADMIN: 'members', GET_ADMIN_MEMBER_OVERVIEW: 'overview', GET_ALL_CARS_BY_ADMIN: 'cars', GET_ALL_BRANDS_BY_ADMIN: 'brands' };
const mutationDocument = { UPDATE_MEMBER_BY_ADMIN: 'updateMember', UPDATE_CAR_BY_ADMIN: 'updateCar', REMOVE_CAR_BY_ADMIN: 'removeCar' };
const reset = () => { state = []; refs = []; effects = []; scheduled = []; queries = []; mutations = []; confirms = 0; errors = 0; };
const hooks = {
 ...React,
 useState(initial) { const n = cursor++; if (!(n in state)) state[n] = typeof initial === 'function' ? initial() : initial; return [state[n], value => { state[n] = typeof value === 'function' ? value(state[n]) : value; }]; },
 useRef(initial) { return refs[refCursor++] ||= { current: initial }; },
 useEffect(callback, deps) { const n = effectCursor++; if (!effects[n] || deps.some((value, i) => value !== effects[n][i])) { effects[n] = deps; scheduled.push(callback); } },
};
const router = { get pathname() { return route.pathname; }, get query() { return route.query; }, get isReady() { return route.isReady; }, replace(value) { route = { ...route, query: value.query ?? {} }; return Promise.resolve(true); } };
const listResponse = doc => doc === 'members' ? { getAllMembersByAdmin: { list: records, metaCounter: [{ total: 1 }] } } : doc === 'cars' ? { getAllCarsByAdmin: { list: cars, metaCounter: [{ total: 3 }] } } : doc === 'brands' ? { getAllBrandsByAdmin: [] } : Object.fromEntries(['total', 'agents', 'active', 'blocked'].map(key => [key, { metaCounter: [{ total: 4 }] }]));
function load(relative) {
 const filename = path.resolve(__dirname, '..', relative), loaded = new Module(filename, module);
 loaded.filename = filename; loaded.paths = Module._nodeModulePaths(path.dirname(filename));
 loaded.require = id => {
  if (id === 'react') return hooks;
  if (id === 'next/router') return { useRouter: () => router };
  if (id === 'next/link') return components.Link;
  if (id === '@mui/material') return { ...Object.fromEntries(['Avatar', 'MenuItem', 'Select', 'Table', 'TableBody', 'TableCell', 'TableContainer', 'TableHead', 'TableRow', 'IconButton', 'Alert', 'Box', 'Button', 'CircularProgress', 'Stack', 'Tab', 'Tabs', 'TablePagination', 'TextField', 'Typography'].map(key => [key, components[key]])) };
  if (id.startsWith('@mui/icons-material/')) return components.Icon;
  if (id.includes('layout/LayoutAdmin')) return value => value;
  if (id.endsWith('/MemberList')) return { MemberPanelList: components.MemberPanelList };
  if (id.endsWith('/CarList')) return { CarPanelList: components.CarPanelList };
  if (id.endsWith('/member.enum')) return { MemberType: { ADMIN: 'ADMIN', AGENT: 'AGENT', USER: 'USER' }, MemberStatus: { ACTIVE: 'ACTIVE', BLOCK: 'BLOCK', DELETE: 'DELETE' } };
  if (id.endsWith('/car.enum')) return { CarStatus: { ACTIVE: 'ACTIVE', SOLD: 'SOLD', DELETE: 'DELETE' }, CarLocation: { SEOUL: 'SEOUL' } };
  if (id.endsWith('/common.enum')) return { Direction: { DESC: 'DESC' } };
  if (id.endsWith('/config')) return { imageUrl: value => value || '/fallback.svg' };
  if (id.endsWith('/currency')) return { formatPrice: value => value };
  if (id === 'next-i18next') return { useTranslation: () => ({ t: value => value }) };
  if (id.endsWith('apollo/admin/query')) return queriesDocument;
  if (id.endsWith('apollo/admin/mutation')) return mutationDocument;
  if (id.endsWith('apollo/store')) return { userVar: 'user', authReadyVar: 'ready' };
  if (id.endsWith('/sweetAlert')) return { sweetConfirmAlert: async () => { confirms++; return confirmation; }, sweetErrorHandling: async () => { errors++; } };
  if (id === '@apollo/client') return {
   useReactiveVar: key => key === 'user' ? { memberType: role } : ready,
   useQuery: (doc, options) => { queries.push({ doc, ...options }); return { data: listResponse(doc), error: pageError && doc === 'members' ? new Error('offline') : undefined, refetch: async () => ({ data: listResponse(doc) }) }; },
   useMutation: doc => [async options => { mutations.push({ doc, ...options }); if (mutationError) throw new Error('rejected'); return {}; }, { loading: false }],
  };
  return Module.prototype.require.call(loaded, id);
 };
 loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText, filename);
 return loaded.exports;
}
function render(Component) {
 let tree;
 for (let pass = 0; pass < 3; pass++) {
  cursor = 0; refCursor = 0; effectCursor = 0; queries = [];
  tree = Component();
  if (!scheduled.length) break;
  const pending = scheduled; scheduled = []; pending.forEach(effect => effect());
 }
 return tree;
}
function findAll(tree, type) {
 if (!React.isValidElement(tree)) return [];
 return [ ...(tree.type === type ? [tree.props] : []), ...React.Children.toArray(tree.props.children).flatMap(child => findAll(child, type)) ];
}
const find = (tree, type) => { const found = findAll(tree, type); assert(found.length, `Missing ${type.name}`); return found[0]; };

async function main() {
 const Users = load('pages/_admin/users/index.tsx').default;
 reset(); let tree = render(Users);
 assert.equal(queries.find(q => q.doc === 'members').skip, false);
 assert.equal(Object.hasOwn(queries[0].variables.input, 'sort'), false, 'Use the backend default order: its MembersInquiry validator rejects explicit sort values');
 find(tree, components.Tabs).onChange({}, 'BLOCK'); tree = render(Users);
 assert.equal(queries[0].variables.input.search.memberStatus, 'BLOCK');
 const typeFilter = findAll(tree, components.TextField).find(field => field.label === 'Member type');
 typeFilter.onChange({ target: { value: 'AGENT' } }); tree = render(Users);
 assert.equal(queries[0].variables.input.search.memberType, 'AGENT');
 assert.equal(Object.hasOwn(queries[0].variables.input, 'sort'), false, 'Agent filters must not reintroduce the rejected sort input');
 assert.equal(queries[0].variables.input.search.memberStatus, 'BLOCK');
 findAll(tree, components.TextField).find(field => field.label === 'Member type').onChange({ target: { value: 'USER' } }); tree = render(Users);
 assert.equal(queries[0].variables.input.search.memberType, 'USER', 'Changing away from Agents preserves the selected type');
 findAll(tree, components.TextField).find(field => field.label === 'Search by nickname').onChange({ target: { value: '  Agent  ' } }); tree = render(Users);
 find(tree, components.Stack).onSubmit({ preventDefault() {} }); tree = render(Users);
 assert.equal(queries[0].variables.input.search.text, 'Agent');
 const handler = find(tree, components.MemberPanelList).updateMemberHandler;
 confirmation = false; await handler({ _id: records[0]._id, memberStatus: 'BLOCK' }); assert.equal(mutations.length, 0);
 confirmation = true;
 await Promise.all([handler({ _id: records[0]._id, memberStatus: 'BLOCK' }), handler({ _id: records[0]._id, memberStatus: 'DELETE' })]);
 assert.equal(mutations.length, 1, 'Concurrent clicks cannot submit a second change');
 assert.deepEqual(mutations[0].variables.input, { _id: records[0]._id, memberStatus: 'BLOCK' });
 mutationError = true; await handler({ _id: records[0]._id, memberType: 'AGENT' }); assert.equal(errors, 1); mutationError = false;
 tree = render(Users); assert.equal(Boolean(find(tree, components.MemberPanelList).pending), false);
 for (const memberType of ['USER', 'AGENT']) { role = memberType; render(Users); assert(queries.every(q => q.skip)); }
 role = 'ADMIN'; ready = false; render(Users); assert(queries.every(q => q.skip)); ready = true;
 pageError = true; tree = render(Users); assert.equal(findAll(tree, components.MemberPanelList).length, 0); assert.equal(find(tree, components.Alert).severity, 'error'); pageError = false;

 const Members = load('libs/components/admin/users/MemberList.tsx').MemberPanelList;
 let payload; tree = Members({ members: records, pending: false, updateMemberHandler: async value => { payload = value; } });
 const status = findAll(tree, components.Select).find(control => control.value === 'ACTIVE');
 status.onChange({ target: { value: 'BLOCK' } }); assert.deepEqual(payload, { _id: records[0]._id, memberStatus: 'BLOCK' });
 assert(findAll(Members({ members: records, pending: true }), components.Select).every(control => control.disabled));

 reset(); const Cars = load('pages/_admin/cars/index.tsx').default; tree = render(Cars);
 const actions = find(tree, components.CarPanelList);
 await actions.updateCarHandler({ _id: 'car-2', carStatus: 'ACTIVE' }); assert.equal(mutations.length, 0, 'Deleted cars cannot be restored');
 await actions.removeCarHandler('car-0'); assert.equal(mutations.length, 0, 'Only deleted cars can be permanently removed');
 confirmation = false; await actions.updateCarHandler({ _id: 'car-0', carStatus: 'SOLD' }); assert.equal(mutations.length, 0);
 confirmation = true; await actions.updateCarHandler({ _id: 'car-0', carStatus: 'SOLD' });
 assert.deepEqual(mutations[0], { doc: 'updateCar', variables: { input: { _id: 'car-0', carStatus: 'SOLD' } } });
 await actions.removeCarHandler('car-2'); assert.deepEqual(mutations[1], { doc: 'removeCar', variables: { input: 'car-2' } });
 await actions.updateCarHandler({ _id: 'car-1', carStatus: 'ACTIVE' });
 assert.deepEqual(mutations[2], { doc: 'updateCar', variables: { input: { _id: 'car-1', carStatus: 'ACTIVE' } } });
 const CarList = load('libs/components/admin/cars/CarList.tsx').CarPanelList;
 tree = CarList({ cars }); const statuses = findAll(tree, components.Select);
 assert.equal(Boolean(statuses[0].disabled), false); assert.equal(Boolean(statuses[1].disabled), false); assert(statuses[2].disabled);
 assert.deepEqual(React.Children.toArray(statuses[1].children).map(child => child.props.value), ['ACTIVE', 'SOLD']);
 assert.equal(findAll(tree, components.IconButton).length, 1);
 console.log('Admin console passed: role query guards, combined filters, agent routing, search, confirmation/cancel, duplicate prevention, errors, member payloads and allowed car transitions.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
