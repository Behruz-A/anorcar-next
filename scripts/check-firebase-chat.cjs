// Exercise the real hook with isolated SDK/GraphQL fixtures. No live writes.
const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
global.window = dom.window; global.document = dom.window.document; global.navigator = dom.window.navigator;
global.IS_REACT_ACT_ENVIRONMENT = true;
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = require('react-dom/test-utils');
const customer = 'aaaaaaaaaaaaaaaaaaaaaaaa', agent = 'bbbbbbbbbbbbbbbbbbbbbbbb';
let member = { _id: customer, memberType: 'USER', memberStatus: 'ACTIVE' };
window.localStorage.setItem('accessToken', 'fixture');
const auth = { currentUser: null }, db = {};
const listeners = new Set(), timers = new Set();
let signins = 0, signouts = 0, offline = 0, denyRenewal = false, wrongUid = false, writes = [], authQueue = Promise.resolve();
const recentMessages = Object.fromEntries(Array.from({ length: 30 }, (_, i) => ['m' + i, { senderId: agent, text: 'hello', createdAt: i + 1 }]));
const snapshot = values => ({ val: () => values, forEach: callback => Object.entries(values || {}).forEach(([key, value]) => callback({ key, val: () => value })) });
const client = {
 mutate: async ({ mutation }) => {
  if (mutation === 'token') { if (denyRenewal) throw Error('blocked'); return { data: { createFirebaseChatToken: 'custom-fixture' } }; }
  return { data: { createFirebaseConversation: { conversationId: customer + '_' + agent } } };
 },
 query: async () => ({ data: { getFirebaseConversation: {} } }),
};
const sdk = {
 ref: (_, path) => ({ path }), query: (path, ...constraints) => ({ ...path, constraints }),
 orderByChild: value => ({ order: value }), limitToLast: value => ({ limit: value }), endBefore: (value, key) => ({ end: value, key }),
 goOffline: () => { offline++; }, goOnline: () => {},
 onValue: (target, callback) => {
  const entry = { target, callback }; listeners.add(entry);
  callback(target.path === '.info/connected' ? snapshot(true) : snapshot(target.constraints?.[1]?.limit === 30 ? recentMessages : {}));
  return () => listeners.delete(entry);
 },
 get: async target => { assert.equal(target.constraints[1].end, 1); return snapshot({ older: { senderId: agent, text: 'older', createdAt: 0 } }); },
 push: target => ({ ...target, key: 'unique' }), serverTimestamp: () => ({ '.sv': 'timestamp' }),
 set: async (target, payload) => { writes.push({ target, payload }); },
};
const modules = {
 react: React,
 '@apollo/client': { useApolloClient: () => client, useReactiveVar: () => member },
 '../../apollo/store': { userVar: () => member },
 '../../apollo/user/firebaseChat': { CREATE_FIREBASE_CHAT_TOKEN: 'token', CREATE_FIREBASE_CONVERSATION: 'create', GET_FIREBASE_CONVERSATION: 'get' },
 '../firebase/client': {
  getChatFirebase: () => ({ auth, db }), memoryChatAuth: async () => ({ auth, db }),
  serializeChatAuth: task => { const result = authQueue.then(task, task); authQueue = result.catch(() => {}); return result; },
 },
 'firebase/database': sdk,
 'firebase/auth': {
  signOut: async () => { auth.currentUser = null; signouts++; },
  signInWithCustomToken: async () => {
   signins++;
   auth.currentUser = { uid: wrongUid ? agent : member._id, getIdTokenResult: async () => ({ claims: { anorcarChat: true, chatExpiresAt: Date.now() + 900000 } }) };
   return { user: auth.currentUser };
  },
 },
};
const context = {
 exports: {}, require: name => { assert.ok(modules[name], name); return modules[name]; },
 window, document, localStorage: window.localStorage, console, Date,
 setTimeout: (callback, delay) => { const timer = { callback, delay }; timers.add(timer); return timer; }, clearTimeout: timer => timers.delete(timer),
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('libs/hooks/useFirebaseChat.ts', 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
}).outputText, context);
const { useFirebaseChat, mergeChatMessages } = context.exports;
let chat, enabled = true;
function Fixture() { chat = useFirebaseChat(enabled); return null; }
const root = createRoot(document.getElementById('root'));
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const render = async () => act(async () => { root.render(React.createElement(Fixture)); await flush(); });
async function main() {
 const merged = mergeChatMessages([{ id: 'b', createdAt: 2 }], [{ id: 'a', createdAt: 1 }, { id: 'b', createdAt: 2 }]);
 assert.equal(merged.length, 2); assert.equal(merged[0].id, 'a');
 assert.equal(mergeChatMessages([], [{ id: 'a', createdAt: 1 }, { id: 'Z', createdAt: 1 }])[0].id, 'Z');
 await render(); assert.equal(chat.ready, true); assert.equal(signins, 1);
 await act(async () => { await chat.startConversation(agent); await flush(); });
 await act(async () => { await flush(); });
 assert.equal(chat.selected, customer + '_' + agent);
 const stream = [...listeners].find(entry => entry.target.path === 'messages/' + chat.selected && entry.target.constraints[1].limit === 30);
 assert.ok(stream);
 await act(async () => { stream.callback(snapshot(recentMessages)); await flush(); });
 assert.equal(chat.messages.length, 30);
 await act(async () => { await chat.loadOlder(); await flush(); });
 assert.equal(chat.messages.length, 31, JSON.stringify({ error: chat.error, online: chat.online, hasOlder: chat.hasOlder })); assert.equal(chat.hasOlder, false);
 await act(async () => { await chat.send('  '); await chat.send('x'.repeat(2001)); await chat.send(' Hello '); await flush(); });
 assert.equal(writes.length, 1); assert.equal(writes[0].payload.senderId, customer); assert.equal(writes[0].payload.text, 'Hello');
 assert.equal(writes[0].payload.createdAt['.sv'], 'timestamp');
 const activeListeners = listeners.size;
 const firstRenewal = [...timers].find(timer => timer.delay < 850000);
 await act(async () => { timers.delete(firstRenewal); await firstRenewal.callback(); await flush(); });
 assert.equal(signins, 2); assert.equal(listeners.size, activeListeners); assert.equal(chat.ready, true);
 const connected = [...listeners].find(entry => entry.target.path === '.info/connected');
 await act(async () => { connected.callback(snapshot(false)); await flush(); });
 await act(async () => { await chat.send('offline'); await flush(); });
 assert.equal(writes.length, 1);
 await act(async () => { connected.callback(snapshot(true)); await flush(); });
 denyRenewal = true;
 const renewal = [...timers].find(timer => timer.delay < 850000);
 assert.ok(renewal);
 await act(async () => { await renewal.callback(); await flush(); });
 assert.equal(chat.ready, false); assert.equal(listeners.size, 0); assert.equal(auth.currentUser, null); assert.equal(chat.messages.length, 0);
 denyRenewal = false;
 await act(async () => { chat.retry(); await flush(); });
 await act(async () => { await flush(); });
 assert.equal(chat.ready, true);
 member = { ...member, _id: agent, memberType: 'AGENT' }; await render();
 assert.equal(chat.uid, agent); assert.equal(chat.messages.length, 0); assert.equal(chat.selected, '');
 await act(async () => { window.dispatchEvent(new window.Event('anorcar:session-changing')); await flush(); });
 assert.equal(listeners.size, 0); assert.equal(auth.currentUser, null);
 wrongUid = true; member = { ...member, _id: customer, memberType: 'USER' }; await render();
 assert.equal(chat.ready, false); assert.equal(auth.currentUser, null);
 enabled = false; await render(); await act(async () => { root.unmount(); await flush(); });
 assert.equal(listeners.size, 0); assert.ok(signouts > 0 && offline > 0);
 console.log('Firebase chat fixtures passed: UID/grants, renewal denial, inbox/message subscriptions, history pagination, deduplication, validation, account switch, session cleanup.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
