// Isolated browser fixtures: mutation requests are intercepted, no real database writes.
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'anorcar-inquiries-'));
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
 const role = localStorage.getItem('qaRole') || 'USER';
 const claims = {_id:'507f1f77bcf86cd799439011',memberType:role,memberStatus:'ACTIVE',memberNick:'QA Buyer',memberFullName:'QA Buyer',exp:Math.floor(Date.now()/1000)+3600};
 localStorage.setItem('accessToken',btoa(JSON.stringify({alg:'HS256'}))+'.'+btoa(JSON.stringify(claims))+'.qa');
 window.__qaCalls=[];window.__qaMode='success';window.__qaListMode='success';
 window.__qaRows=Array.from({length:23},(_,i)=>({__typename:'Inquiry',_id:'507f1f77bcf86cd799439'+String(i+100).padStart(3,'0'),memberId:claims._id,inquiryName:'QA Buyer '+i,inquiryEmail:'buyer'+i+'@example.test',inquirySubject:'TECHNICAL_SUPPORT',inquiryMessage:'Question '+i+' & model <A>\\nSecond line',inquiryStatus:'NEW',createdAt:'2026-10-12T00:00:00.000Z',updatedAt:'2026-10-12T00:00:00.000Z'}));
 const nativeFetch=window.fetch.bind(window);
 window.fetch=async(resource,options)=>{
  const address=typeof resource==='string'?resource:resource.url;
  if(address?.includes('3007/graphql')&&typeof options?.body==='string'){
   const body=JSON.parse(options.body),name=body.operationName;
   if(['CreateInquiry','GetAllInquiriesByAdmin','UpdateInquiryByAdmin'].includes(name)){
    window.__qaCalls.push(body);await new Promise(resolve=>setTimeout(resolve,350));
    if((name==='CreateInquiry'&&window.__qaMode==='error')||(name==='GetAllInquiriesByAdmin'&&window.__qaListMode==='error')||(name==='UpdateInquiryByAdmin'&&window.__qaMode==='error'))throw new TypeError('QA network failure');
    let data;
    if(name==='CreateInquiry') data={createInquiry:{__typename:'Inquiry',_id:'507f1f77bcf86cd799439099',inquiryStatus:'NEW',createdAt:'2026-10-12T00:00:00.000Z'}};
    if(name==='GetAllInquiriesByAdmin'){
     const input=body.variables.input;let rows=window.__qaRows.filter(row=>(!input.inquiryStatus||row.inquiryStatus===input.inquiryStatus)&&(!input.text||[row.inquiryName,row.inquiryEmail,row.inquiryMessage].some(value=>value.toLowerCase().includes(input.text.toLowerCase()))));
     data={getAllInquiriesByAdmin:{__typename:'Inquiries',list:rows.slice((input.page-1)*input.limit,input.page*input.limit),metaCounter:rows.length?[{__typename:'TotalCounter',total:rows.length}]:[]}};
    }
    if(name==='UpdateInquiryByAdmin'){const input=body.variables.input,row=window.__qaRows.find(row=>row._id===input._id);row.inquiryStatus=input.inquiryStatus;data={updateInquiryByAdmin:{__typename:'Inquiry',_id:row._id,inquiryStatus:row.inquiryStatus,updatedAt:row.updatedAt}};}
    return new Response(JSON.stringify({data}),{status:200,headers:{'Content-Type':'application/json'}});
   }
   if(body.query?.trim().startsWith('mutation')) throw new Error('Unexpected mutation in QA');
   const headers=new Headers(options.headers);headers.delete('authorization');
   return nativeFetch(resource,{...options,headers});
  }
  return nativeFetch(resource,options);
 };
})();`;
async function fill() {
	await evaluate(
		"(()=>{for(const [name,value]of Object.entries({name:' QA Buyer ',email:'buyer@example.test',message:' Question & model <A> '})){const el=document.querySelector('[name='+name+']');Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));}})()",
	);
	await evaluate(
		"document.querySelector('.cs-message-form .MuiSelect-select').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}))",
	);
	await until("!!document.querySelector('[data-value=TECHNICAL_SUPPORT]')", 'subject menu');
	await evaluate("document.querySelector('[data-value=TECHNICAL_SUPPORT]').click()");
}
async function screenshot(name) {
	await delay(300);
	const shot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
	fs.mkdirSync('docs/screenshots', { recursive: true });
	fs.writeFileSync('docs/screenshots/' + name + '.png', Buffer.from(shot.data, 'base64'));
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
		await command('Page.addScriptToEvaluateOnNewDocument', { source: fixture });
		for (const width of [1440, 390]) {
			await command('Emulation.setDeviceMetricsOverride', {
				width,
				height: 1000,
				deviceScaleFactor: 1,
				mobile: width < 500,
			});
			await command('Page.navigate', { url: 'http://localhost:3000/cs' });
			await until(
				"document.querySelector('.cs-message-form') && document.querySelector('.cs-updates [aria-busy]')?.getAttribute('aria-busy')==='false'",
				'hydrated contact form',
			);
			await delay(700);
			await command('Page.bringToFront');
			await fill();
			await evaluate(
				"window.__qaMode='error';document.querySelector('.cs-send-button').click();document.querySelector('.cs-message-form').requestSubmit()",
			);
			await until("document.querySelector('.cs-send-button').disabled", 'send lock');
			await until("!!document.querySelector('.cs-message-form .MuiAlert-standardError')", 'send failure');
			assert.equal(await evaluate("document.querySelector('textarea[name=message]').value"), ' Question & model <A> ');
			assert.equal(await evaluate('window.__qaCalls.length'), 1, 'duplicate submit blocked');
			await evaluate("window.__qaMode='success';document.querySelector('.cs-send-button').click()");
			await until("!!document.querySelector('.cs-message-form .MuiAlert-standardSuccess')", 'send success');
			assert.deepEqual(await evaluate('window.__qaCalls[1].variables.input'), {
				inquiryName: 'QA Buyer',
				inquiryEmail: 'buyer@example.test',
				inquirySubject: 'TECHNICAL_SUPPORT',
				inquiryMessage: 'Question & model <A>',
			});
			assert.equal(await evaluate("document.querySelector('textarea[name=message]').value"), '');
			assert.equal(await evaluate("document.querySelector('input[name=subject]').value"), '');
			assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
			await evaluate("document.querySelector('.cs-message-form').scrollIntoView({block:'center'})");
			await screenshot('cs-inquiry-sent-' + width);
			console.log('PASS buyer form success/failure/retry/double-submit/reset', width);
		}
		await evaluate("localStorage.setItem('qaRole','ADMIN')");
		await command('Emulation.setDeviceMetricsOverride', {
			width: 1440,
			height: 1000,
			deviceScaleFactor: 1,
			mobile: false,
		});
		await command('Page.navigate', { url: 'http://localhost:3000/_admin/cs/inquiry' });
		await until("document.querySelectorAll('tbody tr').length===20", 'admin list');
		await screenshot('admin-inquiries-1440');
		await evaluate('document.querySelector(\'button[aria-label="Go to next page"]\').click()');
		await until("document.querySelectorAll('tbody tr').length===3", 'pagination');
		await evaluate('document.querySelector(\'button[aria-label="Go to previous page"]\').click()');
		await until("document.querySelectorAll('tbody tr').length===20", 'previous page');
		await evaluate("document.querySelector('tbody button').click()");
		await until("!!document.querySelector('[role=dialog]')", 'inquiry detail');
		assert.ok(
			await evaluate("document.querySelector('[role=dialog]').textContent.includes('model <A>')"),
			'escaped content',
		);
		await screenshot('admin-inquiry-detail-1440');
		await evaluate(
			"window.__qaMode='error';Array.from(document.querySelectorAll('[role=dialog] button')).find(button=>button.textContent==='Mark as read').click()",
		);
		await until("!!document.querySelector('[role=dialog] .MuiAlert-standardError')", 'update failure');
		await evaluate(
			"window.__qaMode='success';Array.from(document.querySelectorAll('[role=dialog] button')).find(button=>button.textContent==='Mark as read').click()",
		);
		await until(
			"!Array.from(document.querySelectorAll('[role=dialog] button')).some(button=>button.textContent==='Mark as read')",
			'read status',
		);
		await until(
			"!Array.from(document.querySelectorAll('[role=dialog] button')).some(button=>button.disabled)",
			'refetch complete',
		);
		await evaluate(
			"Array.from(document.querySelectorAll('[role=dialog] button')).find(button=>button.textContent==='Close inquiry').click()",
		);
		await until(
			"Array.from(document.querySelectorAll('[role=dialog] button')).some(button=>button.textContent==='Reopen inquiry')",
			'closed status',
		);
		await until(
			"!Array.from(document.querySelectorAll('[role=dialog] button')).some(button=>button.disabled)",
			'close complete',
		);
		await evaluate(
			"Array.from(document.querySelectorAll('[role=dialog] button')).find(button=>button.textContent==='Reopen inquiry').click()",
		);
		await until(
			"Array.from(document.querySelectorAll('[role=dialog] button')).some(button=>button.textContent==='Mark as read')",
			'reopened status',
		);
		await until(
			"!Array.from(document.querySelectorAll('[role=dialog] button')).some(button=>button.disabled)",
			'reopen complete',
		);
		await evaluate(
			"Array.from(document.querySelectorAll('[role=dialog] button')).find(button=>button.textContent==='Close inquiry').click()",
		);
		await until(
			"Array.from(document.querySelectorAll('[role=dialog] button')).some(button=>button.textContent==='Reopen inquiry')",
			'closed again',
		);
		await until(
			"!Array.from(document.querySelectorAll('[role=dialog] button')).some(button=>button.disabled)",
			'second close complete',
		);
		await evaluate(
			"Array.from(document.querySelectorAll('[role=dialog] button')).find(button=>button.textContent==='Close').click()",
		);
		await until("!document.querySelector('[role=dialog]')", 'detail closed');
		await evaluate(
			"document.querySelector('.content .MuiSelect-select').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}))",
		);
		await until("!!document.querySelector('[data-value=CLOSED]')", 'status menu');
		await evaluate("document.querySelector('[data-value=CLOSED]').click()");
		await until("document.querySelectorAll('tbody tr').length===1", 'closed filter');
		await evaluate(
			"const el=document.querySelector('.content form input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'no match');el.dispatchEvent(new Event('input',{bubbles:true}));",
		);
		await evaluate("document.querySelector('.content form').requestSubmit()");
		await until("document.querySelector('.content')?.textContent.includes('No inquiries found.')", 'empty search');
		await evaluate(
			"window.__qaListMode='error';Array.from(document.querySelectorAll('.content button')).find(button=>button.textContent==='Refresh').click()",
		);
		await until(
			"document.querySelector('.content')?.textContent.includes('Inquiries could not be loaded.')",
			'list failure',
		);
		await evaluate(
			"window.__qaListMode='success';Array.from(document.querySelectorAll('.content button')).find(button=>button.textContent==='Retry').click()",
		);
		await until("document.querySelector('.content')?.textContent.includes('No inquiries found.')", 'list retry');
		assert.deepEqual(exceptions, []);
		console.log(
			'PASS admin list/detail/pagination/status/filter/search/error/retry; no runtime exceptions or database writes',
		);
	} finally {
		socket?.close();
		chrome.kill();
	}
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
