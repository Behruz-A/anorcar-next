// Read-only CS UI verification; separate headless Chrome profile, no database writes.
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'anorcar-cs-'));
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
	const end = Date.now() + 60000;
	while (Date.now() < end) {
		if (await evaluate(expression)) return;
		await delay(200);
	}
	throw new Error(
		'Timeout ' +
			label +
			' ' +
			JSON.stringify(
				await evaluate(
					"({url:location.href,input:document.querySelector('.cs-search input')?.value,active:document.activeElement?.outerHTML,summary:document.querySelector('.cs-search-summary')?.textContent})",
				),
			),
	);
}
async function navigate(width, locale = 'en', query = '') {
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
		url: 'http://localhost:3000' + (locale === 'en' ? '' : '/' + locale) + '/cs' + query,
	});
	await until(
		"document.querySelector('.cs-topic-card') && document.querySelector('.cs-updates [aria-busy]')?.getAttribute('aria-busy')==='false'",
		'CS ready',
	);
	await delay(500);
}
async function screenshot(name) {
	await evaluate('scrollTo(0,0)');
	const r = await command('Page.captureScreenshot', {
		format: 'png',
		captureBeyondViewport: true,
		clip: await evaluate('({x:0,y:0,width:innerWidth,height:document.documentElement.scrollHeight,scale:1})'),
	});
	fs.mkdirSync('docs/screenshots', { recursive: true });
	fs.writeFileSync('docs/screenshots/' + name + '.png', Buffer.from(r.data, 'base64'));
}
(async () => {
	try {
		const active = path.join(profile, 'DevToolsActivePort');
		for (let n = 0; n < 100 && !fs.existsSync(active); n++) await delay(100);
		const port = fs.readFileSync(active, 'utf8').split('\n')[0];
		const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
		socket = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
		await new Promise((r) => socket.once('open', r));
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
		const api = await (
			await fetch('http://localhost:3007/graphql', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					query: 'query($input:BoardArticlesInquiry!){getBoardArticles(input:$input){list{_id articleTitle}}}',
					variables: {
						input: { page: 1, limit: 3, sort: 'createdAt', direction: 'DESC', search: { articleCategory: 'NEWS' } },
					},
				}),
			})
		).json();
		assert.ok(!api.errors, JSON.stringify(api.errors));
		for (const width of [1440, 1024, 768, 390, 320]) {
			await navigate(width);
			assert.equal(await evaluate("document.querySelectorAll('.cs-topic-card').length"), 6);
			assert.equal(await evaluate("document.querySelectorAll('.cs-faq-list .MuiAccordion-root').length"), 13);
			assert.ok(
				await evaluate('document.documentElement.scrollWidth <= innerWidth+1 && innerWidth <= ' + (width + 1)),
				'overflow ' +
					width +
					' ' +
					JSON.stringify(
						await evaluate(
							"[...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,cls:e.className,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right})).filter(e=>e.right>innerWidth+1||e.left < -1).slice(0,20)",
						),
					),
			);
			assert.deepEqual(
				await evaluate(
					"[...document.querySelectorAll('.cs-update-card')].map(a=>new URL(a.href).searchParams.get('id'))",
				),
				api.data.getBoardArticles.list.map((a) => a._id),
			);
			assert.ok(
				await evaluate("document.querySelector('.router-box a[href$=\"/cs\"]')?.getAttribute('aria-current')==='page'"),
			);
			if (width === 1440 || width === 390) await screenshot('cs-help-' + width);
			await evaluate("document.querySelectorAll('.cs-topic-card')[1].click()");
			await until("document.querySelectorAll('.cs-faq-list .MuiAccordion-root').length===2", 'selling filter');
			await until("location.search.includes('topic=selling')", 'selling URL');
			await evaluate("document.querySelector('.cs-category-filters button').click()");
			await until("document.querySelectorAll('.cs-faq-list .MuiAccordion-root').length===13", 'reset category');
			await evaluate("document.querySelector('#cs-question-compare').click()");
			assert.ok(
				await evaluate("document.querySelector('#cs-question-compare').getAttribute('aria-expanded')==='true'"),
			);
			assert.ok(await evaluate('!!document.querySelector(\'#cs-answer-compare a[href$="/car/compare"]\')'));
			console.log('PASS responsive/interactions', width);
		}
		await navigate(1440, 'en', '?tab=faq&q=transmission');
		assert.equal(await evaluate("document.querySelectorAll('.cs-faq-list .MuiAccordion-root').length"), 1);
		await navigate(1440, 'en', '?q=zzzznomatch');
		assert.ok(await evaluate("!!document.querySelector('.cs-faq-main .cs-empty')"));
		await evaluate("document.querySelector('.cs-empty button').click()");
		await until("document.querySelectorAll('.cs-faq-list .MuiAccordion-root').length===13", 'clear search');
		assert.equal(await evaluate("document.querySelectorAll('.cs-search').length"), 0);
		assert.equal(await evaluate("document.querySelectorAll('.cs-hero a, .cs-hero button, .cs-hero input').length"), 0);
		assert.equal(await evaluate("getComputedStyle(document.querySelector('.cs-hero')).borderBottomWidth"), '0px');
		for (const locale of ['kr', 'ru']) {
			await navigate(390, locale);
			assert.notEqual(await evaluate("document.querySelector('h1').textContent"), 'How can we help you?');
			assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
			console.log('PASS locale', locale);
		}
		await command('Network.setBlockedURLs', { urls: ['*localhost:3007/graphql*'] });
		await navigate(1440);
		assert.ok(await evaluate("!!document.querySelector('.cs-updates .MuiAlert-root')"));
		await command('Network.setBlockedURLs', { urls: [] });
		await evaluate("document.querySelector('.cs-updates .MuiAlert-root button').click()");
		await until("document.querySelectorAll('.cs-update-card').length===3", 'retry');
		assert.deepEqual(exceptions, []);
		console.log(
			'PASS CS topic navigation, accordion, legacy search links, real news, mobile, locales, retry; no runtime exceptions.',
		);
	} finally {
		if (socket) socket.close();
		chrome.kill();
	}
})().catch((e) => {
	console.error(e);
	process.exitCode = 1;
});
