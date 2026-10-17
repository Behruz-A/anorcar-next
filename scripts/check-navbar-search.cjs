const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');
const React = require('react');

// Exercise the existing Top component using isolated router/Apollo responses.
let slots = [], cursor = 0, effects = [], queries = [], navigation, navigationOptions, failure = false, user = {}, device = 'pc';
const brands = ['BMW', 'Hyundai', 'MERCEDES-BENZ', 'KIA', 'AUDI', 'TESLA', 'GENESIS'].map((brandName, i) => ({ _id: String(i).padStart(24, '0'), brandName }));
const car = { _id: 'car', brandId: brands[0]._id, carModel: 'X5', carTitle: 'BMW X5', carImages: ['/img/car/placeholder.svg'], carYear: 2024, carPrice: 30000000, carLocation: 'SEOUL' };
const components = new Proxy({}, { get: (target, name) => target[name] ||= function Control() {} });
const router = { pathname: '/', asPath: '/', locale: 'en', push(value, _as, options) { navigation = value; navigationOptions = options; return Promise.resolve(true); } };
const defaults = { page: 1, limit: 9, sort: 'createdAt', direction: 'DESC', search: {} };
const hooks = { ...React, useState(initial) { const slot = cursor++; if (!(slot in slots)) slots[slot] = initial; return [slots[slot], value => { slots[slot] = typeof value === 'function' ? value(slots[slot]) : value; }]; }, useEffect(callback) { effects.push(callback); }, useCallback: callback => callback };
const filename = path.resolve(__dirname, '../libs/components/Top.tsx'), loaded = new Module(filename, module);
loaded.filename = filename; loaded.paths = Module._nodeModulePaths(path.dirname(filename));
loaded.require = id => {
 if (id === 'react') return hooks;
 if (id === 'next/router') return { useRouter: () => router, withRouter: value => value };
 if (id === 'next-i18next') return { useTranslation: () => ({ t: key => key, i18n: {} }) };
 if (id === 'next/link') return components.Link;
 if (id.endsWith('/useDeviceDetect')) return () => device;
 if (id.endsWith('/auth')) return { hydrateUser() {}, logOut() {} };
 if (id.endsWith('apollo/store')) return { userVar: {} };
 if (id.endsWith('apollo/user/query')) return { GET_BRANDS: 'brands', GET_CARS: 'cars' };
 if (id === '@apollo/client') return { useReactiveVar: () => user, useQuery: (doc, options) => { queries.push({ doc, ...options }); return { data: doc === 'brands' ? { getBrands: brands } : { getCars: { list: [car, { ...car, _id: 'duplicate' }] } }, error: doc === 'cars' && failure ? new Error('offline') : undefined, refetch: async () => ({}) }; } };
 if (id === '@mui/material') return Object.fromEntries(['Stack', 'Box', 'Popover', 'TextField', 'InputAdornment', 'IconButton', 'CircularProgress', 'Alert'].map(key => [key, components[key]]));
 if (id === '@mui/material/styles') return { alpha: value => value, styled: () => () => components.StyledMenu };
 if (id.startsWith('@mui/material/')) return components[id.split('/').pop()];
 if (id === '@mui/icons-material') return { Logout: components.Icon };
 if (id.startsWith('@mui/icons-material')) return components.Icon;
 if (id === 'phosphor-react') return { CaretDown: components.Icon };
 if (id.endsWith('/config')) return { REACT_APP_API_URL: '', brandLogoUrl: name => '/img/brands/' + name.toLowerCase() + '-logo.svg', imageUrl: value => value };
 if (id.endsWith('/car')) return { defaultCarsInquiry: defaults, carLabel: value => value };
 if (id.endsWith('/currency')) return { formatPrice: value => '₩' + value };
 if (id.endsWith('/browseFilter')) return { escapeSearchText: value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') };
 return Module.prototype.require.call(loaded, id);
};
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText, filename);
const Top = loaded.exports.default;
function render() { cursor = 0; effects = []; queries = []; return Top(); }
function all(tree, type) { return !React.isValidElement(tree) ? [] : [...(tree.type === type ? [tree.props] : []), ...React.Children.toArray(tree.props.children).flatMap(child => all(child, type))]; }
const get = (tree, type) => { const values = all(tree, type); assert(values.length, 'Expected control'); return values[0]; };
let tree = render(); assert(queries.every(query => query.skip));
const trigger = all(tree, components.IconButton).find(button => button['aria-label'] === 'Search cars');
assert.equal(trigger['aria-expanded'], false); trigger.onClick({ currentTarget: { id: 'trigger' } });
tree = render(); const popup = get(tree, components.Popover); assert.equal(popup.open, true); assert(queries.every(query => !query.skip));
assert.equal(queries[1].variables.input.sort, 'carViews');
assert.equal(all(tree, 'button').length, 6, 'Only existing brand records are offered');
assert.equal(all(tree, components.Link).filter(link => link.href?.query?.input).length, 1, 'Duplicate model suggestions are removed');
all(tree, 'button')[0].onClick(); tree = render(); assert.deepEqual(queries[1].variables.input.search, { brandIds: [brands[0]._id] });
get(tree, 'form').onSubmit({ preventDefault() {} }); assert.deepEqual(JSON.parse(navigation.query.input).search, { brandIds: [brands[0]._id] });
tree = render(); assert.equal(get(tree, components.Popover).open, false);
trigger.onClick({ currentTarget: {} }); tree = render();
get(tree, components.TextField).onChange({ target: { value: 'A+B' } }); tree = render();
get(tree, 'form').onSubmit({ preventDefault() {} }); assert.equal(JSON.parse(navigation.query.input).search.text, 'A\\+B', 'Regex punctuation is escaped on submit');
trigger.onClick({ currentTarget: {} }); failure = true; tree = render(); assert.equal(get(tree, components.Alert).severity, 'error'); failure = false;
get(tree, components.Popover).onClose(); tree = render(); assert.equal(get(tree, components.Popover).open, false);
const oldWindow = global.window, oldStorage = global.localStorage;
let scrollHandler, removedHandler;
global.window = { scrollY: 0, addEventListener(name, callback, options) { assert.equal(name, 'scroll'); assert.equal(options.passive, true); scrollHandler = callback; }, removeEventListener(_name, callback) { removedHandler = callback; } };
global.localStorage = { setItem() {} };
const cleanupScroll = effects[0]();
window.scrollY = 100; scrollHandler(); tree = render();
assert(get(tree, components.Stack).className.includes('is-scrolled'));
window.scrollY = 0; scrollHandler(); tree = render();
assert(!get(tree, components.Stack).className.includes('is-scrolled'));
cleanupScroll(); assert.equal(removedHandler, scrollHandler);
assert(all(tree, components.Link).some(link => link.href === '/account/join'));
for (const pathname of ['/', '/car', '/car/compare', '/agent', '/community', '/mypage', '/cs']) {
 router.pathname = pathname; router.asPath = pathname;
 for (const role of ['USER', 'AGENT', 'ADMIN']) for (const mode of ['pc', 'mobile']) {
  user = { _id: 'viewer', memberType: role };
  device = mode; tree = render();
  assert(all(tree, components.Link).some(link => link.href === pathname && link['aria-current'] === 'page'));
  assert(all(tree, components.Link).some(link => link.href === '/mypage?category=myFavorites'));
  assert.equal(all(tree, components.MenuItem).some(item => item.href === '/_admin/users'), role === 'ADMIN');
  const account = all(tree, components.Box).find(box => box['aria-label'] === 'Account menu');
  assert(account && account['aria-haspopup'] === 'menu');
 }
}
all(tree, components.Box).find(box => box['aria-label'] === 'Account menu').onClick({ currentTarget: { id: 'account' } });
tree = render(); assert.equal(get(tree, components.Menu).open, true);
get(tree, components.Menu).onClose(); tree = render();
assert.equal(get(tree, components.Menu).open, false);
all(tree, components.Button).find(button => button.className === 'btn-lang').onClick({ currentTarget: { id: 'language' } });
tree = render(); assert.equal(get(tree, components.StyledMenu).open, true);
for (const locale of ['en', 'kr', 'ru']) {
 all(tree, components.MenuItem).find(item => item.id === locale).onClick({ currentTarget: { id: locale } });
 assert.equal(navigationOptions.locale, locale);
 tree = render(); assert.equal(get(tree, components.StyledMenu).open, false);
}
global.window = oldWindow; global.localStorage = oldStorage;
console.log('Navbar search passed: lazy queries, open/close, real brands, model deduplication, brand filtering, submit routing, escaped input and error state.');
console.log('Shared navbar passed: scroll appearance/cleanup, guest/USER/AGENT/ADMIN controls, account/language menus, active public routes, desktop/mobile branches and EN/KR/RU switching.');
