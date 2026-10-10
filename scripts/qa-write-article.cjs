// Browser-only account fixtures. All API traffic is intercepted; no live account or data writes.
const assert = require('assert/strict'),
	fs = require('fs'),
	os = require('os'),
	path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'anorcar-write-article-'));
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
	id = 0,
	mode = 'success',
	mutations = 0,
	uploads = 0,
	lastInput;
const pending = new Map(),
	exceptions = [];
const claims = {
	_id: '0123456789abcdef01234567',
	memberType: 'USER',
	memberStatus: 'ACTIVE',
	memberAuthType: 'PHONE',
	memberNick: 'minjun_kim92',
	memberFullName: 'Min-jun Kim',
	memberPhone: '+82 10-4867-2909',
	memberAddress: 'Teheran-ro 152, Gangnam-gu, Seoul, Republic of Korea (06236)',
	memberImage: '/img/agents/demo/junho-lee.png',
	memberCars: 0,
	memberRank: 0,
	memberArticles: 0,
	memberPoints: 0,
	memberLikes: 0,
	memberViews: 0,
	memberFollowers: 0,
	memberFollowings: 0,
	memberComments: 0,
	memberWarnings: 0,
	memberBlocks: 0,
	exp: Math.floor(Date.now() / 1000) + 3600,
};
const token = (data) =>
	[
		Buffer.from('{"alg":"none"}').toString('base64url'),
		Buffer.from(JSON.stringify(data)).toString('base64url'),
		'fixture',
	].join('.');
const command = (method, params = {}) =>
	new Promise((resolve, reject) => {
		const n = ++id;
		pending.set(n, { resolve, reject });
		socket.send(JSON.stringify({ id: n, method, params }));
	});
