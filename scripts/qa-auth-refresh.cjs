// Real Apollo/React auth flow with isolated fetch/cookie fixtures, no live login or database writes.
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'anorcar-auth-'));
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
	sequence = 0;
const pending = new Map(),
	exceptions = [];
const command = (method, params = {}) =>
	new Promise((resolve, reject) => {
		const id = ++sequence;
		pending.set(id, { resolve, reject });
		socket.send(JSON.stringify({ id, method, params }));
	});
async function evaluate(expression) {
	const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
	if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
	return result.result.value;
}
async function until(expression, label) {
	for (let n = 0; n < 180; n++) {
		if (await evaluate(expression)) return;
		await delay(200);
	}
	throw Error('Timeout: ' + label + ' ' + (await evaluate('document.body.innerText.slice(-800)')));
}

const fixture = `(() => {
 if(location.origin!=='http://localhost:3000')return;
 const claims={_id:'507f1f77bcf86cd799439011',memberType:localStorage.getItem('qaRole')||'USER',memberStatus:'ACTIVE',memberNick:'Auth QA',memberFullName:'Auth QA'};
 const token=expired=>btoa(JSON.stringify({alg:'HS256'}))+'.'+btoa(JSON.stringify({...claims,iat:Math.floor(Date.now()/1000),exp:expired?1:Math.floor(Date.now()/1000)+900}))+'.qa';
 if(!localStorage.getItem('qaLoggedOut')){localStorage.setItem('accessToken',token(Boolean(localStorage.getItem('qaStartExpired'))));localStorage.setItem('authSession','cookie');}
 window.__expiredToken=token(true);window.__authCalls=[];window.__protectedCalls=[];window.__serverExpiry=false;
 const nativeFetch=window.fetch.bind(window);
 window.fetch=async(resource,options)=>{
  const url=typeof resource==='string'?resource:resource.url;
  if(url?.includes('3007/graphql')&&typeof options?.body==='string'){
   const request=JSON.parse(options.body),name=request.operationName;
   if(name==='RefreshAccessToken'||name==='Logout'){
    window.__authCalls.push({name,credentials:options.credentials,headers:options.headers});await new Promise(resolve=>setTimeout(resolve,300));
    if(name==='Logout'){localStorage.setItem('qaLoggedOut','1');return new Response(JSON.stringify({data:{logout:true}}),{headers:{'Content-Type':'application/json'}});}
    return new Response(JSON.stringify({data:{refreshAccessToken:{accessToken:token(false)}}}),{headers:{'Content-Type':'application/json'}});
   }
   if(name==='CreateInquiry'){
    window.__protectedCalls.push({request,headers:options.headers});
    if(window.__serverExpiry){window.__serverExpiry=false;return new Response(JSON.stringify({errors:[{message:'ACCESS_TOKEN_EXPIRED',extensions:{code:'UNAUTHENTICATED'}}]}),{headers:{'Content-Type':'application/json'}});}
    return new Response(JSON.stringify({data:{createInquiry:{__typename:'Inquiry',_id:'507f1f77bcf86cd799439099',inquiryStatus:'NEW',createdAt:'2026-10-12T00:00:00.000Z'}}}),{headers:{'Content-Type':'application/json'}});
   }
   if(name==='GetAllInquiriesByAdmin')return new Response(JSON.stringify({data:{getAllInquiriesByAdmin:{__typename:'Inquiries',list:[],metaCounter:[]}}}),{headers:{'Content-Type':'application/json'}});
   if(request.query?.trim().startsWith('mutation'))throw Error('Unexpected mutation in QA');
   const headers=new Headers(options.headers);headers.delete('authorization');return nativeFetch(resource,{...options,headers});
  }
  return nativeFetch(resource,options);
 };
})();`;
async function fill() {
	await evaluate(
		"(()=>{for(const[name,value]of Object.entries({name:'Auth QA',email:'qa@example.test',message:'Refresh test message'})){const e=document.querySelector('[name='+name+']');Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));}})()",
	);
	await evaluate(
		"document.querySelector('.cs-message-form .MuiSelect-select').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}))",
	);
	await until("!!document.querySelector('[data-value=TECHNICAL_SUPPORT]')", 'subject');
	await evaluate("document.querySelector('[data-value=TECHNICAL_SUPPORT]').click()");
}
(async () => {
	try {
		const active = path.join(profile, 'DevToolsActivePort');
		for (let n = 0; n < 100 && !fs.existsSync(active); n++) await delay(100);
		const port = fs.readFileSync(active, 'utf8').split('\n')[0],
			targets = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
		socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
		await new Promise((resolve) => socket.once('open', resolve));
		socket.on('message', (raw) => {
			const message = JSON.parse(raw);
			if (message.id) {
				const item = pending.get(message.id);
				pending.delete(message.id);
				message.error ? item.reject(Error(JSON.stringify(message.error))) : item.resolve(message.result);
			}
			if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
		});
		await command('Runtime.enable');
		await command('Page.enable');
		await command('Network.enable');
		await command('Page.addScriptToEvaluateOnNewDocument', { source: fixture });
		await command('Network.setCookie', {
			name: 'anorcar_refresh',
			value: 'qa-cookie-fixture',
			url: 'http://localhost:3007/graphql',
			path: '/graphql',
			httpOnly: true,
			sameSite: 'Lax',
		});
		for (const width of [1440, 390]) {
			await command('Emulation.setDeviceMetricsOverride', {
				width,
				height: 1000,
				deviceScaleFactor: 1,
				mobile: width < 500,
			});
			await command('Page.navigate', { url: 'http://localhost:3000/cs' });
			await until(
				"document.querySelector('.cs-updates [aria-busy]')?.getAttribute('aria-busy')==='false'",
				'hydrated FAQ',
			);
			await command('Page.bringToFront');
			await fill();
			await evaluate(
				"localStorage.setItem('accessToken',window.__expiredToken);document.querySelector('.cs-send-button').click()",
			);
			await until('window.__authCalls.length===1', 'refresh started');
			assert.equal(await evaluate('window.__protectedCalls.length'), 0, 'mutation waits for refresh');
			await until("!!document.querySelector('.cs-message-form .MuiAlert-standardSuccess')", 'refreshed mutation');
			assert.equal(await evaluate('window.__protectedCalls.length'), 1);
			assert.ok(
				await evaluate(
					"window.__authCalls[0].credentials==='include'&&window.__authCalls[0].headers['X-Anorcar-Client']==='web'",
				),
			);
			assert.ok(
				await evaluate(
					"new Headers(window.__protectedCalls[0].headers).get('authorization')==='Bearer '+localStorage.getItem('accessToken')",
				),
			);
			assert.equal(await evaluate("!!document.querySelector('.swal2-container')"), false, 'no refresh popup');
			await fill();
			await evaluate("window.__serverExpiry=true;document.querySelector('.cs-send-button').click()");
			await until('window.__protectedCalls.length===3', 'one server-expiry retry');
			await until("!!document.querySelector('.cs-message-form .MuiAlert-standardSuccess')", 'retry succeeds');
			assert.equal(await evaluate('window.__authCalls.length'), 2);
			assert.equal(await evaluate("!!document.querySelector('.swal2-container')"), false);
			console.log('PASS silent Apollo preflight and one expiry retry', width);
		}
		const cookies = await command('Network.getCookies', { urls: ['http://localhost:3007/graphql'] });
		assert.equal(cookies.cookies.find((cookie) => cookie.name === 'anorcar_refresh').httpOnly, true);
		assert.equal(await evaluate("localStorage.getItem('refreshToken')"), null);
		await evaluate("localStorage.setItem('qaRole','ADMIN');localStorage.setItem('qaStartExpired','1')");
		await command('Emulation.setDeviceMetricsOverride', {
			width: 1440,
			height: 1000,
			deviceScaleFactor: 1,
			mobile: false,
		});
		await command('Page.navigate', { url: 'http://localhost:3000/_admin/cs/inquiry' });
		await until(
			"document.querySelector('.content')?.textContent.includes('No inquiries found.')",
			'admin cookie restoration',
		);
		assert.ok(
			await evaluate("location.pathname==='/_admin/cs/inquiry'&&window.__authCalls.length===1"),
			'no premature admin redirect',
		);
		await evaluate("localStorage.setItem('qaRole','USER');localStorage.removeItem('qaStartExpired')");
		await command('Page.navigate', { url: 'http://localhost:3000/cs' });
		await until(
			"document.querySelector('.cs-updates [aria-busy]')?.getAttribute('aria-busy')==='false'",
			'logout page',
		);
		await evaluate("document.querySelector('.login-user').click()");
		await until(
			"Array.from(document.querySelectorAll('[role=menuitem]')).some(item=>item.textContent.toLowerCase().includes('logout'))",
			'logout menu',
		);
		await evaluate(
			"Array.from(document.querySelectorAll('[role=menuitem]')).find(item=>item.textContent.toLowerCase().includes('logout')).click()",
		);
		await until("localStorage.getItem('qaLoggedOut')==='1'&&!localStorage.getItem('accessToken')", 'server logout');
		assert.deepEqual(exceptions, []);
		console.log('PASS HttpOnly fixture, admin restoration and cookie logout; no popup or database writes');
	} finally {
		socket?.close();
		chrome.kill();
	}
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
