// Isolated browser fixtures: no real GraphQL writes, accounts or messages.
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const base = process.env.QA_BASE_URL || 'http://localhost:3021';
const cars = [0, 1, 2].map(index => ({
 __typename: 'Car', _id: `${index + 1}`.repeat(24), carStatus: 'ACTIVE', carFuelType: index === 2 ? 'ELECTRIC' : 'GASOLINE',
 carCondition: 'USED', carModel: ['G80', '530i', 'Model 3'][index], carYear: [2023, 2022, 2024][index], carMileage: [50000, 63000, null][index],
 carLocation: 'SEOUL', carAddress: 'Seoul', carTransmission: 'AUTOMATIC', carTitle: ['2023 Genesis G80 3.5T AWD', '2022 BMW 530i Drive M Sport', '2024 Tesla Model 3'][index],
 carPrice: [48500000, 56100000, 43000000][index], carColor: ['Black', 'Blue', 'White'][index], carViews: 20, carLikes: 4, carComments: 0, carRank: 0,
 carImages: ['/img/car/budget/' + ['budget-slate', 'budget-blue', 'budget-white'][index] + '.png'], brandId: `${index + 4}`.repeat(24), carDesc: 'Browser fixture', carBarter: false, carRent: false,
 memberId: 'a'.repeat(24), soldAt: null, deletedAt: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', meLiked: [],
 brandData: { __typename: 'Brand', _id: `${index + 4}`.repeat(24), brandName: ['Genesis', 'BMW', 'Tesla'][index], brandLogo: null, brandStatus: 'ACTIVE' },
 memberData: { __typename: 'Member', _id: 'a'.repeat(24), memberType: 'AGENT', memberStatus: 'ACTIVE', memberNick: 'Seoul Motors', memberPhone: '+821012345678', memberFullName: 'Seoul Motors', memberImage: null, memberAddress: 'Seoul', memberDesc: '', memberCars: 3, memberLikes: 0, memberViews: 0 },
}));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'anorcar-compare-page-'));
const chrome = spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket, sequence = 0;
const pending = new Map(), exceptions = [];
const command = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
async function evaluate(expression) { const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value; }
async function until(expression, label) { for (let i = 0; i < 180; i++) { if (await evaluate(`Boolean(${expression})`)) return; await delay(150); } throw Error('Timeout: ' + label + ' ' + await evaluate('document.body.innerText.slice(0,1000)')); }
async function click(selector) { assert.ok(await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)return false;e.click();return true;})()`), selector); }
const fixture = `(()=>{
 window.__qaMutationNames=[];
 Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{window.__sharedLink=value;}},configurable:true});
 const cars=${JSON.stringify(cars)};
 const nativeFetch=fetch.bind(window);
 window.fetch=async(resource,options)=>{
  const url=typeof resource==='string'?resource:resource.url;
  if(url?.includes('/graphql')&&options?.body){const request=JSON.parse(options.body);let data;
   if(request.query.trim().startsWith('mutation')){window.__qaMutationNames.push(request.operationName);throw Error('No mutations allowed in QA');}
   if(request.operationName==='GetCar')data={getCar:cars.find(car=>car._id===request.variables.input)};
   else if(request.operationName==='GetCars')data={getCars:{__typename:'Cars',list:cars,metaCounter:[{__typename:'TotalCounter',total:3}]}};
   else if(request.operationName==='GetBrands')data={getBrands:cars.map(car=>car.brandData)};
   else data={};
   return new Response(JSON.stringify({data}),{headers:{'Content-Type':'application/json'}});
  }return nativeFetch(resource,options);
 };
})();`;
async function navigate(width, locale = 'en', ids = cars.slice(0, 2).map(car => car._id)) {
 await command('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 600 });
 await command('Page.navigate', { url: base + (locale === 'en' ? '' : '/' + locale) + '/car/compare' + (ids.length ? '?ids=' + ids.join(',') : '') });
 await until("document.querySelector('.compare-page-toolbar') && !document.querySelector('.compare-status .MuiCircularProgress-root')", 'comparison page');
 await command('Runtime.evaluate', { expression: 'window.scrollTo(0,0)' });
 const clearance = await evaluate("(()=>{const nav=document.querySelector('#top .navbar-main');const header=document.querySelector('.compare-page-heading');return {position:getComputedStyle(nav).position,navBottom:nav.getBoundingClientRect().bottom,headingTop:header.getBoundingClientRect().top};})()");
 assert.equal(clearance.position, 'relative', 'Compare navbar stays in the page flow');
 assert.ok(clearance.headingTop >= clearance.navBottom, 'Compare heading is below the navbar');
}
async function screenshot(name) {
 await delay(300);
 const metrics = await command('Page.getLayoutMetrics');
 const size = metrics.cssContentSize;
 const result = await command('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: size.width, height: size.height, scale: 1 }, captureBeyondViewport: true });
 fs.mkdirSync('docs/screenshots', { recursive: true }); fs.writeFileSync('docs/screenshots/' + name + '.png', Buffer.from(result.data, 'base64'));
}
(async () => { try {
 const active = path.join(profile, 'DevToolsActivePort'); for (let i = 0; i < 100 && !fs.existsSync(active); i++) await delay(100);
 const port = fs.readFileSync(active, 'utf8').split('\n')[0]; const targets = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
 socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl); await new Promise(resolve => socket.once('open', resolve));
 socket.on('message', raw => { const value = JSON.parse(raw); if (value.id) { const handler = pending.get(value.id); pending.delete(value.id); value.error ? handler.reject(Error(JSON.stringify(value.error))) : handler.resolve(value.result); } if (value.method === 'Runtime.exceptionThrown') exceptions.push(value.params.exceptionDetails); });
 await command('Runtime.enable'); await command('Page.enable'); await command('Page.addScriptToEvaluateOnNewDocument', { source: fixture });
 for (const width of [1440, 768, 390, 320]) {
  await navigate(width);
  assert.equal(await evaluate("document.querySelectorAll('.compare-page-cards .compare-car-card').length"), 2);
  assert.equal(await evaluate("document.querySelectorAll('.compare-page-cards .compare-empty-slot').length"), 1);
  assert.equal(await evaluate("document.querySelectorAll('.compare-specifications tbody tr').length"), 12);
  assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), 'page overflow ' + width);
  assert.ok(await evaluate("getComputedStyle(document.querySelector('.compare-container')).fontFamily.includes('Poppins')"));
  assert.equal(await evaluate("document.querySelector('.compare-highlight-grid strong').textContent"), '₩7,600,000');
  assert.ok(await evaluate("document.querySelectorAll('.compare-highlight-grid strong')[1].textContent.includes('13,000')"));
  const beforeContact = await evaluate('location.href');
  await click('.compare-message-seller');
  await until("document.querySelector('.chat-frame.open .private-chat-car-context')", 'seller chat opens in place');
  assert.equal(await evaluate('location.href'), beforeContact);
  assert.equal(await evaluate("document.querySelector('.private-chat-car-context strong').textContent"), cars[0].carTitle);
  assert.ok(await evaluate("!!document.querySelector('.private-chat-controls a[href*=" + JSON.stringify('account/join') + "]')"));
  await click('.live-chat-close');
  await click('.compare-show-phone');
  assert.equal(await evaluate("document.querySelector('.compare-seller-phone').textContent"), cars[0].memberData.memberPhone);
  assert.equal(await evaluate('location.href'), beforeContact);
  await click('.compare-show-phone');
  assert.equal(await evaluate("document.querySelectorAll('.compare-seller-phone').length"), 0);
  if (width === 1440 || width === 390) await screenshot('compare-redesign-' + width);
  await click('.compare-switches input');
  const differences = await evaluate("document.querySelectorAll('.compare-specifications tbody tr').length"); assert.ok(differences > 0 && differences < 12);
  await click('.compare-switches input');
  await click('.compare-switches .MuiFormControlLabel-root:nth-child(2) input');
  assert.equal(await evaluate("document.querySelectorAll('.compare-specifications .compare-different').length"), 0);
  await click('.compare-specifications > .compare-section-heading button');
  assert.equal(await evaluate("document.querySelectorAll('.compare-spec-group > div[hidden]').length"), 4);
  await click('.compare-specifications > .compare-section-heading button');
  await click('.compare-page-cards .compare-empty-slot button');
  await until("document.querySelector('.compare-picker-car button')", 'picker');
  assert.equal(await evaluate("document.querySelectorAll('.compare-picker-car').length"), 1);
  await click('.compare-picker-car button');
  await until("document.querySelectorAll('.compare-page-cards .compare-car-card').length===3", 'third car added');
  assert.equal(await evaluate("new URLSearchParams(location.search).get('ids').split(',').length"), 3);
  await click('.compare-page-cards .compare-remove');
  await until("document.querySelectorAll('.compare-page-cards .compare-car-card').length===2", 'remove');
  console.log('PASS compare layout, summary, toggles, groups, picker/add/remove/URL at', width);
 }
 for (const locale of ['kr', 'ru']) { await navigate(390, locale); assert.notEqual(await evaluate("document.querySelector('#compare-highlights-heading').textContent"), 'Comparison summary'); assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth+1")); console.log('PASS localized compare', locale); }
 await navigate(1440);
 await click('.compare-heading-actions button:nth-child(2)');
 await until("window.__sharedLink===location.href", 'share link');
 await click('.compare-page-cards .compare-replace');
 await until("document.querySelectorAll('.compare-picker-car').length===1", 'replace picker excludes current cars');
 await click('.compare-picker-car button');
 await until(`new URLSearchParams(location.search).get('ids').startsWith('${cars[2]._id}')`, 'replacement URL');
 await until("document.querySelectorAll('.compare-page-cards .compare-car-card').length===2", 'replacement cards');
 await command('Page.reload'); await until("document.querySelectorAll('.compare-page-cards .compare-car-card').length===2", 'refresh preserves URL selection');
 await click('.compare-page-toolbar > button'); await until("document.querySelectorAll('.compare-page-cards .compare-empty-slot').length===3", 'clear all');
 await navigate(1440, 'en', []); assert.equal(await evaluate("document.querySelectorAll('.compare-page-cards .compare-empty-slot').length"), 3);
 for (const [role, uid, expected] of [
  ['AGENT', 'a'.repeat(24), 'This is your listing. You cannot message yourself.'],
  ['AGENT', 'b'.repeat(24), 'Only buyer accounts can start seller chats.'],
  ['ADMIN', 'c'.repeat(24), 'Only buyer accounts can start seller chats.'],
 ]) {
  const claims = { _id: uid, memberType: role, memberStatus: 'ACTIVE', memberNick: 'Fixture', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+900 };
  const token = 'fixture.' + Buffer.from(JSON.stringify(claims)).toString('base64url') + '.fixture';
  await evaluate(`localStorage.setItem('accessToken',${JSON.stringify(token)})`);
  await navigate(1440);
  await until("document.querySelector('.login-user')", 'fixture account hydration');
  assert.equal(await evaluate("document.querySelector('.compare-message-seller').disabled"), false);
  const before = await evaluate('location.href');
  await click('.compare-message-seller');
  await until(`document.querySelector('.chat-frame.open')?.textContent.includes(${JSON.stringify(expected)})`, 'visible role explanation');
  assert.equal(await evaluate('location.href'), before);
  assert.equal(await evaluate("window.__qaMutationNames.includes('CreateFirebaseConversation')"), false, 'No forbidden seller-conversation creation');
  console.log('PASS clickable seller action and visible restriction', role, uid === 'a'.repeat(24) ? 'own listing' : 'other seller');
 }
 assert.deepEqual(exceptions, []); console.log('Comparison page browser fixtures passed; no live writes.');
 } finally { socket?.close(); chrome.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