async function evaluate(expression) {
	const r = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
	if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
	return r.result.value;
}
async function until(expression, label) {
	const end = Date.now() + 45000;
	while (Date.now() < end) {
		if (await evaluate(expression)) return;
		await delay(150);
	}
	throw Error('Timed out ' + label + ' ' + (await evaluate('document.body.innerText.slice(0,1600)')));
}
async function setInput(selector, value) {
	await evaluate(
		`(()=>{const el=document.querySelector(${JSON.stringify(
			selector,
		)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(
			value,
		)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`,
	);
}
async function screenshot(name, includeHero = false) {
	await evaluate('scrollTo(0,0)');
	const clip = await evaluate(
		includeHero
			? "(()=>{const r=document.querySelector('#my-page').getBoundingClientRect();return {x:0,y:0,width:innerWidth,height:r.bottom+scrollY,scale:1};})()"
			: "(()=>{const r=document.querySelector('#my-page').getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1};})()",
	);
	const result = await command('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });
	fs.mkdirSync('docs/screenshots', { recursive: true });
	fs.writeFileSync(`docs/screenshots/${name}.png`, Buffer.from(result.data, 'base64'));
}
async function navigate(width, locale = 'en', role = 'USER') {
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
	claims.memberType = role;
	await command('Page.addScriptToEvaluateOnNewDocument', {
		source: `localStorage.setItem('accessToken',${JSON.stringify(
			token(claims),
		)}); window.WebSocket=class extends EventTarget { constructor(){super();this.readyState=1;} send(){} close(){} };`,
	});
	await command('Page.navigate', {
		url: `http://localhost:3000${locale === 'en' ? '' : '/' + locale}/mypage?category=writeArticle`,
	});
	await until(
		"!!document.querySelector('#article-title') && !!document.querySelector('.toastui-editor-ww-container [contenteditable=true]')",
		'article render',
	);

	await delay(250);
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
				m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result);
			}
			if (m.method === 'Runtime.exceptionThrown') exceptions.push(m.params.exceptionDetails);
			if (m.method === 'Fetch.requestPaused')
				void intercept(m.params).catch((error) => {
					console.error(error);
					process.exitCode = 1;
				});
		});

		async function intercept({ requestId, request }) {
			let body = { data: {} };
			let payload;
			try {
				payload = JSON.parse(request.postData || '{}');
			} catch {}
			if (payload?.query?.includes('mutation CreateBoardArticle')) {
				mutations++;
				lastInput = payload.variables.input;
				if (mode === 'save-error') body = { errors: [{ message: 'Fixture publish failure' }] };
				else {
					if (mode === 'slow') await delay(700);
					body = {
						data: {
							createBoardArticle: {
								...lastInput,
								__typename: 'BoardArticle',
								_id: 'abcdef0123456789abcdef01',
								articleStatus: 'ACTIVE',
								articleViews: 0,
								articleLikes: 0,
								articleComments: 0,
								memberId: claims._id,
								createdAt: '2026-10-10',
								updatedAt: '2026-10-10',
							},
						},
					};
				}
			} else if (request.postData?.includes('ImageUploader')) {
				uploads++;
				body =
					mode === 'upload-error'
						? { errors: [{ message: 'Fixture upload failure' }] }
						: { data: { imageUploader: '/img/community/articleImg.png' } };
			} else if (payload?.query?.includes('getMyBoardArticles'))
				body = { data: { getMyBoardArticles: { list: [], metaCounter: [{ total: 0 }] } } };
			await command('Fetch.fulfillRequest', {
				requestId,
				responseCode: 200,
				responseHeaders: [
					{ name: 'Content-Type', value: 'application/json' },
					{ name: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' },
					{ name: 'Access-Control-Allow-Headers', value: 'authorization,content-type,apollo-require-preflight' },
				],
				body: Buffer.from(JSON.stringify(body)).toString('base64'),
			});
		}
		await command('Runtime.enable');
		await command('Page.enable');
		await command('Fetch.enable', {
			patterns: [
				{ urlPattern: '*localhost:3007/*', requestStage: 'Request' },
				{ urlPattern: '*127.0.0.1:3007/*', requestStage: 'Request' },
			],
		});
		const click = async (selector) => {
			const point = await evaluate(
				`(()=>{const el=document.querySelector(${JSON.stringify(
					selector,
				)});el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`,
			);
			await command('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
			await command('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
			await delay(300);
		};
		const typeContent = async (text) => {
			await command('Page.bringToFront');
			await evaluate("document.querySelector('.toastui-editor-ww-container [contenteditable=true]').focus()");
			await command('Input.insertText', { text });
			await delay(150);
		};
		const selectCategory = async (value = 'NEWS') => {
			await click('#article-category');
			await until("!!document.querySelector('[role=option][data-value=NEWS]')", 'category menu');
			await delay(350);
			await click(`[role=option][data-value=${value}]`);
			await until("!document.querySelector('[role=option][data-value=NEWS]')", 'category selected');
		};
		const uploadFile = async (selector, type = 'image/png', size = 10) => {
			await evaluate(
				`(()=>{const input=document.querySelector(${JSON.stringify(
					selector,
				)}),transfer=new DataTransfer();transfer.items.add(new File([new Uint8Array(${size})],'fixture.png',{type:${JSON.stringify(
					type,
				)}}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`,
			);
		};
		for (const width of [1440, 1024, 768, 390, 320]) {
			await navigate(width);
			assert.equal(await evaluate("document.querySelector('.account-heading h1').textContent"), 'Write an Article');
			assert.ok(await evaluate("document.querySelector('.account-nav-link.is-active').href.includes('writeArticle')"));
			assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false);
			assert.equal(await evaluate("document.querySelector('.article-publish-button').disabled"), true);
			assert.equal(
				await evaluate(
					"(()=>{const el=document.querySelector('.toastui-editor-ww-container .ProseMirror').cloneNode(true);el.querySelectorAll('.placeholder').forEach(n=>n.remove());return el.textContent.trim()})()",
				),
				'',
			);
			assert.ok(
				await evaluate(
					"getComputedStyle(document.querySelector('.toastui-editor-ww-container .ProseMirror')).minHeight==='380px'",
				),
			);
			if (width === 1440 || width === 390) await screenshot(`write-article-fixture-${width}`);
			await click('.article-image-toolbar-button');
			await until("!!document.querySelector('.article-image-dialog .MuiDialog-paper')", 'image dialog');
			await delay(350);
			assert.equal(
				await evaluate(
					"(()=>{const r=document.querySelector('.article-image-dialog .MuiDialog-paper').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})()",
				),
				true,
			);
			if (width === 1440 || width === 390) {
				const r = await command('Page.captureScreenshot', { format: 'png' });
				fs.writeFileSync(`docs/screenshots/article-image-dialog-fixture-${width}.png`, Buffer.from(r.data, 'base64'));
			}
			await click('.article-image-dialog .MuiDialogActions-root button');
			await until("!document.querySelector('.article-image-dialog .MuiDialog-paper')", 'image dialog closed');
		}
		await navigate(1440);
		await click('#article-title');
		await setInput('#article-title', 'a');
		await selectCategory();
		await until("document.querySelector('#article-title-help').classList.contains('is-error')", 'title blur error');
		await setInput('#article-title', 'A road trip');
		await typeContent('Driving along the coast.');
		await until("!document.querySelector('.article-publish-button').disabled", 'valid article');
		await click('.toastui-editor-mode-switch .tab-item');
		await until(
			"getComputedStyle(document.querySelector('.toastui-editor-md-container')).display!=='none'",
			'Markdown switch',
		);
		assert.ok(
			await evaluate(
				"document.querySelector('.toastui-editor-md-container').textContent.includes('Driving along the coast.')",
			),
		);
		await click('.toastui-editor-mode-switch .tab-item:last-child');
		await until(
			"getComputedStyle(document.querySelector('.toastui-editor-ww-container')).display!=='none'",
			'WYSIWYG switch',
		);
		await uploadFile('#article-cover-file', 'image/gif');
		await until("document.querySelector('.article-error')?.textContent.includes('JPG')", 'MIME validation');
		assert.equal(uploads, 0);
		await uploadFile('#article-cover-file', 'image/png', 15000001);
		await until("document.querySelector('.article-error')?.textContent.includes('15 MB')", 'size validation');
		assert.equal(uploads, 0);
		mode = 'upload-error';
		await uploadFile('#article-cover-file');
		await until(
			"document.querySelector('.article-error')?.textContent.includes('Fixture upload failure')",
			'cover upload error',
		);
		mode = 'success';
		await uploadFile('#article-cover-file');
		await until("!!document.querySelector('.article-cover img')", 'cover upload');
		await until("document.querySelector('.article-cover img').complete", 'cover loaded');
		assert.ok(await evaluate("document.querySelector('.article-cover img').naturalWidth>0"));
		await click('.article-cover-buttons button:last-child');
		assert.equal(await evaluate("!!document.querySelector('.article-cover img')"), false);
		await click('.article-image-toolbar-button');
		await click('#article-image-tab-url');
		await setInput('.article-image-dialog input[placeholder="https://"]', 'javascript:alert(1)');
		await click('.article-image-dialog .MuiDialogActions-root button:last-child');
		await until(
			"document.querySelector('.article-image-dialog .article-error')?.textContent.includes('HTTP')",
			'URL validation',
		);
		await setInput(
			'.article-image-dialog input[placeholder="https://"]',
			'http://localhost:3000/img/community/articleImg.png',
		);
		await setInput('.article-image-description input', 'Coastal road');
		await click('.article-image-dialog .MuiDialogActions-root button:last-child');
		await until(
			'!!document.querySelector(\'.toastui-editor-ww-container img[alt="Coastal road"]\')',
			'URL image insertion',
		);
		assert.ok(
			await evaluate("document.querySelector('.toastui-editor-ww-container').innerHTML.includes('Coastal road')"),
		);
		await until("!document.querySelector('.article-publish-button').disabled", 'valid image article');
		mode = 'save-error';
		await click('.article-publish-button');
		await until(
			"document.querySelector('.article-error')?.textContent.includes('Fixture publish failure')",
			'publish failure',
		);
		assert.equal(await evaluate("document.querySelector('#article-title').value"), 'A road trip');
		await until("!!document.querySelector('.swal2-popup')", 'failure alert');
		await evaluate("document.querySelector('.swal2-container').click()");
		mode = 'slow';
		const before = mutations;
		await evaluate(
			"document.querySelector('.article-publish-button').click();document.querySelector('.article-publish-button').click();",
		);
		await until(
			"document.querySelector('.article-publish-button')?.textContent.includes('Publishing')",
			'publishing state',
		);
		assert.equal(await evaluate("document.querySelector('.article-publish-button').disabled"), true);
		await until("location.search.includes('category=myArticles')", 'published redirect');
		assert.equal(mutations, before + 1);
		assert.equal(lastInput.articleCategory, 'NEWS');
		assert.equal(lastInput.articleTitle, 'A road trip');
		assert.equal(lastInput.articleImage, '');
		assert.ok(lastInput.articleContent.includes('Coastal road'));
		assert.deepEqual(Object.keys(lastInput).sort(), [
			'articleCategory',
			'articleContent',
			'articleImage',
			'articleTitle',
		]);
		await navigate(390);
		await setInput('#article-title', 'Mobile story');
		await selectCategory('FREE');
		await typeContent('A weekend drive.');
		await click('.article-image-toolbar-button');
		mode = 'upload-error';
		await uploadFile('#article-inline-file');
		await click('.article-image-dialog .MuiDialogActions-root button:last-child');
		await until(
			"document.querySelector('.article-image-dialog .article-error')?.textContent.includes('Fixture upload failure')",
			'inline upload error',
		);
		mode = 'success';
		await click('.article-image-dialog .MuiDialogActions-root button:last-child');
		await until("!!document.querySelector('.toastui-editor-ww-container img')", 'inline file insertion');
		await until("!!document.querySelector('.article-cover img')", 'existing thumbnail fallback');
		await click('.article-publish-buttons button:first-child');
		await until("!!document.querySelector('.swal2-cancel')", 'discard confirmation');
		await click('.swal2-cancel');
		assert.equal(await evaluate("document.querySelector('#article-title').value"), 'Mobile story');
		await click('.article-publish-buttons button:first-child');
		await until("!!document.querySelector('.swal2-confirm')", 'discard confirmation');
		await click('.swal2-confirm');
		await until("location.search.includes('category=myArticles')", 'cancel redirect');
		for (const [locale, heading] of [
			['kr', '글 작성'],
			['ru', 'Написать статью'],
		]) {
			await navigate(1440, locale, 'AGENT');
			assert.equal(await evaluate("document.querySelector('.account-heading h1').textContent"), heading);
			assert.ok(
				await evaluate(
					"!!document.querySelector('.account-nav-link[href*=addCar]')&&!!document.querySelector('.account-nav-link[href*=myCars]')",
				),
			);
			await click('.article-image-toolbar-button');
			assert.ok(await evaluate("document.querySelector('#article-image-title').textContent!=='Insert Image'"));
			await click('.article-image-dialog .MuiDialogActions-root button');
		}
		assert.deepEqual(exceptions, []);
		console.log(
			'PASS: five widths, real Toast UI typing/mode switching, EN/KR/RU, role menus, image dialog/file/URL, cover upload/remove, MIME/size/errors, publish validation/error/success/pending/duplicate guard, exact existing GraphQL input and Cancel. All API writes intercepted fixtures.',
		);
	} catch (error) {
		await screenshot('write-article-qa-failure');
		throw error;
	} finally {
		if (socket) socket.close();
		chrome.kill();
	}
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
