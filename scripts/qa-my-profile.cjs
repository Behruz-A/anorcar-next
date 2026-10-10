// Browser-only account fixtures. All API traffic is intercepted; no live account or data writes.
const assert = require('assert/strict'),
	fs = require('fs'),
	os = require('os'),
	path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'anorcar-my-profile-'));
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
		url: `http://localhost:3000${locale === 'en' ? '' : '/' + locale}/mypage?category=myProfile`,
	});
	await until("!!document.querySelector('#profile-username')", 'profile render');
	await until("document.querySelector('.account-photo-preview img').complete", 'photo');
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
			if (request.method !== 'OPTIONS') {
				let payload;
				try {
					payload = JSON.parse(request.postData || '{}');
				} catch {}
				if (payload?.query?.includes('mutation UpdateMember')) {
					mutations++;
					lastInput = payload.variables.input;
					if (mode === 'save-error') body = { errors: [{ message: 'Fixture save failure' }] };
					else {
						if (mode === 'slow') await delay(700);
						const updated = { ...claims, ...lastInput };
						body = {
							data: {
								updateMember: {
									...updated,
									__typename: 'Member',
									createdAt: '2026-01-01',
									updatedAt: '2026-10-10',
									deletedAt: null,
									accessToken: token(updated),
								},
							},
						};
					}
				} else if (request.postData?.includes('ImageUploader')) {
					uploads++;
					body =
						mode === 'upload-error'
							? { errors: [{ message: 'Fixture upload failure' }] }
							: { data: { imageUploader: '/img/agents/demo/sophie-park.png' } };
				}
			}
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
		for (const width of [1920, 1440, 1024, 768, 390, 320]) {
			await navigate(width);
			const hero = await evaluate(
				"(()=>{const el=document.querySelector('.header-basic.cars-hero'),r=el.getBoundingClientRect(),text=el.querySelector('.container').getBoundingClientRect();return {image:getComputedStyle(el).backgroundImage,title:el.querySelector('strong').textContent,desc:el.querySelector('span').textContent,height:r.height,bottom:r.bottom,textTop:text.top,textBottom:text.bottom,pageTop:document.querySelector('#my-page').getBoundingClientRect().top,overflow:document.documentElement.scrollWidth>innerWidth};})()",
			);
			assert.ok(hero.image.includes('/img/hero4.png'));
			assert.equal(hero.title, 'My Page');
			assert.equal(hero.desc, 'Manage your profile, favorites, and community activity.');
			assert.equal(hero.height, width <= 767 ? 220 : 300);
			assert.equal(hero.bottom, hero.pageTop);
			assert.ok(hero.textTop >= hero.bottom - hero.height && hero.textBottom <= hero.bottom);
			assert.equal(hero.overflow, false);
			if (width === 1920 || width === 1440 || width === 390) await screenshot('my-page-hero-fixture-' + width, true);
			const layout = await evaluate(
				"(()=>{const card=document.querySelector('#my-profile-page').getBoundingClientRect(),side=document.querySelector('.left-config').getBoundingClientRect();return {width:innerWidth,card:{left:card.left,right:card.right,top:card.top},side:{left:side.left,right:side.right,bottom:side.bottom},overflow:document.querySelector('#my-page').scrollWidth>innerWidth,field:document.querySelector('#profile-username').value,photo:document.querySelector('.account-photo-preview img').naturalWidth,active:document.querySelector('.account-nav-link.is-active').getAttribute('aria-current')};})()",
			);
			assert.equal(layout.overflow, false, JSON.stringify(layout));
			assert.ok(layout.card.left >= 0 && layout.card.right <= width);
			assert.ok(layout.photo > 0);
			assert.equal(layout.active, 'page');
			assert.equal(layout.field, claims.memberNick);
			if (width >= 768) assert.ok(layout.side.right < layout.card.left);
			else assert.ok(layout.side.bottom < layout.card.top);
			if (width < 768) {
				assert.equal(await evaluate("getComputedStyle(document.querySelector('.account-navigation')).display"), 'none');
				await evaluate("document.querySelector('.account-mobile-menu-toggle').click()");
				assert.equal(
					await evaluate("document.querySelector('.account-mobile-menu-toggle').getAttribute('aria-expanded')"),
					'true',
				);
				assert.equal(await evaluate("getComputedStyle(document.querySelector('.account-navigation')).display"), 'grid');
				assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false);
				await evaluate("document.querySelector('.account-mobile-menu-toggle').click()");
			}
			if (width === 1440 || width === 390) await screenshot(`my-profile-fixture-${width}`);
		}
		await navigate(1440);
		assert.equal(
			await evaluate("document.querySelector('.account-save-status').textContent.trim()"),
			'No changes to save.',
		);
		assert.ok(!(await evaluate("new URL(location.href).searchParams.has('carId')")));
		await command('Page.navigate', { url: 'http://localhost:3000/mypage?category=invalid&carId=' });
		await until(
			"!!document.querySelector('#profile-username') && new URL(location.href).searchParams.get('category') === 'myProfile' && !new URL(location.href).searchParams.has('carId')",
			'invalid query normalization',
		);
		assert.equal(await evaluate("document.querySelector('button[type=submit]').disabled"), true);
		await setInput('#profile-username', 'updatedname');
		assert.equal(await evaluate("document.querySelector('button[type=submit]').disabled"), false);
		await evaluate("document.querySelector('.account-profile-actions button').click()");
		assert.equal(await evaluate("document.querySelector('#profile-username').value"), claims.memberNick);
		await evaluate("document.querySelector('.account-remove-photo').click()");
		assert.ok(
			await evaluate(
				"document.querySelector('.account-photo-preview img').src.endsWith('/img/profile/defaultUser.svg')",
			),
		);
		await evaluate("document.querySelector('.account-profile-actions button').click()");
		await setInput('#profile-username', 'x');
		assert.equal(await evaluate("document.querySelector('button[type=submit]').disabled"), true);
		await command('Page.bringToFront');
		await evaluate("document.querySelector('#profile-username').focus()");
		await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
		await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
		await until(
			"document.querySelector('#profile-username').getAttribute('aria-invalid') === 'true'",
			'username blur validation',
		);
		assert.ok(await evaluate("document.querySelector('#profile-username-help').classList.contains('is-error')"));
		assert.equal(
			await evaluate("document.querySelector('.account-save-status').textContent.trim()"),
			'Check the required fields.',
		);
		await setInput('#profile-username', 'updatedname');
		await setInput('#profile-address', '');
		mode = 'slow';
		await evaluate(
			"document.querySelector('button[type=submit]').click();document.querySelector('button[type=submit]').click()",
		);
		await until("!!document.querySelector('.swal2-container')", 'save success');
		await until(
			"document.querySelector('#profile-username').value === 'updatedname' && !document.querySelector('.account-save-status').classList.contains('is-dirty')",
			'saved profile refresh',
		);
		assert.equal(
			await evaluate(
				"JSON.parse(atob(localStorage.getItem('accessToken').split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).memberAddress",
			),
			'',
		);
		assert.equal(mutations, 1);
		assert.equal(lastInput.memberAddress, '');
		assert.deepEqual(
			Object.keys(lastInput).sort(),
			['_id', 'memberAddress', 'memberImage', 'memberNick', 'memberPhone'].sort(),
		);
		assert.equal(await evaluate("document.querySelector('.account-user-name').textContent"), 'Min-jun Kim');
		await delay(1600);
		await navigate(1440);
		mode = 'save-error';
		await setInput('#profile-username', 'retryname');
		await evaluate("document.querySelector('button[type=submit]').click()");
		await until("!!document.querySelector('.account-profile-error')", 'save failure');
		assert.equal(await evaluate("document.querySelector('#profile-username').value"), 'retryname');
		await evaluate("document.querySelector('.swal2-confirm')?.click()");
		const upload = async (type, size) =>
			evaluate(
				`(async()=>{const f=new File([new Uint8Array(${size})],'test.png',{type:${JSON.stringify(
					type,
				)}});const d=new DataTransfer();d.items.add(f);const i=document.querySelector('input[type=file]');i.files=d.files;i.dispatchEvent(new Event('change',{bubbles:true}));})()`,
			);
		await upload('image/gif', 10);
		await until("document.querySelector('.account-profile-error')?.textContent.includes('5 MB')", 'mime validation');
		assert.equal(uploads, 0);
		await upload('image/png', 5 * 1024 * 1024 + 1);
		assert.equal(uploads, 0);
		mode = 'upload-error';
		await upload('image/png', 100);
		await until("document.querySelector('.account-profile-error')?.textContent.includes('upload')", 'upload failure');
		await evaluate("document.querySelector('.swal2-confirm')?.click()");
		mode = 'success';
		await upload('image/png', 100);
		await until(
			"document.querySelector('.account-photo-preview img').src.endsWith('sophie-park.png')",
			'upload preview',
		);
		assert.equal(uploads, 2);
		await evaluate("document.querySelector('.account-remove-photo').click()");
		await until(
			"document.querySelector('.account-photo-preview img').src.endsWith('/img/profile/defaultUser.svg')",
			'remove draft',
		);
		await evaluate("document.querySelector('button[type=submit]').click()");
		await until("!!document.querySelector('.swal2-container')", 'photo removal save');
		assert.equal(lastInput.memberImage, '');
		await navigate(390, 'kr');
		assert.equal(await evaluate("document.querySelector('.account-heading h1').textContent"), '내 계정');
		assert.equal(await evaluate("document.querySelector('label[for=profile-username]').textContent"), '사용자 이름');
		await navigate(390, 'ru');
		assert.equal(await evaluate("document.querySelector('.account-heading h1').textContent"), 'Мой аккаунт');
		await navigate(1440, 'en', 'AGENT');
		assert.ok(await evaluate("!!document.querySelector('.account-nav-link[href*=addCar]')"));
		assert.ok(await evaluate("!!document.querySelector('.account-nav-link[href*=myCars]')"));
		await navigate(1440, 'en', 'ADMIN');
		assert.ok(await evaluate('!!document.querySelector(\'.account-role[href="/_admin/users"]\')'));
		claims.memberImage = '';
		claims.memberAddress = '';
		claims.memberNick = 'Admin';
		claims.memberFullName = 'Admin';
		await navigate(1440, 'en', 'ADMIN');
		assert.equal(await evaluate("document.querySelector('.account-remove-photo').disabled"), true);
		await screenshot('my-profile-admin-empty-1440');
		await command('Page.addScriptToEvaluateOnNewDocument', { source: "localStorage.removeItem('accessToken');" });
		await evaluate("document.querySelector('.account-logout').click()");
		await until("!!document.querySelector('.swal2-cancel')", 'logout confirmation');
		await evaluate("document.querySelector('.swal2-cancel').click()");
		assert.ok(await evaluate("!!document.querySelector('#my-profile-page')"));
		await evaluate("document.querySelector('.account-logout').click()");
		await until("!!document.querySelector('.swal2-confirm')", 'logout confirm');
		await evaluate("document.querySelector('.swal2-confirm').click()");
		await until("location.pathname==='/account/join'", 'logout and guest redirect');
		assert.equal(await evaluate("localStorage.getItem('accessToken')"), null);
		assert.deepEqual(exceptions, []);
		console.log(
			'PASS: six responsive widths, EN/KR/RU, USER/AGENT/ADMIN menus, real form interactions, Cancel, valid/invalid drafts, empty address/photo removal, duplicate-save guard, JWT/storage refresh, upload validation/error/success, save error. API writes are browser fixtures only.',
		);
	} finally {
		if (socket) socket.close();
		chrome.kill();
	}
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
