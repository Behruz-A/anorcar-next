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
	await evaluate(`(() => { const input = document.querySelector('.compare-picker input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)}); input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
	await delay(600);
}
async function navigate(locale, mobile = false, desktopWidth = 1440) {
	await command('Emulation.setDeviceMetricsOverride', { width: mobile ? 390 : desktopWidth, height: mobile ? 844 : 1000, deviceScaleFactor: 1, mobile });
	await command('Emulation.setUserAgentOverride', { userAgent: mobile ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1' : 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36' });
	await command('Page.navigate', { url: `http://localhost:3000${locale === 'en' ? '/' : '/' + locale}` });
	await until("document.querySelectorAll('.compare-empty-slot').length === 3", 'initial three empty slots');
	await until("document.readyState === 'complete' && document.querySelector('.compare-cars')?.getBoundingClientRect().width > 300", 'loaded homepage layout');
	await evaluate("document.querySelector('.compare-cars').scrollIntoView({block:'start'});");
	await until("[...document.querySelectorAll('.compare-car-photo img')].every(img => img.complete && img.naturalWidth > 0)", 'loaded card images');
}
async function testFlow(locale, mobile = false, desktopWidth = 1440) {
 await navigate(locale, mobile, desktopWidth);
 const labels = JSON.parse(fs.readFileSync(`public/locales/${locale}/common.json`, 'utf8'));
 assert.equal(await evaluate("document.querySelector('#compare-cars-heading').textContent"), labels['Compare Cars']);
 assert.equal(await evaluate("document.querySelectorAll('.compare-selection-count, .compare-intro, .compare-selection-dots').length"), 0);
 assert.equal(await evaluate("document.querySelectorAll('.popular-cars, .anorcar-events, .car-advertisement').length"), 0);
 assert.ok(await evaluate("document.querySelector('.compare-primary').disabled"));
 if (locale === 'en') await screenshot(mobile ? 'compare-empty-mobile' : 'compare-empty-desktop');
 if (locale === 'en' && !mobile) {
  assert.equal(await evaluate("getComputedStyle(document.querySelector('#compare-cars-heading')).fontFamily.includes('Arial')"), true);
  const point = await evaluate("(() => { const r = document.querySelector('.compare-empty-slot[data-slot=\"1\"] button').getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()");
  await command('Input.dispatchMouseEvent', {type:'mouseMoved', ...point});
  await delay(450);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.compare-empty-slot[data-slot=\"1\"] button')).backgroundColor"), 'rgb(233, 75, 32)');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.compare-empty-slot[data-slot=\"1\"] button')).color"), 'rgb(255, 255, 255)');
  await screenshot('compare-hover-desktop');
  await command('Input.dispatchMouseEvent', {type:'mouseMoved', x:1,y:1});
 }
 await click('.compare-empty-slot[data-slot="2"] button');
 await until("!!document.querySelector('.compare-picker input')", 'picker open');
 assert.equal(await evaluate("document.querySelector('#compare-picker-title').textContent"), labels['Select Brand/Model']);
 assert.equal(await evaluate("document.querySelectorAll('.compare-picker .MuiPagination-root, .compare-picker-meta, .compare-picker-description').length"), 0);
 await setSearch('Hyundai');
 await until("document.querySelectorAll('.compare-picker-car').length > 2 && !document.querySelector('.compare-picker .MuiCircularProgress-root')", 'brand search');
 assert.ok(await evaluate("[...document.querySelectorAll('.compare-picker-model')].every(row => row.textContent.includes('Hyundai'))"));
 if (locale === 'en' && !mobile) {
  await delay(300);
  const result = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync('docs/screenshots/compare-picker-desktop.png', Buffer.from(result.data, 'base64'));
 }
 await click('.compare-picker-car:not(:disabled)');
 await until("!document.querySelector('.compare-picker')", 'single selection closes picker');
 assert.ok(await evaluate("document.querySelector('.compare-selection-grid').children[2].classList.contains('compare-car-card')"));
 assert.ok(await evaluate("document.querySelector('.compare-primary').disabled"));
 await click('.compare-empty-slot[data-slot="0"] button');
 await until("document.querySelectorAll('.compare-picker-car').length > 2", 'recent searches shown on reopen');
 assert.equal(await evaluate("document.querySelector('.compare-picker input').value"), '');
 assert.equal(await evaluate("document.querySelectorAll('.compare-picker-car.is-selected:disabled').length"), 1);
 await setSearch('[');
 await until("!document.querySelector('.compare-picker .MuiCircularProgress-root') && document.querySelectorAll('.compare-picker-car').length === 0", 'literal punctuation search');
 assert.equal(await evaluate("document.querySelectorAll('.compare-picker .MuiAlert-standardError').length"), 0);
 await setSearch('');
 await until("document.querySelectorAll('.compare-picker-car').length > 2", 'restore recent history');
 if (locale === 'en' && !mobile) {
  await delay(300);
  const result = await command('Page.captureScreenshot', {format:'png',captureBeyondViewport:false});
  fs.writeFileSync('docs/screenshots/compare-picker-recent-desktop.png', Buffer.from(result.data,'base64'));
 }
 await click('.compare-picker-car:not(:disabled)');
 await until("!document.querySelector('.compare-picker')", 'second selection');
 assert.ok(await evaluate("!document.querySelector('.compare-primary').disabled"));
 assert.ok(await evaluate("[...document.querySelectorAll('.compare-selection-grid > *')].every(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })"), 'all slots fit inside viewport');
 assert.ok(await evaluate("document.querySelector('#compare-cars-heading').getBoundingClientRect().left >= 14"), 'heading is not clipped');
 assert.ok(await evaluate("[...document.querySelectorAll('.compare-selection-grid .compare-car-photo')].every(el => el.getBoundingClientRect().height <= 181)"), 'selected photos remain compact');
 assert.ok(await evaluate("[...document.querySelectorAll('.compare-selection-grid .compare-car-photo')].every(el => Math.abs(el.getBoundingClientRect().width - (el.closest('article').clientWidth - 20)) < 2)"), 'photos fill card width with equal insets');
 if (!mobile) assert.ok(await evaluate("(() => { const heights = [...document.querySelectorAll('.compare-selection-grid > *')].map(el => el.getBoundingClientRect().height); return Math.max(...heights) - Math.min(...heights) < 2; })()"), 'selected and empty slots have equal heights');
 if (desktopWidth > 1440) await screenshot('compare-selection-wide');
 if (locale === 'en') await screenshot(mobile ? 'compare-selection-mobile' : 'compare-selection-desktop');
 await click('.compare-empty-slot[data-slot="1"] button');
 await until("document.querySelectorAll('.compare-picker-car.is-selected:disabled').length === 2", 'duplicates disabled');
 await click('.compare-picker-car:not(:disabled)');
 await until("!document.querySelector('.compare-picker')", 'third selection');
 assert.equal(await evaluate("document.querySelectorAll('.compare-selection-grid .compare-car-card').length"), 3);
 await click('.compare-primary');
 await until("location.pathname.endsWith('/car/compare') && document.querySelectorAll('.compare-table thead .compare-car-card').length === 3", 'standalone three-car comparison');
 assert.ok(await evaluate("!!document.querySelector('#top') && !!document.querySelector('#footer')"));
 assert.equal(await evaluate("document.querySelectorAll('.header-basic, .home-page, .chatting, .compare-selection-grid').length"), 0);
 assert.equal(await evaluate("document.querySelectorAll('#main > *').length"), 1);
 assert.equal(await evaluate("document.querySelector('.compare-page-heading h1').textContent"), labels['Compare Cars']);
 assert.equal(await evaluate("document.querySelector('.compare-page-heading [aria-current=page]').textContent"), labels['Compare']);
 assert.ok(await evaluate("document.querySelector('.compare-page-heading p').textContent.length > 20"));
 assert.ok(await evaluate("getComputedStyle(document.querySelector('.compare-page-heading h1')).fontFamily.includes('Poppins')"));
 assert.equal(await evaluate("document.querySelector('.compare-page-heading a').getAttribute('href')"), locale === 'en' ? '/' : '/' + locale);
 assert.equal(await evaluate("document.querySelectorAll('.compare-table tbody tr').length"), 12);
 assert.ok(await evaluate("[...document.querySelectorAll('.compare-details-link')].every(a => a.getAttribute('href').includes('/car/detail?id='))"));
 if (locale === 'en') await screenshot(mobile ? 'compare-results-mobile' : 'compare-results-desktop');
 await command('Page.reload');
 await until("document.readyState === 'complete' && document.querySelectorAll('.compare-table thead .compare-car-card').length === 3", 'refresh preserves URL selection');
 await click('.compare-results-toolbar input');
 await until("document.querySelectorAll('.compare-table tbody tr').length < 12", 'differences filter');
 await click('.compare-results-toolbar input');
 await click('.compare-table .compare-remove');
 await until("document.querySelectorAll('.compare-table thead .compare-car-card').length === 2", 'remove updates comparison');
 await click('.compare-table .compare-remove');
 await until("!document.querySelector('.compare-table') && !document.querySelector('.compare-cars .MuiCircularProgress-root')", 'insufficient selection handled');
 console.log(`${locale} ${mobile ? 'mobile' : 'desktop'}: recent search, selection, duplicates, literal search, standalone route, refresh, differences and removal passed.`);
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
		if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
		if (!message.id) return;
		const task = pending.get(message.id);
		if (!task) return;
		pending.delete(message.id);
		message.error ? task.reject(new Error(JSON.stringify(message.error))) : task.resolve(message.result);
	});
	await command('Page.enable');
	await command('Runtime.enable');
	await testFlow('en');
	await testFlow('en', true);
	await testFlow('kr');
	await testFlow('ru');
	await testFlow('en', false, 2796);
	assert.deepEqual(exceptions, [], 'No uncaught browser exceptions');
	console.log('Read-only browser QA passed with real inventory. Empty, selected, results and picker screenshots saved.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
	if (socket?.readyState === WebSocket.OPEN) { try { await command('Browser.close'); } catch {} }
	socket?.close();
	chrome.kill();
	// Keep the temporary profile for diagnostics; do not touch the user's Chrome profile.
});
