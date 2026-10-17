const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let user = { _id: 'viewer' }, interact, carousel;
const calls = [];
const agent = { _id: 'agent', memberNick: 'Test Agent', memberCars: 14, memberViews: 6 };
const agents = [agent];
const div = ({ children, className }) => React.createElement('div', { className }, children);
function load(file, overrides) {
 const filename = path.resolve(__dirname, '..', file), loaded = new Module(filename, module);
 loaded.filename = filename;
 loaded.paths = Module._nodeModulePaths(path.dirname(filename));
 loaded.require = id => overrides(id) || Module.prototype.require.call(loaded, id);
 loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
 }).outputText, filename);
 return loaded.exports.default;
}
const shared = id => {
 if (id === 'next-i18next') return { useTranslation: () => ({ t: value => value }) };
 if (id.startsWith('@mui/icons-material/')) return () => React.createElement('svg');
 if (id === '@mui/material') return { Stack: div, Alert: div, CircularProgress: div,
  IconButton: ({ children, ...props }) => React.createElement('button', props, children),
  Button: ({ children, startIcon, variant, ...props }) => React.createElement('button', props, startIcon, children) };
 if (id === 'next/link') return ({ children, href, ...props }) => React.createElement('a', { ...props, href: typeof href === 'string' ? href : `${href.pathname}?agentId=${href.query.agentId}` }, children);
};
const TopAgents = load('libs/components/homepage/TopAgents.tsx', id => {
 if (id === 'react') return { ...React, useState: () => [agents, () => {}], useEffect: () => {} };
 if (id === 'next/router') return { useRouter: () => ({ push: async route => calls.push(route) }) };
 if (id === '@apollo/client') return {
  useReactiveVar: () => user,
  useMutation: name => [async options => calls.push([name, options.variables.input])],
  useQuery: () => ({ data: {}, refetch: async () => calls.push('refetch') }),
 };
 if (id === './TopAgentCard') return props => { interact = props.onInteract; return React.createElement('article'); };
 if ((id === 'swiper' || id === 'swiper/modules')) return { Navigation: 'Navigation', Keyboard: 'Keyboard', A11y: 'A11y' };
 if (id === 'swiper/react') return { Swiper: props => { carousel = props; return div(props); }, SwiperSlide: div };
 if (id === '../../../apollo/user/mutation') return { SUBSCRIBE: 'subscribe', UNSUBSCRIBE: 'unsubscribe', LIKE_TARGET_MEMBER: 'like' };
 if (id === '../../../apollo/store' || id === '../../../apollo/user/query') return {};
 if (id === '../../enums/common.enum') return { Direction: { DESC: 'DESC' } };
 if (id === '../../sweetAlert') return { sweetErrorHandling: async () => calls.push('error') };
 return shared(id);
});
const Card = load('libs/components/homepage/TopAgentCard.tsx', id => {
 if (id === '../../config') return { imageUrl: value => value };
 if (id === 'next/image') return ({ unoptimized, fill, ...props }) => React.createElement('img', props);
 return shared(id);
});
(async () => {
 renderToStaticMarkup(React.createElement(TopAgents, { initialInput: { sort: 'memberRank' } }));
 assert.equal(carousel.slidesPerView, 1.15);
 assert.equal(carousel.breakpoints[600].slidesPerView, 2);
 assert.equal(carousel.breakpoints[1440].slidesPerView, 4);
 await interact(agent, 'follow');
 assert.deepEqual(calls.splice(0), [['subscribe', 'agent'], 'refetch']);
 await interact({ ...agent, meFollowed: [{ myFollowing: true }] }, 'follow');
 assert.deepEqual(calls.splice(0), [['unsubscribe', 'agent'], 'refetch']);
 await interact(agent, 'like');
 assert.deepEqual(calls.splice(0), [['like', 'agent'], 'refetch']);
 await interact({ ...agent, _id: 'viewer' }, 'follow');
 assert.equal(calls.length, 0);
 user = { _id: '' };
 renderToStaticMarkup(React.createElement(TopAgents, { initialInput: { sort: 'memberRank' } }));
 await interact(agent, 'follow');
 assert.deepEqual(calls.splice(0), ['/account/join']);
 const html = renderToStaticMarkup(React.createElement(Card, { agent, isSelf: false, onInteract: async () => {} }));
 assert(html.includes('View Agent'));
 assert(html.includes('aria-pressed="false"'));
 assert(html.includes('/agent/detail?agentId=agent'));
 for (const anchor of html.matchAll(/<a\b[^>]*>([^]*?)<\/a>/g)) assert(!anchor[1].includes('<button'), 'Action buttons must not be nested inside profile links');
 const self = renderToStaticMarkup(React.createElement(Card, { agent, isSelf: true, onInteract: async () => {} }));
 assert(!self.includes('<button'));
 const followed = renderToStaticMarkup(React.createElement(Card, { agent: { ...agent, meFollowed: [{ myFollowing: true }] }, isSelf: false, onInteract: async () => {} }));
 assert(followed.includes('Following'));
 console.log('Top Agent cards passed: responsive counts, subscribe/unsubscribe/like/refetch, guest/self guards and valid profile links.');
})().catch(error => { console.error(error); process.exitCode = 1; });
