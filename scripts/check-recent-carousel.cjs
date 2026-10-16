const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let carousel, query, mutationOptions, states = [], cursor = 0;
const cars = Array.from({ length: 9 }, (_, index) => ({ _id: String(index).padStart(24, '0') }));
const div = ({ children, className, component }) => React.createElement(component || 'div', { className }, children);
const button = ({ children, ...props }) => React.createElement('button', props, children);
function load(relative, overrides) {
 const filename = path.resolve(__dirname, '..', relative), loaded = new Module(filename, module);
 loaded.filename = filename;
 loaded.paths = Module._nodeModulePaths(path.dirname(filename));
 loaded.require = id => overrides(id) || shared(id) || Module.prototype.require.call(loaded, id);
 loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
 }).outputText, filename);
 return loaded.exports.default;
}
function shared(id) {
 if (id === 'react') return { ...React, useEffect: () => {}, useState: initial => {
  const slot = cursor++; if (!(slot in states)) states[slot] = initial;
  return [states[slot], value => { states[slot] = typeof value === 'function' ? value(states[slot]) : value; }];
 } };
 if (id === 'next-i18next') return { useTranslation: () => ({ t: (key, values) => key.replace('{{car}}', values?.car || '') }) };
 if (id === '@mui/material') return { Stack: div, Typography: div, Box: div, Alert: div, Skeleton: div, IconButton: button };
 if (id === '@mui/material/IconButton') return button;
 if (id.startsWith('@mui/icons-material/')) return () => React.createElement('svg');
 if (id === 'next/link') return ({ children, href, ...props }) => React.createElement('a', { ...props, href: href.pathname + '?' + new URLSearchParams(href.query).toString() }, children);
 if (id.includes('/apollo/store')) return {};
 if (id === '../../enums/common.enum') return { Direction: { DESC: 'DESC' }, Message: { NOT_AUTHENTICATED: 'Login required' } };
 if (id === '../../enums/car.enum') return { CarStatus: { SOLD: 'SOLD', DELETE: 'DELETE' }, CarCondition: { NEW: 'NEW', USED: 'USED' }, CarFuelType: { ELECTRIC: 'ELECTRIC' } };
 if (id === '../../config') return { imageUrl: value => value ? '/assets/' + value : '/fallback.svg' };
 if (id === '../../car') return { carLabel: value => value };
 if (id === '../../currency') return { formatPrice: value => '₩' + value.toLocaleString('en-US') };
 if (id === '../../compareSelection') return { availableCompareCar: car => car.carStatus === 'ACTIVE' && !car.soldAt && !car.deletedAt };
}
const Section = load('libs/components/homepage/RecentlyAddedCars.tsx', id => {
 if (id === '@apollo/client') return { useMutation: (_, options) => { mutationOptions = options; return [async () => {}]; }, useQuery: (_, options) => { query = options; return { data: { getCars: { list: cars } } }; } };
 if (id.includes('/apollo/user/') || id === '../../sweetAlert') return {};
 if (id === 'swiper') return { Navigation: 'Navigation', Pagination: 'Pagination', Keyboard: 'Keyboard', A11y: 'A11y' };
 if (id === 'swiper/react') return { Swiper: props => { carousel = props; return div(props); }, SwiperSlide: div };
 if (id === './RecentlyAddedCarCard') return () => React.createElement('article');
});
const html = renderToStaticMarkup(React.createElement(Section));
assert.equal(query.variables.input.limit, 9);
assert.equal(query.variables.input.sort, 'createdAt');
assert.equal(query.variables.input.direction, 'DESC');
assert.equal(carousel.slidesPerView, 1);
assert.equal(carousel.breakpoints[600].slidesPerView, 2);
assert.equal(carousel.breakpoints[1440].slidesPerView, 4);
assert.equal(carousel.breakpoints[1440].slidesPerGroup, 4);
for (const selector of [carousel.navigation.prevEl, carousel.navigation.nextEl, carousel.pagination.el]) assert(html.includes(`class="${selector.slice(1)}"`));
assert.equal((html.match(/<article>/g) || []).length, 9);
let favoriteCalls = 0;
const Card = load('libs/components/car/CarCard.tsx', id => id === '@apollo/client' ? { useReactiveVar: () => ({ _id: 'viewer' }) } : null);
const car = { _id: '0123456789abcdef01234567', carTitle: 'Test car', carModel: 'EV', carStatus: 'ACTIVE', carCondition: 'NEW', carFuelType: 'ELECTRIC', carTransmission: 'AUTOMATIC', carYear: 2025, carMileage: 0, carLocation: 'SEOUL', carPrice: 10000000, carImages: ['first.jpg', 'second.jpg'] };
const render = (value = car) => { cursor = 0; return Card({ car: value, variant: 'recent', likeCarHandler: async () => favoriteCalls++ }); };
function all(node) { return !React.isValidElement(node) ? [] : [node, ...React.Children.toArray(node.props.children).flatMap(all)]; }
(async () => {
 const { ApolloClient, InMemoryCache, ApolloLink, Observable, gql } = require('@apollo/client');
 const cache = new InMemoryCache();
 const catalog = gql`query { getCar { _id carModel carLikes brandData { _id brandName } } }`;
 const mutation = gql`mutation { likeTargetCar { _id carModel carLikes brandData { _id brandName } } }`;
 const initial = { __typename: 'Car', _id: car._id, carModel: 'Kona', carLikes: 0, brandData: { __typename: 'Brand', _id: 'brand', brandName: 'Hyundai' } };
 cache.writeQuery({ query: catalog, data: { getCar: initial } });
 const client = new ApolloClient({ cache, link: new ApolloLink(() => Observable.of({ data: { likeTargetCar: { ...initial, carLikes: 1, brandData: null } } })) });
 await client.mutate({ mutation, ...mutationOptions });
 assert.equal(cache.readQuery({ query: catalog }).getCar.brandData.brandName, 'Hyundai', 'Like must not briefly remove the brand from the visible name');
 cache.writeQuery({ query: catalog, data: { getCar: { ...initial, carLikes: 1 } } });
 assert.equal(cache.readQuery({ query: catalog }).getCar.carLikes, 1, 'Authoritative refresh still updates likes');
 client.stop();
 let tree = render();
 const find = predicate => all(tree).find(predicate);
 assert.equal(find(node => node.type === 'img').props.src, '/assets/first.jpg');
 find(node => node.props['aria-label'] === 'Next photo for EV').props.onClick();
 tree = render();
 assert.equal(find(node => node.type === 'img').props.src, '/assets/second.jpg');
 find(node => node.props['aria-label'] === 'Next photo for EV').props.onClick();
 tree = render();
 assert.equal(find(node => node.type === 'img').props.src, '/assets/first.jpg');
 find(node => node.props['aria-label'] === 'Previous photo for EV').props.onClick();
 tree = render();
 assert.equal(find(node => node.type === 'img').props.src, '/assets/second.jpg');
 const compare = find(node => node.props.className === 'recent-compare');
 assert.deepEqual(compare.props.href, { pathname: '/car/compare', query: { ids: car._id } });
 assert.deepEqual(find(node => node.props.className === 'recent-details').props.href, { pathname: '/car/detail', query: { id: car._id } });
 assert.equal(all(tree).filter(node => node.props.href?.pathname === '/car/detail').length, 1, 'Only View Details may open the detail page');
 await find(node => node.props['aria-label'] === 'Add favorite').props.onClick({ preventDefault() {}, stopPropagation() {} });
 await Promise.resolve();
 assert.equal(favoriteCalls, 1);
 const cardHtml = renderToStaticMarkup(tree);
 assert.equal((cardHtml.match(/<dt>/g) || []).length, 3);
 assert(!cardHtml.includes('<dt>Location</dt>'), 'Location belongs beside the title, not in specs');
 assert(cardHtml.includes('cars-listing-location'), 'Keep the existing title-row location');
 assert(cardHtml.includes('0 km'));
 tree = render({ ...car, carImages: [], carStatus: 'SOLD' });
 assert(!find(node => node.props['aria-label'] === 'Next photo for EV'));
 assert.equal(find(node => node.props.className === 'recent-compare').props['aria-disabled'], 'true');
 console.log('Recent cards passed: 9 newest cars, 4/2/1 carousel, controls/dots, gallery wrap, compare/details links, favorite, three specs and unavailable guards.');
})().catch(error => { console.error(error); process.exitCode = 1; });
