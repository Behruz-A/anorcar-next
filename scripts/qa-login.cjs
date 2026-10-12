// Real Apollo/React auth flow with isolated fetch/cookie fixtures, no live login or database writes.
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'anorcar-login-'));
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
	throw Error('Timeout: ' + label + ' ' + JSON.stringify(await evaluate("({url:location.href,ready:document.readyState,button:document.querySelector('.auth-submit')?.outerHTML,next:window.__NEXT_DATA__?.query,text:document.body.innerText.slice(0,600)})")) + ' exceptions: ' + JSON.stringify(exceptions));
}

const base = process.env.QA_BASE_URL || 'http://localhost:3000';
const fixture = `(() => {
 if(location.origin!==${JSON.stringify(base)})return;
 localStorage.clear(); window.__calls=[]; window.__mode='wrong';
 const nativeFetch=window.fetch.bind(window);
 window.fetch=async(resource,options)=>{
  const url=typeof resource==='string'?resource:resource.url;
  if(url.includes('/graphql')){
   const body=JSON.parse(options.body);window.__calls.push({...body,credentials:options.credentials,headers:options.headers});
   await new Promise(r=>setTimeout(r,500));
   if(window.__mode==='offline')throw new TypeError('Fixture offline');
   if(['Login','Signup'].includes(body.operationName)){
    if(window.__mode!=='success')return new Response(JSON.stringify({errors:[{message:window.__mode==='duplicate'?'Already used member nick or phone!':'Wrong password, try again!'}]}),{headers:{'Content-Type':'application/json'}});
    const claims={_id:'507f1f77bcf86cd799439011',memberType:body.variables.input.memberType||'USER',memberStatus:'ACTIVE',memberNick:body.variables.input.memberNick,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+900};
    const member={__typename:'Member',...claims,memberAuthType:'PHONE',memberPhone:'01000000000',memberFullName:'',memberImage:null,memberAddress:null,memberDesc:null,memberWarnings:0,memberBlocks:0,memberCars:0,memberRank:0,memberPoints:0,memberArticles:0,memberLikes:0,memberViews:0,deletedAt:null,createdAt:'2026-10-12T00:00:00Z',updatedAt:'2026-10-12T00:00:00Z',accessToken:btoa(JSON.stringify({alg:'HS256'}))+'.'+btoa(JSON.stringify(claims))+'.fixture'};
    return new Response(JSON.stringify({data:{[body.operationName==='Login'?'login':'signup']:member}}),{headers:{'Content-Type':'application/json'}});
   }
   return new Response(JSON.stringify({data:{}}),{headers:{'Content-Type':'application/json'}});
  }
  return nativeFetch(resource,options);
 };
})();`;
async function navigate(width=1440, query='', locale='en') {
 await command('Page.navigate',{url:'about:blank'});
 await until("location.href==='about:blank'&&!document.querySelector('.auth-page')",'blank');
 await command('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<500});
 await command('Emulation.setUserAgentOverride',{userAgent:width<500?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1':'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36'});
 await command('Page.navigate',{url:base+(locale==='en'?'':'/'+locale)+'/account/join'+query});
 await until("document.readyState==='complete'&&document.querySelector('.auth-page')?.getBoundingClientRect().width>0&&document.querySelector('.auth-submit')&&!document.querySelector('.auth-submit').disabled",'ready');
 await until(query.includes('mode=signup') ? "!!document.getElementById('auth-confirm')" : "!document.getElementById('auth-confirm')",'mode');
 await delay(600);
}
async function fill(values) {
 await evaluate(`(()=>{for(const [id,value]of Object.entries(${JSON.stringify(values)})){const e=document.getElementById('auth-'+id);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));}})()`);
}
async function submit() { await evaluate("document.querySelector('.auth-submit').click()"); }
async function screenshot(name) {
 const clip=await evaluate("(()=>{const r=document.querySelector('.auth-page').getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1};})()");
 const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});
 fs.mkdirSync('docs/screenshots',{recursive:true});fs.writeFileSync('docs/screenshots/'+name+'.png',Buffer.from(shot.data,'base64'));
}
(async()=>{
 try {
  const active=path.join(profile,'DevToolsActivePort');
  for(let n=0;n<100&&!fs.existsSync(active);n++)await delay(100);
  const port=fs.readFileSync(active,'utf8').split('\n')[0];
  const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
  socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>socket.once('open',r));
  socket.on('message',raw=>{const m=JSON.parse(raw);if(m.id){const item=pending.get(m.id);pending.delete(m.id);m.error?item.reject(Error(JSON.stringify(m.error))):item.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails);});
  await command('Runtime.enable');await command('Page.enable');await command('Page.addScriptToEvaluateOnNewDocument',{source:fixture});
  for(const width of (process.env.QA_FAST ? [] : [320,390,768,1024,1440])) {
   for(const mode of ['login','signup']) {
    await navigate(width,'?mode='+mode);
    assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'overflow '+width+' '+mode);
    assert.ok(await evaluate("document.querySelector('.navbar-main').getBoundingClientRect().bottom<=document.querySelector('.auth-frame').getBoundingClientRect().top"),'navbar clearance');
    assert.equal(await evaluate("document.getElementById('auth-password').type"),'password');
    assert.ok(await evaluate("[...document.querySelectorAll('.auth-page img')].every(i=>i.complete&&i.naturalWidth>0)"));
    await screenshot('auth-'+mode+'-'+width);
    if(width===1440&&mode==='login') {
     const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
     fs.writeFileSync('docs/screenshots/auth-page-1440.png',Buffer.from(shot.data,'base64'));
    }
   }
   console.log('PASS responsive',width);
  }
  await navigate();await submit();
  assert.equal(await evaluate('window.__calls.length'),0);
  assert.equal(await evaluate('document.activeElement.id'),'auth-nick');
  await fill({nick:' buyer ',password:'validpass'});
  await evaluate("document.querySelector('.auth-password button').click()");
  assert.equal(await evaluate("document.getElementById('auth-password').type"),'text');
  await evaluate("document.querySelector('.auth-password button').click()");
  await evaluate("document.querySelector('form').requestSubmit();document.querySelector('form').requestSubmit()");
  await until("!!document.querySelector('.auth-panel .MuiAlert-root')",'wrong password');
  assert.equal(await evaluate('window.__calls.length'),1,'double submit');
  assert.deepEqual(await evaluate('window.__calls[0].variables.input'),{memberNick:'buyer',memberPassword:'validpass'});
  assert.ok(await evaluate("window.__calls[0].credentials==='include'&&new Headers(window.__calls[0].headers).get('X-Anorcar-Client')==='web'"));
  assert.equal(await evaluate("document.getElementById('auth-password').value"),'validpass');
  await evaluate("window.__mode='offline'");await submit();await until("document.querySelector('.MuiAlert-root')?.textContent.includes('Unable to connect')",'offline retry');
  await navigate(390,'?mode=signup&referrer=%2Fcs');
  await fill({nick:'seller',password:'validpass',confirm:'wrong',phone:' '});await submit();
  assert.equal(await evaluate('window.__calls.length'),0);assert.equal(await evaluate("document.querySelectorAll('[aria-invalid=true]').length"),2);
  await fill({confirm:'validpass',phone:' 01000000000 '});await evaluate("document.querySelector('[value=AGENT]').click();window.__mode='duplicate'");await submit();
  await until("document.querySelector('.MuiAlert-root')?.textContent.includes('already registered')",'duplicate');
  assert.deepEqual(await evaluate('window.__calls[0].variables.input'),{memberNick:'seller',memberPassword:'validpass',memberPhone:'01000000000',memberType:'AGENT'});
  await screenshot('auth-signup-error-390');
  await evaluate("window.__mode='success'");await submit();await until("location.pathname==='/cs'",'signup return');
  assert.equal(await evaluate('JSON.parse(atob(localStorage.getItem("accessToken").split(".")[1])).memberType'),'AGENT');
  for(const referrer of ['/cs','//example.test','/\\example.test']) {
   await navigate(1440,'?referrer='+encodeURIComponent(referrer));await fill({nick:'buyer',password:'validpass'});await evaluate("window.__mode='success'");await submit();
   await until(`location.pathname===${JSON.stringify(referrer==='/cs'?'/cs':'/')}`,'safe return');
   assert.equal(await evaluate('location.origin'),base);
  }
  await navigate(390,'?referrer=%2Fcs');await evaluate("document.querySelectorAll('.auth-mode button')[1].click()");await until("!!document.getElementById('auth-confirm')",'mode switch');
  assert.equal(await evaluate("new URLSearchParams(location.search).get('referrer')"),'/cs');
  for(const locale of ['kr','ru']) {
   await navigate(390,'?mode=signup',locale);assert.notEqual(await evaluate("document.querySelector('.auth-panel h1').textContent"),'Create your account');
   assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));console.log('PASS locale',locale);
  }
  assert.deepEqual(exceptions,[]);console.log('PASS validation, password visibility, pending lock, errors/retry, role payload, sessions, safe return, mode/referrer, locales; no live auth writes.');
 } finally {if(socket)socket.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
