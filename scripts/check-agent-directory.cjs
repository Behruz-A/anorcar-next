const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');
const React = require('react');

let slots = [], refs = [], deps = [], cursor = 0, refCursor = 0, effectCursor = 0, effects = [], request, mutationCalls = [], alerts = 0, compact = false;
const user = { _id: 'viewer' };
const agent = { _id: 'agent', memberNick: 'Ryan', memberCars: 13, memberViews: 2, memberLikes: 1, memberAddress: 'Seoul', agentType: 'INDEPENDENT', agentLanguages: ['ENGLISH'], meFollowed: [{ myFollowing: false }] };
const agents = Array.from({ length: 9 }, (_, index) => ({ ...agent, _id: `agent-${index}` }));
const components = new Proxy({}, { get: (target, key) => target[key] ||= function Control() {} });
const router = { pathname: '/agent', query: {}, isReady: true, push(value) { this.query = value.query; return Promise.resolve(true); } };
const hooks = { ...React, useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; }, useRef(initial) { return refs[refCursor++] ||= { current: initial }; }, useEffect(callback, values) { const index = effectCursor++; if (!deps[index] || values.some((value, i) => value !== deps[index][i])) { deps[index] = values; effects.push(callback); } } };
function load(relative) {
 const filename = path.resolve(__dirname, '..', relative), loaded = new Module(filename, module);
 loaded.filename = filename; loaded.paths = Module._nodeModulePaths(path.dirname(filename));
 loaded.require = id => {
  if (id === 'react') return hooks;
  if (id === 'next/router') return { useRouter: () => router };
  if (id === 'next-i18next') return { useTranslation: () => ({ t: key => key }) };
  if (id === 'next-i18next/serverSideTranslations') return {};
  if (id === '@mui/material') return new Proxy({}, { get: (_, key) => key === 'useMediaQuery' ? () => compact : components[key] });
  if (id.startsWith('@mui/icons-material/')) return components.Icon;
  if (id === 'next/link') return components.Link;
  if (id === 'next/image') return components.Image;
  if (id.includes('layout/LayoutBasic')) return value => value;
  if (id.endsWith('/AgentCard')) return components.AgentCard;
  if (id.endsWith('/member.enum')) return load('libs/enums/member.enum.ts');
  if (id.endsWith('/car.enum')) return load('libs/enums/car.enum.ts');
  if (id.endsWith('/common.enum')) return { Direction: { ASC: 'ASC', DESC: 'DESC' } };
  if (id.endsWith('/car')) return { carLabel: value => value.charAt(0) + value.slice(1).toLowerCase() };
  if (id.endsWith('/config')) return { Messages: { error2: 'Login required' }, imageUrl: value => value };
  if (id.endsWith('/sweetAlert')) return { sweetMixinErrorAlert: async () => { alerts++; }, sweetTopSmallSuccessAlert: async () => {} };
  if (id.endsWith('apollo/user/query')) return { GET_AGENTS: 'agents' };
  if (id.endsWith('apollo/user/mutation')) return { LIKE_TARGET_MEMBER: 'like', SUBSCRIBE: 'follow', UNSUBSCRIBE: 'unfollow' };
  if (id.endsWith('apollo/store')) return { userVar: {} };
  if (id === '@apollo/client') return { useReactiveVar: () => user, useMutation: doc => [async value => { mutationCalls.push({ doc, ...value }); }], useQuery: (_, options) => { request = options; return { data: { getAgents: { list: agents, metaCounter: [{ total: 27 }] } }, refetch: async () => ({}) }; } };
  return Module.prototype.require.call(loaded, id);
 };
 loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText, filename);
 return loaded.exports;
}
function render(Component, props) { let tree; for (let pass = 0; pass < 4; pass++) { cursor = 0; refCursor = 0; effectCursor = 0; tree = Component(props); if (!effects.length) break; const callbacks = effects; effects = []; callbacks.forEach(effect => effect()); } return tree; }
function all(tree, type) { if (!React.isValidElement(tree)) return []; return [...(tree.type === type ? [tree.props] : []), ...React.Children.toArray(tree.props.children).flatMap(child => all(child, type)), ...all(tree.props.control, type)]; }
const find = (tree, type, predicate = () => true) => { const result = all(tree, type).find(predicate); assert(result, 'Expected control'); return result; };
async function main() {
 const Page = load('pages/agent/index.tsx').default;
 let tree = render(Page);
 assert.equal(request.variables.input.limit, 9); assert.equal(request.variables.input.sort, 'createdAt');
 assert.equal(all(tree, components.AgentCard).length, 9);
 find(tree, components.TextField).onChange({ target: { value: 'Seoul' } }); tree = render(Page);
 find(tree, components.FormControlLabel, item => item.label === 'Dealership').control.props.onChange({ target: { checked: true } }); tree = render(Page);
 find(tree, components.FormControlLabel, item => item.label === 'English').control.props.onChange({ target: { checked: true } }); tree = render(Page);
 find(tree, components.RadioGroup).onChange({ target: { value: '11' } }); tree = render(Page);
 find(tree, 'form', item => item.className === 'agents-filters').onSubmit({ preventDefault() {} }); tree = render(Page);
 assert.deepEqual(request.variables.input.search, { location: 'Seoul', agentTypes: ['DEALERSHIP'], languages: ['ENGLISH'], minCars: 11, maxCars: 50 });
 find(tree, components.Select).onChange({ target: { value: 'oldest' } }); tree = render(Page);
 assert.equal(request.variables.input.direction, 'ASC'); assert.equal(request.variables.input.search.location, 'Seoul');
 find(tree, components.Pagination).onChange({}, 2); tree = render(Page); assert.equal(request.variables.input.page, 2);
 const card = find(tree, components.AgentCard);
 await card.followMemberHandler(user, 'other', false); await card.followMemberHandler(user, 'other', true);
 assert.deepEqual(mutationCalls.map(call => call.doc), ['follow', 'unfollow']);
 await card.likeMemberHandler({ _id: '' }, 'other'); assert.equal(alerts, 1); assert.equal(mutationCalls.length, 2);
 find(tree, components.Button, button => button.children === 'Clear all').onClick(); tree = render(Page); assert.deepEqual(request.variables.input.search, {}); assert.equal(request.variables.input.page, 1);
 compact = true; tree = render(Page); assert.equal(all(tree, 'aside').length, 0); assert.equal(all(tree, components.Drawer).length, 1);
 slots = []; refs = []; deps = []; effects = [];
 const Card = load('libs/components/common/AgentCard.tsx').default;
 let follows = 0, likes = 0;
 tree = render(Card, { agent, likeMemberHandler: async () => { likes++; }, followMemberHandler: async () => { follows++; } });
 await find(tree, components.Button).onClick(); await find(tree, components.IconButton).onClick(); assert.equal(follows, 1); assert.equal(likes, 1);
 tree = render(Card, { agent: { ...agent, _id: user._id }, likeMemberHandler: async () => { likes++; }, followMemberHandler: async () => { follows++; } });
 assert.equal(all(tree, components.Button).length, 0); assert.equal(find(tree, components.IconButton).disabled, true);
 console.log('Agent directory passed: combined filters, 9-card pagination, preserved sorting, follow/unfollow, guest/self guards, clear-all and mobile drawer.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
