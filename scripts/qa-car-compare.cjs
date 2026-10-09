// Standalone, read-only browser QA. Uses a separate temporary Chrome profile.
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'anorcar-compare-qa-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket;
let carRequests = 0;
let id = 0;
const pending = new Map();
const exceptions = [];
const command = (method, params = {}) => new Promise((resolve, reject) => {
	const request = ++id;
	pending.set(request, { resolve, reject });
	socket.send(JSON.stringify({ id: request, method, params }));
});
async function evaluate(expression) {
	const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
	if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
	return result.result.value;
}
async function until(expression, label, timeout = 60000) {
	const end = Date.now() + timeout;
	while (Date.now() < end) {
		if (await evaluate(expression)) return;
		await delay(150);
	}
	throw new Error('Timed out: ' + label);
}
async function click(selector) {
	assert.ok(await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element || element.disabled) return false; element.click(); return true; })()`), selector);
}
async function screenshot(name) {
	await until("document.querySelector('.compare-cars')?.getBoundingClientRect().width > 300 && getComputedStyle(document.querySelector('.compare-selection-grid') || document.querySelector('.compare-table')).display !== 'none'", 'visible section layout');
	await evaluate("document.querySelector('.compare-cars').scrollIntoView({block:'start'});");
	await delay(250);
	const clip = await evaluate("(() => { const r = document.querySelector('.compare-cars').getBoundingClientRect(); return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1}; })()");
	const result = await command('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });
	fs.mkdirSync('docs/screenshots', { recursive: true });
	fs.writeFileSync(`docs/screenshots/${name}.png`, Buffer.from(result.data, 'base64'));
}
async function setSearch(value) {
	await evaluate(`(() => { const input = document.querySelector('.compare-picker-premium input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)}); input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
	await delay(600);
}
async function navigate(locale, mobile = false, desktopWidth = 1440) {
	await command('Emulation.setDeviceMetricsOverride', { width: mobile ? 390 : desktopWidth, height: mobile ? 844 : 1000, deviceScaleFactor: 1, mobile });
	await command('Emulation.setUserAgentOverride', { userAgent: mobile ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1' : 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36' });
	await command('Page.navigate', { url: `http://localhost:3000${locale === 'en' ? '/' : '/' + locale}` });
	await until("!!document.querySelector('.compare-home-premium') && !document.querySelector('.compare-slot-loading')", 'restored homepage');
	if (await evaluate("!document.querySelector('.compare-home-premium .compare-clear').disabled")) await click('.compare-home-premium .compare-clear');
	await until("document.querySelectorAll('.compare-empty-slot').length === 3", 'initial empty slots');
	await until("document.readyState === 'complete' && document.querySelector('.compare-cars')?.getBoundingClientRect().width > 300", 'loaded homepage layout');
	await evaluate("document.querySelector('.compare-cars').scrollIntoView({block:'start'});");
	await until("[...document.querySelectorAll('.compare-car-photo img')].every(img => img.complete && img.naturalWidth > 0)", 'loaded card images');
}
async function testFlow(locale, mobile = false, desktopWidth = 1440) {
 await navigate(locale,mobile,desktopWidth);
 const labels=JSON.parse(fs.readFileSync(`public/locales/${locale}/common.json`,'utf8'));
 assert.equal(await evaluate("document.querySelector('#compare-cars-heading').textContent"),labels['Compare Cars. Choose Smarter.']);
 assert.ok(await evaluate("getComputedStyle(document.querySelector('#compare-cars-heading')).fontFamily.includes('Poppins')"));
 assert.equal(await evaluate("document.querySelectorAll('.compare-home-premium .compare-empty-slot').length"),3);
 assert.ok(await evaluate("document.querySelector('.compare-home-premium .compare-primary').disabled"));
 if(locale==='en') await screenshot(mobile?'compare-premium-empty-mobile':desktopWidth>1440?'compare-premium-empty-wide':desktopWidth<1024?'compare-premium-empty-tablet':'compare-premium-empty-desktop');
 await click('.compare-empty-slot[data-slot="0"] button');
 await until("document.querySelectorAll('.compare-picker-car').length > 0 && !document.querySelector('.compare-picker-premium .MuiCircularProgress-root')",'initial live listings');
 const total=await evaluate("document.querySelector('.compare-picker-pagination p').textContent");
 const firstId=await evaluate("document.querySelector('.compare-picker-car button').getAttribute('aria-label')");
 assert.equal(await evaluate("document.querySelectorAll('.compare-picker-photo img').length"),await evaluate("document.querySelectorAll('.compare-picker-car').length"));
 if(await evaluate("!!document.querySelector('.compare-picker-premium button[aria-label=\"Go to next page\"]:not(:disabled)')")) {
  await click('.compare-picker-premium button[aria-label="Go to next page"]');
  await until("!!document.querySelector('.compare-picker-premium .MuiPaginationItem-page.Mui-selected') && document.querySelector('.compare-picker-premium .MuiPaginationItem-page.Mui-selected').textContent === '2' && !document.querySelector('.compare-picker-premium .MuiCircularProgress-root')",'server page 2');
  assert.equal(await evaluate("document.querySelector('.compare-picker-pagination p').textContent"),total);
  await click('.compare-picker-premium button[aria-label="Go to previous page"]');
  await until("document.querySelector('.compare-picker-premium .MuiPaginationItem-page.Mui-selected').textContent === '1' && !document.querySelector('.compare-picker-premium .MuiCircularProgress-root')",'server page 1');
 }
 await setSearch('[');
 await until("document.querySelectorAll('.compare-picker-car').length === 0 && !document.querySelector('.compare-picker-premium .MuiCircularProgress-root')",'literal regex search');
 assert.equal(await evaluate("document.querySelectorAll('.compare-picker-premium .MuiAlert-standardError').length"),0);
 await setSearch('');
 await until("document.querySelectorAll('.compare-picker-car').length > 0 && !document.querySelector('.compare-picker-premium .MuiCircularProgress-root')",'reset catalog');
 await click('.compare-picker-car button');
 await until("!document.querySelector('.compare-picker-premium')",'first choice');
 assert.ok(await evaluate("document.querySelector('.compare-home-premium .compare-primary').disabled"));
 await click('.compare-empty-slot[data-slot="1"] button');
 await until("document.querySelectorAll('.compare-picker-car').length > 0 && !document.querySelector('.compare-picker-premium .MuiCircularProgress-root')",'second picker');
 assert.equal(await evaluate("document.querySelector('.compare-picker-pagination p').textContent"),total,'server total unchanged by exclusions');
 assert.ok(await evaluate(`![...document.querySelectorAll('.compare-picker-car button')].some(el=>el.getAttribute('aria-label')===${JSON.stringify(firstId)})`),'selected listing excluded');
 await click('.compare-picker-car button');
 await until("!document.querySelector('.compare-picker-premium')",'second choice');
 assert.ok(await evaluate("!document.querySelector('.compare-home-premium .compare-primary').disabled"));
 const before=await evaluate("[...document.querySelectorAll('.compare-selection-grid .compare-car-name h3')].map(el=>el.textContent)");
 await click('.compare-selection-grid .compare-replace');
 await until("!!document.querySelector('.compare-picker-premium')",'replacement modal');
 await click('.compare-picker-heading button');
 await until("!document.querySelector('.compare-picker-premium')",'cancel replacement');
 assert.deepEqual(await evaluate("[...document.querySelectorAll('.compare-selection-grid .compare-car-name h3')].map(el=>el.textContent)"),before);
 await click('.compare-empty-slot[data-slot="2"] button');
 await until("document.querySelectorAll('.compare-picker-car').length > 0 && !document.querySelector('.compare-picker-premium .MuiCircularProgress-root')",'third picker');
 if(locale==='en'&&!mobile&&desktopWidth===1440) {
  await delay(350);
  const result=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync('docs/screenshots/compare-premium-picker-desktop.png',Buffer.from(result.data,'base64'));
 }
 await click('.compare-picker-car button');
 await until("!document.querySelector('.compare-picker-premium')",'third choice');
 assert.equal(await evaluate("document.querySelectorAll('.compare-selection-grid .compare-car-card').length"),3);
 await click('.compare-selection-grid .compare-replace');
 await until("document.querySelectorAll('.compare-picker-car').length > 0 && !document.querySelector('.compare-picker-premium .MuiCircularProgress-root')",'replace at maximum');
 await click('.compare-picker-car button');
 await until("!document.querySelector('.compare-picker-premium')",'atomic replacement');
 assert.equal(await evaluate("document.querySelectorAll('.compare-selection-grid .compare-car-card').length"),3);
 assert.ok(await evaluate("[...document.querySelectorAll('.compare-selection-grid > *')].every(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})"));
 if(!mobile&&desktopWidth>=1024) assert.ok(await evaluate("(()=>{const hs=[...document.querySelectorAll('.compare-selection-grid > *')].map(el=>el.getBoundingClientRect().height);return Math.max(...hs)-Math.min(...hs)<2;})()"));
 if(locale==='en') await screenshot(mobile?'compare-premium-selected-mobile':desktopWidth>1440?'compare-premium-selected-wide':desktopWidth<1024?'compare-premium-selected-tablet':'compare-premium-selected-desktop');
 const selected=await evaluate("[...document.querySelectorAll('.compare-selection-grid .compare-car-name h3')].map(el=>el.textContent)");
 await click('.compare-home-premium .compare-primary');
 await until("location.pathname.endsWith('/car/compare') && document.querySelectorAll('.compare-table thead .compare-car-card').length===3",'existing comparison route');
 assert.ok(await evaluate("!!document.querySelector('#top')&&!!document.querySelector('#footer')"));
 assert.equal(await evaluate("document.querySelectorAll('.home-page,.chatting').length"),0);
 assert.equal(await evaluate("document.querySelectorAll('.compare-table tbody tr').length"),12);
 assert.ok(await evaluate("[...document.querySelectorAll('.compare-details-link')].every(el=>el.href.includes('/car/detail?id='))"));
 if(locale==='en'&&!mobile&&desktopWidth===1440) await screenshot('compare-premium-results-desktop');
 const viewRequests=carRequests;
 await evaluate("history.back()");
 await until("!!document.querySelector('.compare-home-premium') && document.querySelectorAll('.compare-selection-grid .compare-car-card').length===3",'Back restores slots');
 assert.deepEqual(await evaluate("[...document.querySelectorAll('.compare-selection-grid .compare-car-name h3')].map(el=>el.textContent)"),selected);
 assert.equal(carRequests,viewRequests,'warm cache restore must not request GET_CAR');
 await command('Page.reload');
 await until("!!document.querySelector('.compare-home-premium') && document.querySelectorAll('.compare-selection-grid .compare-car-card').length===3",'session refresh restoration');
 assert.deepEqual(await evaluate("[...document.querySelectorAll('.compare-selection-grid .compare-car-name h3')].map(el=>el.textContent)"),selected);
 if(locale==='en'&&!mobile&&desktopWidth===1440) {
  const delayed = await command('Page.addScriptToEvaluateOnNewDocument', {source: `(() => { const original = window.fetch; window.fetch = function(input, options) { let operation; try { operation = JSON.parse(options?.body || '{}').operationName; } catch {} return operation === 'GetCar' ? new Promise(resolve => setTimeout(resolve, 2500)).then(() => original.call(this,input,options)) : original.call(this,input,options); }; })();`});
  await command('Page.reload');
  await until("document.querySelectorAll('.compare-slot-loading').length===3 && !document.querySelector('.compare-home-premium .compare-clear').disabled",'restoration skeletons');
  assert.equal(await evaluate("document.querySelectorAll('.compare-empty-slot').length"),0,'no empty-slot flash during restoration');
  await screenshot('compare-premium-restoring-desktop');
  await click('.compare-home-premium .compare-clear');
  await until("document.querySelectorAll('.compare-empty-slot').length===3",'clear during pending restoration');
  await delay(3000);
  assert.equal(await evaluate("document.querySelectorAll('.compare-selection-grid .compare-car-card').length"),0,'late restoration must not undo Clear All');
  await command('Page.removeScriptToEvaluateOnNewDocument',{identifier:delayed.identifier});
 } else {
 await click('.compare-home-premium .compare-clear');
 }
 await until("document.querySelectorAll('.compare-empty-slot').length===3",'Clear All');
 await command('Page.reload');
 await until("document.querySelectorAll('.compare-empty-slot').length===3",'cleared session remains empty');
 console.log(`${locale} ${mobile?'mobile':desktopWidth+'px'}: fresh pagination/accurate totals/exclusions/search/replacement/cancel/compare/Back cache reuse/refresh/Clear All passed.`);
}
async function testStorageAndKeyboard() {
 await navigate('en');
 await screenshot('compare-premium-empty-desktop');
 const blocked = await command('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { window.__compareStorageBlocked = true; for (const name of ['getItem', 'setItem']) { const original = Storage.prototype[name]; Storage.prototype[name] = function(key, ...args) { if (key === 'anorcar.compare.selection') throw new DOMException('Storage blocked', 'SecurityError'); return original.call(this,key,...args); }; } })();` });
 await command('Page.reload');
 await until("window.__compareStorageBlocked && document.querySelectorAll('.compare-empty-slot').length===3", 'blocked storage still renders');
 await evaluate("document.querySelector('.compare-empty-slot button').focus()");
 await command('Input.dispatchKeyEvent', {type:'keyDown', key:'Enter', code:'Enter', text:'\r', windowsVirtualKeyCode:13});
 await command('Input.dispatchKeyEvent', {type:'keyUp', key:'Enter', code:'Enter', windowsVirtualKeyCode:13});
 await until("!!document.querySelector('.compare-picker-premium')", 'keyboard opens dialog');
 await until("document.querySelector('.compare-picker-premium input')===document.activeElement", 'keyboard dialog autofocus', 5000);
 await command('Input.dispatchKeyEvent', {type:'keyDown', key:'Tab', code:'Tab', windowsVirtualKeyCode:9});
 await command('Input.dispatchKeyEvent', {type:'keyUp', key:'Tab', code:'Tab', windowsVirtualKeyCode:9});
 assert.ok(await evaluate("!!document.activeElement.closest('.compare-picker-premium')"), 'focus stays inside dialog');
 await command('Input.dispatchKeyEvent', {type:'keyDown', key:'Escape', code:'Escape', windowsVirtualKeyCode:27});
 await command('Input.dispatchKeyEvent', {type:'keyUp', key:'Escape', code:'Escape', windowsVirtualKeyCode:27});
 await until("!document.querySelector('.compare-picker-premium') && document.activeElement.matches('.compare-empty-slot button')", 'Escape restores focus');
 for(let slot=0;slot<3;slot++) {
  await click(`.compare-empty-slot[data-slot="${slot}"] button`);
  await until("document.querySelectorAll('.compare-picker-car').length>0 && !document.querySelector('.compare-picker-premium .MuiCircularProgress-root')", 'storage-independent selection');
  await click('.compare-picker-car button');
  await until("!document.querySelector('.compare-picker-premium')", 'selected with blocked storage');
 }
 assert.ok(await evaluate("!document.querySelector('.compare-home-premium .compare-primary').disabled"));
 await screenshot('compare-premium-selected-desktop');
 await click('.compare-home-premium .compare-clear');
 await command('Page.removeScriptToEvaluateOnNewDocument',{identifier:blocked.identifier});
 assert.deepEqual(exceptions, []);
 console.log('Blocked session storage, keyboard opening/autofocus/focus containment/Escape return and selection passed.');
}
async function main() {
	const activePort = path.join(profile, 'DevToolsActivePort');
	for (let attempt = 0; attempt < 100 && !fs.existsSync(activePort); attempt++) await delay(100);
	assert.ok(fs.existsSync(activePort), 'Headless Chrome started');
	const port = fs.readFileSync(activePort, 'utf8').split('\n')[0];
	const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
	socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
	await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
	socket.on('message', (raw) => {
		const message = JSON.parse(raw);
		if (message.method === 'Network.requestWillBeSent' && message.params.request.postData) { try { if (JSON.parse(message.params.request.postData).operationName === 'GetCar') carRequests++; } catch {} }
		if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
		if (!message.id) return;
		const task = pending.get(message.id);
		if (!task) return;
		pending.delete(message.id);
		message.error ? task.reject(new Error(JSON.stringify(message.error))) : task.resolve(message.result);
	});
	await command('Page.enable');
	await command('Runtime.enable');
	await command('Network.enable');
	if (process.env.COMPARE_QA_RESILIENCE_ONLY === '1') {
		await testStorageAndKeyboard();
		return;
	}
	if (process.env.COMPARE_QA_HEADER_ONLY === '1') {
		for (const [locale, mobile] of [['en', false], ['en', true], ['kr', false], ['ru', false]]) {
			await navigate(locale, mobile);
			const labels = JSON.parse(fs.readFileSync(`public/locales/${locale}/common.json`, 'utf8'));
			assert.equal(await evaluate("getComputedStyle(document.querySelector('#compare-cars-heading')).fontFamily.includes('Poppins')"), true);
			assert.equal(await evaluate("getComputedStyle(document.querySelector('#compare-cars-heading')).fontSize"), mobile ? '25px' : '34px');
			assert.equal(await evaluate("document.querySelector('.compare-heading p').textContent"), labels['Compare up to 3 cars side by side and find the perfect match for your needs.']);
			if (locale === 'en') await screenshot(mobile ? 'compare-empty-mobile' : 'compare-empty-desktop');
		}
		assert.deepEqual(exceptions, []);
		console.log('Homepage heading typography and localized copy passed on desktop/mobile and EN/KR/RU.');
		return;
	}
	await testFlow('en');
	await testFlow('en', true);
	await testFlow('kr');
	await testFlow('ru');
	await testFlow('en', false, 2796);
	await testFlow('en', false, 768);
	assert.deepEqual(exceptions, [], 'No uncaught browser exceptions');
	console.log('Read-only browser QA passed with real inventory. Empty, selected, results and picker screenshots saved.');
}
main().catch(async error => { console.error(error); try { console.error(await evaluate("({active:document.activeElement?.outerHTML,dialog:!!document.querySelector('.compare-picker-premium'),slots:document.querySelectorAll('.compare-empty-slot').length})")); } catch {} process.exitCode = 1; }).finally(async () => {
	if (socket?.readyState === WebSocket.OPEN) { try { await command('Browser.close'); } catch {} }
	socket?.close();
	chrome.kill();
	// Keep the temporary profile for diagnostics; do not touch the user's Chrome profile.
});
