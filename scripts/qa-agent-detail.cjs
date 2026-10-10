// Read-only checks against real agents in a separate temporary Chrome profile.
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'anorcar-agent-detail-'));
const chrome = spawn(
	'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
	[
		'--headless=new',
		'--remote-debugging-port=0',
		`--user-data-dir=${profile}`,
		'--no-first-run',
		'--disable-gpu',
		'about:blank',
	],
	{ windowsHide: true, stdio: 'ignore' },
);
let socket,
	id = 0;
const pending = new Map(),
	exceptions = [];
const command = (method, params = {}) =>
	new Promise((resolve, reject) => {
		const n = ++id;
		pending.set(n, { resolve, reject });
		socket.send(JSON.stringify({ id: n, method, params }));
	});
async function evaluate(expression) {
	const r = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
	if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
	return r.result.value;
}
async function until(expression, label) {
	const end = Date.now() + 90000;
	while (Date.now() < end) {
		if (await evaluate(expression)) return;
		await delay(150);
	}
	throw new Error('Timed out ' + label + ' ' + (await evaluate('document.body.innerText.slice(-2000)')));
}
async function navigate(width, id, locale = 'en') {
	await command('Emulation.setDeviceMetricsOverride', {
		width,
		height: 1000,
		deviceScaleFactor: 1,
		mobile: width < 500,
	});
	await command('Emulation.setUserAgentOverride', {
		userAgent:
			width < 500
				? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'
				: 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36',
	});
	await command('Page.navigate', {
		url: `http://localhost:3000${locale === 'en' ? '' : '/' + locale}/agent/detail?agentId=${id}`,
	});
	await until(
		"!!document.querySelector('.agent-profile-overview') || !!document.querySelector('.agent-profile-unavailable')",
		'profile',
	);
	if (await evaluate("!!document.querySelector('.agent-detail-cars')"))
		await until("document.querySelector('.agent-detail-cars').getAttribute('aria-busy')==='false'", 'cars');
}
async function screenshot(name) {
	await evaluate('scrollTo(0,0)');
	await delay(300);
	const clip = await evaluate(
		"(()=>{const r=document.querySelector('.agent-detail-page').getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1};})()",
	);
	const result = await command('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });
	fs.mkdirSync('docs/screenshots', { recursive: true });
	fs.writeFileSync(`docs/screenshots/${name}.png`, Buffer.from(result.data, 'base64'));
}
(async () => {
	try {
		const active = path.join(profile, 'DevToolsActivePort');
		for (let n = 0; n < 100 && !fs.existsSync(active); n++) await delay(100);
		const port = fs.readFileSync(active, 'utf8').split('\n')[0];
		const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
		socket = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
		await new Promise((resolve) => socket.once('open', resolve));
		socket.on('message', (raw) => {
			const m = JSON.parse(raw);
			if (m.id) {
				const p = pending.get(m.id);
				pending.delete(m.id);
				m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
			}
			if (m.method === 'Runtime.exceptionThrown') exceptions.push(m.params.exceptionDetails);
		});
		await command('Runtime.enable');
		await command('Page.enable');
		await command('Network.enable');
		const request = async (query, input) =>
			await (
				await fetch('http://localhost:3007/graphql', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ query, variables: { input } }),
				})
			).json();
		const agents = await request(
			'query($input:AgentsInquiry!){getAgents(input:$input){list{_id memberNick memberImage memberCars}metaCounter{total}}}',
			{ page: 1, limit: 20, sort: 'memberRank', direction: 'DESC', search: {} },
		);
		assert.ok(!agents.errors, JSON.stringify(agents.errors));
		const agent = agents.data.getAgents.list.find((a) => a.memberCars > 4);
		assert.ok(agent, 'populated real agent');
		for (const width of [1440, 1024, 768, 390, 320]) {
			console.log('Checking detail', width, agent._id);
			await navigate(width, agent._id);
			assert.equal(await evaluate("document.querySelectorAll('.cars-listing-card').length"), 4);
			assert.ok(
				await evaluate(
					"[...document.querySelectorAll('.agent-detail-container,.agent-detail-portrait,.agent-profile-stats,.agent-detail-actions,.cars-listing-card')].every(e=>{const r=e.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1})",
				),
				'bounds ' + width,
			);
			assert.equal(
				await evaluate(
					"getComputedStyle(document.querySelector('.agent-detail-cars')).gridTemplateColumns.split(' ').length",
				),
				width > 1100 ? 4 : width > 480 ? 2 : 1,
			);
			assert.ok(
				await evaluate("getComputedStyle(document.querySelector('.agent-detail-page')).fontFamily.includes('Poppins')"),
			);
			assert.equal(
				await evaluate(
					"JSON.parse(new URL(document.querySelector('.agent-view-all').href).searchParams.get('input')).search.memberId",
				),
				agent._id,
			);
			if (width === 1440 || width === 390) await screenshot('agent-detail-' + width);
			await evaluate("document.querySelector('.agent-contact-button').click()");
			await until("document.activeElement===document.querySelector('#agent-panel-contact h2')", 'contact focus');
			assert.ok(await evaluate('!!document.querySelector(\'#agent-panel-contact a[href^="tel:"]\')'));
			await evaluate("document.getElementById('agent-tab-about').click()");
			assert.ok(await evaluate("document.getElementById('agent-review-content').disabled"), 'guest review guard');
			await evaluate("document.getElementById('agent-tab-listings').click()");
		}
		await navigate(1440, agent._id);
		const first = await evaluate("document.querySelector('.cars-listing-title h2').textContent");
		await evaluate('document.querySelector(\'.agent-detail-pagination button[aria-label="Go to page 2"]\').click()');
		await delay(300);
		await until("document.querySelector('.agent-detail-cars').getAttribute('aria-busy')==='false'", 'page2');
		assert.notEqual(await evaluate("document.querySelector('.cars-listing-title h2').textContent"), first);
		await evaluate("document.querySelector('.agent-like-button').click()");
		await until("!!document.querySelector('.swal2-popup')", 'guest like');
		await evaluate("document.querySelector('.swal2-confirm').click()");
		await evaluate(
			"Object.defineProperty(navigator,'share',{value:undefined,configurable:true});Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true});document.querySelector('.agent-share-button').click()",
		);
		await until("!!document.querySelector('[aria-labelledby=agent-share-title] input')?.value", 'share fallback');
		assert.equal(
			await evaluate(
				"new URL(document.querySelector('[aria-labelledby=agent-share-title] input').value).searchParams.get('agentId')",
			),
			agent._id,
		);
		await evaluate("document.querySelector('[aria-labelledby=agent-share-title] button').click()");
		const photoAgent = agents.data.getAgents.list.find((a) => a.memberImage && a.memberCars === 0);
		if (photoAgent) {
			await navigate(1440, photoAgent._id);
			assert.ok(await evaluate("!!document.querySelector('.agent-detail-empty')"));
			await until("document.querySelector('.agent-detail-portrait img').complete", 'portrait');
			await screenshot('agent-detail-portrait');
		}
		for (const locale of ['kr', 'ru']) {
			await navigate(390, agent._id, locale);
			await until(
				"document.querySelector('.agent-contact-button').textContent!=='Contact Agent'",
				'localized ' + locale,
			);
			assert.ok(
				await evaluate(
					"[...document.querySelectorAll('.agent-detail-actions,.agent-profile-stats')].every(e=>e.getBoundingClientRect().right<=innerWidth+1)",
				),
			);
			const labels = JSON.parse(fs.readFileSync(`public/locales/${locale}/common.json`, 'utf8'));
			assert.equal(await evaluate("document.getElementById('agent-tab-about').textContent"), labels.About);
			assert.equal(await evaluate("document.getElementById('agent-tab-contact').textContent"), labels.Contact);
			await evaluate("Object.defineProperty(navigator,'share',{value:undefined,configurable:true});Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true});document.querySelector('.agent-share-button').click()");
			await until("!!document.querySelector('[aria-labelledby=agent-share-title] input')?.value", 'localized share');
			assert.equal(await evaluate("new URL(document.querySelector('[aria-labelledby=agent-share-title] input').value).pathname"), `/${locale}/agent/detail`);
		}
		await navigate(390, 'invalid');
		assert.ok(await evaluate("!!document.querySelector('.agent-profile-unavailable')"));
		await command('Network.setBlockedURLs', { urls: ['*localhost:3007/graphql*'] });
		await command('Page.navigate', { url: 'http://localhost:3000/agent/detail?agentId=' + agent._id });
		await until("!!document.querySelector('.agent-detail-container > .MuiAlert-root')", 'profile outage');
		await command('Network.setBlockedURLs', { urls: [] });
		await evaluate("document.querySelector('.agent-detail-container > .MuiAlert-root button').click()");
		await until("!!document.querySelector('.agent-profile-overview')", 'profile retry');
		assert.equal(await evaluate("document.querySelector('h1').textContent"), agent.memberNick);
		assert.deepEqual(exceptions, []);
		console.log(
			'PASS: live inventory, 4/2/1 grid across five widths, owner filter, pagination, guest guards, contact focus/tel, share fallback, portrait/empty, locales, invalid ID; no runtime exceptions.',
		);
	} finally {
		if (socket) socket.close();
		chrome.kill();
	}
})().catch((e) => {
	console.error(e);
	process.exitCode = 1;
});
