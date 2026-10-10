// Read-only checks against real agents in a separate temporary Chrome profile.
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'anorcar-community-'));
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
		url: 'http://localhost:3000' + (locale === 'en' ? '' : '/' + locale) + '/community' + query,
	});
	await until("document.querySelector('.community-results')?.getAttribute('aria-busy')==='false'", 'posts idle');
}
async function idle() {
	await delay(250);
	await until("document.querySelector('.community-results').getAttribute('aria-busy')==='false'", 'idle');
}
async function screenshot(name) {
	await evaluate(
		"(async()=>{for(const e of document.querySelectorAll('.community-post-image')){e.scrollIntoView({block:'center'});await new Promise(r=>setTimeout(r,150));}})()",
	);
	await until(
		"[...document.querySelectorAll('.community-post-image img')].every(i=>i.complete&&i.naturalWidth>0)",
		'post images',
	);
	await evaluate("document.querySelector('#community-list-page').scrollIntoView({block:'start'});scrollBy(0,-100)");
	await delay(300);
	const clip = await evaluate(
		"(()=>{const r=document.querySelector('#community-list-page').getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1};})()",
	);
	const r = await command('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });
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

		const real = await request(
			'query($input:BoardArticlesInquiry!){getBoardArticles(input:$input){list{_id articleTitle articleCategory articleViews articleLikes}metaCounter{total}}}',
			{ page: 1, limit: 6, sort: 'createdAt', direction: 'DESC', search: {} },
		);
		assert.ok(!real.errors, JSON.stringify(real.errors));
		const posts = real.data.getBoardArticles.list,
			total = real.data.getBoardArticles.metaCounter[0]?.total || 0;
		console.log('Live posts', total);
		for (const width of [1440, 1024, 768, 390, 320]) {
			console.log('Community', width);
			await navigate(width);
			assert.equal(await evaluate("document.querySelectorAll('.community-post-card').length"), posts.length);
			assert.ok(
				await evaluate(
					"[...document.querySelectorAll('.community-browse-container,.community-toolbar,.community-post-card')].every(e=>{const r=e.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1})",
				),
				'bounds ' + width,
			);
			assert.equal(
				await evaluate(
					"getComputedStyle(document.querySelector('.community-results')).gridTemplateColumns.split(' ').length",
				),
				width > 1000 ? 3 : width > 600 ? 2 : 1,
			);
			assert.deepEqual(
				await evaluate(
					"[...document.querySelectorAll('.community-post-content h2 a')].map(a=>new URL(a.href).searchParams.get('id'))",
				),
				posts.map((a) => a._id),
			);
			assert.ok(
				await evaluate(
					"getComputedStyle(document.querySelector('#community-list-page')).fontFamily.includes('Poppins')",
				),
			);
			assert.ok(
				await evaluate(`(()=>{
					const controls=[...document.querySelectorAll('.community-search,.community-sort,.community-view')];
					const heights=controls.map(e=>e.getBoundingClientRect().height);
					return Math.max(...heights)-Math.min(...heights)<1;
				})()`),
				'aligned control heights ' + width,
			);
			assert.ok(
				await evaluate(`(()=>{
					const cards=[...document.querySelectorAll('.community-post-card')];
					return cards.every(card=>{
						const image=card.querySelector('.community-post-image').getBoundingClientRect();
						const footer=card.querySelector('.community-post-footer').getBoundingClientRect();
						const excerpt=card.querySelector('.community-post-excerpt').getBoundingClientRect();
						return Math.abs(image.width/image.height-1.6)<.01 && excerpt.bottom<=footer.top &&
							[...card.querySelectorAll('.community-post-footer a,.community-post-stats')].every(e=>{
								const r=e.getBoundingClientRect();return r.left>=footer.left-1&&r.right<=footer.right+1;
							});
					});
				})()`),
				'image ratio and metadata clearance ' + width,
			);
			await evaluate("document.querySelector('.community-search input').focus()");
			assert.ok(
				await evaluate("getComputedStyle(document.querySelector('.community-search')).boxShadow!=='none'"),
				'visible search focus',
			);
			await evaluate("document.activeElement.blur()");
			if (width < 500) {
				assert.ok(
					await evaluate("(()=>{const e=document.querySelector('.community-categories');return e.scrollWidth>e.clientWidth&&getComputedStyle(e).overflowX==='auto'})()"),
					'scrollable mobile categories',
				);
			}
			if (width === 1440 || width === 390) await screenshot('community-browse-' + width);
			await evaluate("document.querySelectorAll('.community-view button')[1].click()");
			await idle();
			assert.ok(await evaluate("document.querySelector('.community-results').classList.contains('community-list')"));
			assert.ok(
				await evaluate(
					"[...document.querySelectorAll('.community-post-card')].every(e=>e.getBoundingClientRect().right<=innerWidth+1)",
				),
				'list bounds',
			);
		}
		await navigate(1440);
		await evaluate("document.querySelectorAll('.community-categories button')[1].click()");
		await idle();
		assert.equal(await evaluate("new URLSearchParams(location.search).get('articleCategory')"), 'FREE');
		assert.ok(
			await evaluate(
				"[...document.querySelectorAll('.community-post-category')].every(e=>e.textContent==='Free Board')",
			),
		);
		await evaluate("document.querySelector('.community-categories button').click()");
		await idle();
		async function search(value) {
			await evaluate(
				'(()=>{const e=document.querySelector(".community-search input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(e,' +
					JSON.stringify(value) +
					');e.dispatchEvent(new Event("input",{bubbles:true}));})()',
			);
			await delay(100);
			await evaluate("document.querySelector('.community-search').requestSubmit()");
			await idle();
		}
		if (posts.length) {
			await search(posts[0].articleTitle);
			assert.ok(await evaluate("document.querySelectorAll('.community-post-card').length>=1"));
		}
		await search('no-post-[.*]-match');
		assert.ok(await evaluate("!!document.querySelector('.community-empty')"));
		await evaluate("document.querySelector('.community-empty button').click()");
		await idle();
		await evaluate(
			"document.querySelector('.community-sort .MuiSelect-select').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}))",
		);
		await until("!!document.querySelector('[role=option]')", 'sort menu');
		await evaluate("document.querySelector('[role=option][data-value=likes]').click()");
		await idle();
		assert.equal(await evaluate("new URLSearchParams(location.search).get('sort')"), 'likes');
		await command('Page.reload');
		await delay(600);
		await idle();
		assert.equal(await evaluate("new URLSearchParams(location.search).get('sort')"), 'likes');
		if (total > 6) {
			await evaluate('document.querySelector(\'.community-pagination button[aria-label="Go to page 2"]\').click()');
			await idle();
			assert.equal(await evaluate("new URLSearchParams(location.search).get('page')"), '2');
		}
		await navigate(1440);
		if (posts.length) {
			await evaluate("document.querySelector('.community-post-stats button').click()");
			await until("!!document.querySelector('.swal2-popup')", 'guest like');
			await evaluate("document.querySelector('.swal2-confirm').click()");
		}
		await evaluate("document.querySelector('.community-write').click()");
		await until("!!document.querySelector('.swal2-popup')", 'guest write');
		await evaluate("document.querySelector('.swal2-confirm').click()");
		for (const locale of ['kr', 'ru']) {
			await navigate(390, locale);
			const labels = JSON.parse(fs.readFileSync('public/locales/' + locale + '/common.json', 'utf8'));
			assert.equal(
				await evaluate("document.querySelector('.community-heading h1').textContent"),
				labels['Explore Discussions'],
			);
			assert.ok(
				await evaluate("document.querySelector('.community-toolbar').getBoundingClientRect().right<=innerWidth+1"),
			);
		}
		await command('Network.setBlockedURLs', { urls: ['*localhost:3007/graphql*'] });
		await navigate(1440);
		assert.ok(await evaluate("!!document.querySelector('.community-results .MuiAlert-root')"));
		await command('Network.setBlockedURLs', { urls: [] });
		await evaluate("document.querySelector('.community-results .MuiAlert-root button').click()");
		await idle();
		assert.equal(await evaluate("document.querySelectorAll('.community-post-card').length"), posts.length);
		assert.deepEqual(exceptions, []);
		console.log(
			'PASS: live IDs, responsive grid/list, category/All, literal title search, empty/reset, sort/reload, pagination, guest like/write, KR/RU and backend retry; no runtime exceptions.',
		);
	} finally {
		if (socket) socket.close();
		chrome.kill();
	}
})().catch((e) => {
	console.error(e);
	process.exitCode = 1;
});
