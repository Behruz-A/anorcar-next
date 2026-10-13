// Real Apollo/React auth flow with isolated fetch/cookie fixtures, no live login or database writes.
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'anorcar-ai-ui-'));
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

const base=process.env.QA_BASE_URL || 'http://localhost:3000';
const fixture=`(()=>{
 if(location.origin!==${JSON.stringify(base)})return;
 localStorage.clear();window.__aiCalls=[];window.__liveSent=[];window.__liveSockets=[];window.__emitLive=(data)=>window.__liveSockets.filter(s=>s.readyState===1).forEach(s=>s.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(data)})));window.__mode='success';
 class FixtureSocket extends EventTarget {
  static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;
  readyState=0;bufferedAmount=0;protocol='';extensions='';binaryType='blob';
  constructor(url){super();this.url=url;window.__liveSockets.push(this);setTimeout(()=>{this.readyState=1;const event=new Event('open');this.dispatchEvent(event);this.onopen?.(event);},50);}
  send(data){window.__liveSent.push(data);if(JSON.parse(data).event==='message'){const msg=new MessageEvent('message',{data:JSON.stringify({event:'message',text:JSON.parse(data).data,memberData:null})});this.dispatchEvent(msg);this.onmessage?.(msg);}}
  close(){this.readyState=3;const event=new CloseEvent('close');this.dispatchEvent(event);this.onclose?.(event);}
 }
 window.WebSocket=FixtureSocket;
 const nativeFetch=window.fetch.bind(window);
 window.fetch=async(resource,options)=>{
  const url=typeof resource==='string'?resource:resource.url;
  if(url?.includes('/graphql')&&typeof options?.body==='string'){
   const body=JSON.parse(options.body);
   if(body.operationName==='AskAiAssistant') {
    window.__aiCalls.push({...body,headers:options.headers});await new Promise(resolve=>setTimeout(resolve,600));
    if(window.__mode==='offline')throw new TypeError('Fixture offline');
    if(window.__mode==='limit')return new Response(JSON.stringify({errors:[{message:'Too many AI requests. Please wait a minute and try again.'}]}),{headers:{'Content-Type':'application/json'}});
    if(window.__mode==='unavailable')return new Response(JSON.stringify({errors:[{message:'AI assistant is temporarily unavailable. Please try again later.'}]}),{headers:{'Content-Type':'application/json'}});
    const answer=body.variables.input.message.includes('salom')?'Salom! Mashinalar bo‘limida e’lonlarni ko‘rishingiz mumkin.':'Browse Cars, open a listing and contact its agent for current details.';
    return new Response(JSON.stringify({data:{askAiAssistant:{__typename:'AiChatResponse',answer}}}),{headers:{'Content-Type':'application/json'}});
   }
   if(body.query?.trim().startsWith('mutation'))throw new Error('Unexpected real mutation in AI QA');
  }
  return nativeFetch(resource,options);
 };
})();`;
async function navigate(width,locale='en',route='/account/join'){
 await command('Page.navigate',{url:'about:blank'});await until("location.href==='about:blank'",'blank');
 await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
 await command('Emulation.setUserAgentOverride',{userAgent:width<500?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1':'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36'});
 await command('Page.navigate',{url:base+(locale==='en'?'':'/'+locale)+route});
 await until("document.readyState==='complete'&&document.querySelectorAll('.support-launchers button').length===2",'launchers');await delay(500);
}
async function fill(text){await until("!document.getElementById('anorcar-ai-message').disabled",'ready input');await evaluate(`(()=>{const e=document.getElementById('anorcar-ai-message');e.focus();Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,${JSON.stringify(text)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);}
async function shot(name){await delay(400);const r=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const directory=process.env.QA_SCREENSHOT_DIR || 'docs/screenshots';fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,name+'.png'),Buffer.from(r.data,'base64'));}
const press=async(key,code,modifiers=0)=>{await command('Input.dispatchKeyEvent',{type:'keyDown',key,code,modifiers,...(key==='Enter'?{text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13}:{windowsVirtualKeyCode:27})});await command('Input.dispatchKeyEvent',{type:'keyUp',key,code,modifiers});};
(async()=>{try{
 const active=path.join(profile,'DevToolsActivePort');for(let n=0;n<100&&!fs.existsSync(active);n++)await delay(100);
 const port=fs.readFileSync(active,'utf8').split('\n')[0];const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>socket.once('open',r));
 socket.on('message',raw=>{const m=JSON.parse(raw);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails);});
 await command('Runtime.enable');await command('Page.enable');await command('Page.addScriptToEvaluateOnNewDocument',{source:fixture});
 for(const width of (process.env.QA_LOCALES_ONLY ? [] : [320,390,768,1440])){
  await navigate(width);
  await evaluate("document.querySelector('.support-live-button').click()");
  await evaluate("document.querySelectorAll('.private-chat-tabs button')[1].click()");
  assert.equal(await evaluate("document.querySelector('.live-online').textContent"),'\u2014');
  for(const count of [0,1,4,29,30,31,100]){
   await evaluate(`window.__emitLive({event:'info',totalClients:${count}})`);
   await until(`document.querySelector('.live-online').textContent===${JSON.stringify(count>30?'30+':String(count))}`,'online count');
   assert.equal(await evaluate("document.querySelector('.live-online').getAttribute('aria-label')"),'Online connections: '+count);
  }
  await evaluate("window.__emitLive({event:'info',totalClients:-1})");
  assert.equal(await evaluate("document.querySelector('.live-online').textContent"),'30+');
  await evaluate("window.__emitLive({event:'getMessages',list:[]});for(let i=0;i<5;i++)window.__emitLive({event:'message',text:'Message '+i,memberData:{_id:'fixture',memberNick:'Alex',memberImage:'/img/profile/defaultUser.svg'}})");
  await until("document.querySelectorAll('.live-message-row').length===5",'rapid message arrivals');
  assert.ok(await evaluate("(()=>{const p=document.querySelector('.chat-frame').getBoundingClientRect();return p.left>=0&&p.right<=innerWidth&&p.top>=0&&p.bottom<=innerHeight})()"));
  if(width===390||width===1440)await shot('live-chat-'+width);
  console.log('PASS live online 0-30/30+, rapid messages and responsive layout',width);

  await navigate(width);await evaluate("document.querySelector('.support-ai-button').click()");
  assert.equal(await evaluate("document.activeElement.id"),'anorcar-ai-message');
  assert.equal(await evaluate("document.querySelectorAll('.ai-suggestions button').length"),4);
  const bounds=await evaluate("(()=>{const p=document.querySelector('.ai-panel').getBoundingClientRect(),b=[...document.querySelectorAll('.support-launchers button')].map(e=>e.getBoundingClientRect());return p.left>=0&&p.right<=innerWidth&&p.top>=0&&p.bottom<=innerHeight&&b[0].right<b[1].left;})()");assert.ok(bounds);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.chat-frame')).display"),'none');
  if(width===1440||width===390)await shot('ai-welcome-'+width);
  await evaluate("document.querySelector('.support-live-button').click()");
  assert.ok(await evaluate("document.querySelector('.ai-panel').hidden"));assert.equal(await evaluate("document.querySelector('.chat-frame').classList.contains('open')"),true);
  await evaluate("document.querySelectorAll('.private-chat-tabs button')[1].click()");
  await evaluate("(()=>{const e=document.querySelector('.msg-input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'Fixture Live Chat');e.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await evaluate("document.querySelector('.send-msg-btn').click()");await until("window.__liveSent.some(s=>JSON.parse(s).data==='Fixture Live Chat')",'existing websocket send');
  await evaluate("document.querySelector('.support-ai-button').click()");await fill('How do I buy a car?');
  await evaluate("document.querySelector('.ai-compose').requestSubmit();document.querySelector('.ai-compose').requestSubmit()");
  await until("window.__aiCalls.length===1",'single mutation');assert.ok(await evaluate("document.querySelector('.ai-compose textarea').disabled"));
  await until("document.querySelectorAll('.ai-conversation .ai-message-ai').length===1",'answer');
  assert.equal(await evaluate('window.__aiCalls.length'),1);assert.deepEqual(await evaluate('window.__aiCalls[0].variables'),{input:{message:'How do I buy a car?'}});
  assert.ok(await evaluate("new Headers(window.__aiCalls[0].headers).get('X-Anorcar-Client')==='web'"));
  assert.equal(await evaluate("document.querySelector('.ai-compose textarea').value"),'');
  await fill('salom');await press('Enter','Enter');await until("document.querySelector('.ai-conversation').textContent.includes('Salom!')",'Uzbek response');
  await fill('Line one');await press('Enter','Enter',8);assert.ok(await evaluate("document.querySelector('.ai-compose textarea').value.includes('\\n')"));assert.equal(await evaluate('window.__aiCalls.length'),2);
  await evaluate("window.__mode='limit'");await fill('Retry this message');await press('Enter','Enter');await until("!!document.querySelector('.ai-error')",'rate error');
  assert.equal(await evaluate("document.querySelector('.ai-compose textarea').value"),'Retry this message');assert.equal(await evaluate("!!document.querySelector('.swal2-container')"),false,'no global popup');
  await evaluate("window.__mode='unavailable'");await press('Enter','Enter');await until("document.querySelector('.ai-error')?.textContent.includes('temporarily unavailable')",'provider error');
  await evaluate("window.__mode='success'");await press('Enter','Enter');await until("document.querySelector('.ai-compose textarea').value===''",'retry success');
  await press('Escape','Escape');assert.equal(await evaluate("document.querySelector('.ai-panel').hidden"),true);assert.ok(await evaluate("document.activeElement.classList.contains('support-ai-button')"));
  assert.equal(await evaluate("document.querySelectorAll('.support-launchers button').length"),2);assert.equal(await evaluate("document.querySelectorAll('.chat-button').length"),0);
  if(width===1440||width===390){await evaluate("document.querySelector('.support-ai-button').click()");await shot('ai-conversation-'+width);}
  console.log('PASS AI/live isolation, bounded layout, send, keyboard, inline error/retry',width);
 }
 for(const locale of ['kr','ru']){await navigate(390,locale);await evaluate("document.querySelector('.support-ai-button').click()");await until("document.getElementById('anorcar-ai-title').textContent!=='ANORCAR AI Assistant'",'localized title');assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));console.log('PASS locale',locale);}
 await navigate(390,'en','/');assert.equal(await evaluate("document.querySelectorAll('.support-launchers').length"),1);
 await navigate(390,'en','/cs');await evaluate("document.querySelector('.cs-support-primary').click()");assert.equal(await evaluate("document.querySelector('.ai-panel').hidden"),false,'FAQ AI action opens shared widget');
 assert.deepEqual(exceptions,[]);console.log('PASS AI UI + existing Live Chat, mobile/locales, no provider calls or real messages.');
}finally{if(socket)socket.close();chrome.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
