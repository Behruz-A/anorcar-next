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
					"({url:location.href,active:document.activeElement?.tagName,summary:document.querySelector('.cs-message-form .MuiAlert-root')?.textContent})",
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
	await evaluate(
		"(async()=>{for(const e of document.querySelectorAll('.cs-update-image img,.cs-map')){e.scrollIntoView({block:'center'});await new Promise(r=>setTimeout(r,250));}})()",
	);
	await until(
		"[...document.querySelectorAll('.cs-update-image img')].every(i=>i.complete&&i.naturalWidth>0)",
		'news images',
	);
	await delay(1200);
	console.log(
		'Map frames',
		(await command('Page.getFrameTree')).frameTree.childFrames?.map((f) => ({
			url: f.frame.url,
			unreachable: f.frame.unreachableUrl,
		})),
	);
	const mapShot = await command('Page.captureScreenshot', {
		format: 'png',
		captureBeyondViewport: true,
		clip: await evaluate(
			"(()=>{const r=document.querySelector('.cs-map').getBoundingClientRect();return{x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1};})()",
		),
	});
	fs.writeFileSync('docs/screenshots/' + name + '-map.png', Buffer.from(mapShot.data, 'base64'));
	await evaluate('scrollTo(0,0)');
	const r = await command('Page.captureScreenshot', {
		format: 'png',
		captureBeyondViewport: true,
		clip: await evaluate('({x:0,y:0,width:innerWidth,height:document.documentElement.scrollHeight,scale:1})'),
	});
	fs.mkdirSync('docs/screenshots', { recursive: true });
	fs.writeFileSync('docs/screenshots/' + name + '.png', Buffer.from(r.data, 'base64'));
}
async function controlStyles() {
	await command('Page.bringToFront');
	await command('DOM.enable');
	await command('CSS.enable');
	const { root } = await command('DOM.getDocument');
	for (const name of ['name', 'email', 'subject', 'message']) {
		const wrapper = `.cs-message-form .MuiFormControl-root:has([name="${name}"]) .MuiOutlinedInput-root`;
		const target = name === 'subject' ? '.cs-message-form .MuiSelect-select' : `.cs-message-form [name="${name}"]`;
		const { nodeId } = await command('DOM.querySelector', { nodeId: root.nodeId, selector: wrapper });
		const field = () =>
			evaluate(
				`(()=>{const e=document.querySelector(${JSON.stringify(
					wrapper,
				)}),f=e.querySelector('fieldset'),i=document.querySelector(${JSON.stringify(
					target,
				)});return {border:getComputedStyle(f).borderTopColor,width:getComputedStyle(f).borderTopWidth,rootBorder:getComputedStyle(e).borderTopWidth,shadow:getComputedStyle(e).boxShadow,outline:getComputedStyle(i).outlineStyle};})()`,
			);
		assert.equal((await field()).border, 'rgb(229, 231, 235)', 'default ' + name);
		await command('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
		assert.equal((await field()).border, 'rgb(203, 213, 225)', 'hover ' + name);
		await command('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
		await evaluate(
			`(()=>{const e=document.querySelector(${JSON.stringify(
				target,
			)});e.scrollIntoView({block:'center'});e.focus();})()`,
		);
		await delay(50);
		const focused = await field();
		assert.equal(focused.border, 'rgb(23, 26, 32)', 'focus ' + name);
		assert.equal(focused.width, '1px', 'single fieldset ' + name);
		assert.equal(focused.rootBorder, '0px', 'no second border ' + name);
		assert.equal(focused.outline, 'none', 'no inner outline ' + name);
		assert.equal(focused.shadow, 'none', 'no root shadow ' + name);
		await evaluate('document.activeElement.blur()');
	}
	const emailNode = await command('DOM.querySelector', {
		nodeId: root.nodeId,
		selector: '.cs-message-form input[name=email]',
	});
	await command('CSS.forcePseudoState', { nodeId: emailNode.nodeId, forcedPseudoClasses: ['autofill'] });
	assert.ok(
		await evaluate(
			"getComputedStyle(document.querySelector('input[name=email]')).boxShadow.includes('rgb(255, 255, 255)')",
		),
		'neutral autofill mask',
	);
	await command('CSS.forcePseudoState', { nodeId: emailNode.nodeId, forcedPseudoClasses: [] });
	await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
	await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
	for (const selector of [
		'.cs-topic-card',
		'.cs-category-filters button',
		'#cs-question-search',
		'.cs-view-questions',
		'.cs-send-button',
		'.cs-support-secondary',
	]) {
		await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
		await delay(50);
		const cue = await evaluate(
			`(()=>{const e=document.querySelector(${JSON.stringify(
				selector,
			)}),s=getComputedStyle(e);return {visible:e.matches(':focus-visible')||e.classList.contains('Mui-focusVisible'),outline:s.outlineStyle,outlineColor:s.outlineColor,border:s.borderTopColor,parentBorder:e.closest('.MuiAccordion-root')?getComputedStyle(e.closest('.MuiAccordion-root')).borderTopColor:null};})()`,
		);
		assert.ok(cue.visible, 'keyboard focus ' + selector);
		assert.ok(
			cue.border === 'rgb(23, 26, 32)' ||
				cue.parentBorder === 'rgb(23, 26, 32)' ||
				(cue.outline !== 'none' && ['rgb(23, 26, 32)', 'rgb(255, 255, 255)'].includes(cue.outlineColor)),
			'neutral visible focus ' + selector,
		);
	}
	await evaluate('document.activeElement.blur()');
	console.log('PASS control default/hover/focus, neutral autofill CSS and keyboard indicators');
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
			assert.equal(await evaluate("document.querySelectorAll('.cs-faq-list .MuiAccordion-root').length"), 6);
			await evaluate("document.querySelector('.cs-view-questions').click()");
			assert.equal(await evaluate("document.querySelectorAll('.cs-faq-list .MuiAccordion-root').length"), 13);
			await evaluate("document.querySelector('.cs-view-questions').click()");
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
			assert.ok(await evaluate("document.querySelector('.cs-map iframe').src.includes('maps.google.com')"));
			assert.equal(
				await evaluate("document.querySelector('.cs-map-pin').textContent.includes('Seoul City Hall')"),
				true,
			);
			if (width === 1440 || width === 390) {
				await controlStyles();
				await evaluate('window.__draft=null;window.open=(url)=>{window.__draft=url;return null;}');
				assert.equal(await evaluate("document.querySelector('.cs-message-form').checkValidity()"), false);
				await evaluate("document.querySelector('input[name=email]').focus()");
				await command('Input.insertText', { text: 'invalid-email' });
				await evaluate("document.querySelector('.cs-message-form').requestSubmit()");
				assert.ok(
					await evaluate("document.querySelector('input[name=email]').matches(':user-invalid')"),
					'genuine invalid email',
				);
				assert.equal(
					await evaluate(
						"getComputedStyle(document.querySelector('.MuiFormControl-root:has(input[name=email]) fieldset')).borderTopColor",
					),
					'rgb(240, 68, 50)',
					'error border only for invalid field',
				);
				await evaluate(
					"(()=>{const set=(name,value)=>{const el=document.querySelector('[name='+name+']');Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));};set('name','QA Visitor');set('email','reviewer@example.test');set('message','   ');})()",
				);
				await evaluate(
					"document.querySelector('.cs-message-form .MuiSelect-select').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}))",
				);
				await until('!!document.querySelector(\'[data-value="TECHNICAL_SUPPORT"]\')', 'contact subject');
				await evaluate('document.querySelector(\'[data-value="TECHNICAL_SUPPORT"]\').focus()');
				await command('Input.dispatchKeyEvent', {
					type: 'keyDown',
					key: 'ArrowDown',
					code: 'ArrowDown',
					windowsVirtualKeyCode: 40,
				});
				await command('Input.dispatchKeyEvent', {
					type: 'keyUp',
					key: 'ArrowDown',
					code: 'ArrowDown',
					windowsVirtualKeyCode: 40,
				});
				assert.ok(
					await evaluate(
						"getComputedStyle(document.activeElement).outlineColor==='rgb(23, 26, 32)' && getComputedStyle(document.activeElement).outlineStyle==='solid'",
					),
					'dropdown keyboard focus',
				);
				await evaluate('document.querySelector(\'[data-value="TECHNICAL_SUPPORT"]\').click()');
				await evaluate("document.querySelector('.cs-send-button').click()");
				await until("!!document.querySelector('.cs-message-form .MuiAlert-standardError')", 'blank-message validation');
				await evaluate(
					"(()=>{const el=document.querySelector('textarea[name=message]');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,'Question & model <A>');el.dispatchEvent(new Event('input',{bubbles:true}));})()",
				);
				await evaluate("document.querySelector('textarea[name=message]').focus()");
				await delay(200);
				assert.ok(
					await evaluate(
						"(()=>{const t=document.querySelector('textarea[name=message]'),r=t.closest('.MuiOutlinedInput-root'),l=r.closest('.MuiFormControl-root').querySelector('label');return r.getBoundingClientRect().height>=104 && l.getBoundingClientRect().bottom<t.getBoundingClientRect().top && l.getAttribute('data-shrink')==='true';})()",
					),
					'message label clears typed text',
				);
				const messageShot = await command('Page.captureScreenshot', {
					format: 'png',
					captureBeyondViewport: true,
					clip: await evaluate(
						"(()=>{const r=document.querySelector('textarea[name=message]').closest('.MuiFormControl-root').getBoundingClientRect();return{x:r.left+scrollX-4,y:r.top+scrollY-12,width:r.width+8,height:r.height+16,scale:1};})()",
					),
				});
				fs.writeFileSync('docs/screenshots/cs-message-' + width + '.png', Buffer.from(messageShot.data, 'base64'));
				await evaluate("document.querySelector('.cs-send-button').click()");
				await until("!!document.querySelector('.cs-message-form .MuiAlert-standardInfo')", 'guest login prompt');
				assert.ok(await evaluate('!!document.querySelector(\'.cs-message-form a[href="/account/join"]\')'));
				assert.equal(await evaluate('window.__draft'), null, 'no email app launch');
				assert.equal(
					await evaluate("document.querySelector('textarea[name=message]').value"),
					'Question & model <A>',
					'guest message preserved',
				);
			}
			await evaluate("document.querySelectorAll('.cs-topic-card')[1].click()");
			await until("document.querySelectorAll('.cs-faq-list .MuiAccordion-root').length===2", 'selling filter');
			await until("location.search.includes('topic=selling')", 'selling URL');
			await evaluate("document.querySelector('.cs-category-filters button').click()");
			await until("document.querySelectorAll('.cs-faq-list .MuiAccordion-root').length===6", 'reset category');
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
		await until("document.querySelectorAll('.cs-faq-list .MuiAccordion-root').length===6", 'clear search');
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
