// Read-only checks against real agents in a separate temporary Chrome profile.
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'anorcar-agent-directory-'));
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--disable-gpu','about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket, id=0;
const pending=new Map(), exceptions=[];
const command=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
async function evaluate(expression) { const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}); if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value; }
async function until(expression,label) { const end=Date.now()+45000;while(Date.now()<end){if(await evaluate(expression))return;await delay(150);}throw new Error('Timed out '+label+' '+await evaluate('document.body.innerText.slice(-2000)')); }
async function idle() { await until("document.querySelector('.agents-results')?.getAttribute('aria-busy')==='false'",'agents idle'); }
async function navigate(width,locale='en',query='') {
 await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});
 await command('Emulation.setUserAgentOverride',{userAgent:width<500?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1':'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36'});
 await command('Page.navigate',{url:`http://localhost:3000${locale==='en'?'':'/'+locale}/agent${query}`});
 await until("document.readyState==='complete' && !!document.querySelector('.agents-results')",'directory loaded');
 await idle();
}
async function setSearch(value) {
 await evaluate(`(()=>{const e=document.querySelector('.agents-search input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await delay(100);
 await evaluate("document.querySelector('.agents-search').requestSubmit()");
 await delay(400);await idle();
}
async function screenshot(name) {
 await evaluate("document.querySelector('.agent-list-page').scrollIntoView({block:'start'});scrollBy(0,-110)");await delay(250);
 const clip=await evaluate("(()=>{const r=document.querySelector('.agent-list-page').getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1};})()");
 const result=await command('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});
 fs.mkdirSync('docs/screenshots',{recursive:true});fs.writeFileSync(`docs/screenshots/${name}.png`,Buffer.from(result.data,'base64'));
}
(async()=>{
 try {
  const active=path.join(profile,'DevToolsActivePort');for(let n=0;n<100&&!fs.existsSync(active);n++)await delay(100);
  const port=fs.readFileSync(active,'utf8').split('\n')[0];const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(resolve=>socket.once('open',resolve));
  socket.on('message',raw=>{const m=JSON.parse(raw);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails);});
  await command('Runtime.enable');await command('Page.enable');await command('Network.enable');await command('Network.setExtraHTTPHeaders',{headers:{Connection:'close'}});
  const res=await fetch('http://localhost:3007/graphql',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'query($input:AgentsInquiry!){getAgents(input:$input){list{_id memberNick memberRank}metaCounter{total}}}',variables:{input:{page:1,limit:8,sort:'memberRank',direction:'DESC',search:{}}}})});
  const real=await res.json();assert.ok(!real.errors,JSON.stringify(real.errors));const ids=real.data.getAgents.list.map(a=>a._id);
  for(const width of [1440,1024,768,390,320]) {
   console.log('Checking agents at',width);
   await navigate(width);assert.equal(await evaluate("document.querySelectorAll('.agents-profile-card').length"),ids.length);
   assert.ok(await evaluate("[...document.querySelectorAll('.agents-profile-card,.agents-toolbar,.agents-container')].every(e=>{const r=e.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1})"),'bounds '+width);
   assert.ok(await evaluate("getComputedStyle(document.querySelector('.agent-list-page')).fontFamily.includes('Poppins')"));
   assert.ok(await evaluate("document.querySelector('.agents-search').getBoundingClientRect().width>150"),'usable search width '+width);
   assert.equal(await evaluate("(()=>{const cards=[...document.querySelectorAll('.agents-profile-card')];return cards.filter(c=>Math.abs(c.getBoundingClientRect().top-cards[0].getBoundingClientRect().top)<2).length})()"),width>1100?4:width>800?3:width>480?2:1);
   assert.deepEqual(await evaluate("[...document.querySelectorAll('.agents-profile-link')].map(e=>new URL(e.href).searchParams.get('agentId'))"),ids);
   await until("[...document.querySelectorAll('.agents-photo img')].filter(i=>i.getBoundingClientRect().top<innerHeight).every(i=>i.complete&&i.naturalWidth>0)",'loaded photos');
   if(width===1440||width===390)await screenshot('agents-directory-'+width);
   await evaluate("document.querySelectorAll('.agents-view button')[1].click()");
   assert.ok(await evaluate("document.querySelector('.agents-results').classList.contains('agents-list')"));
   assert.ok(await evaluate("[...document.querySelectorAll('.agents-profile-card')].every(e=>{const r=e.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1})"),'list bounds '+width);
  }
  await navigate(1440);
  await setSearch(real.data.getAgents.list[0].memberNick);
  assert.equal(await evaluate("document.querySelectorAll('.agents-profile-card').length"),1);
  assert.equal(await evaluate("JSON.parse(new URLSearchParams(location.search).get('input')).page"),1);
  await setSearch('no-agent-[.*]-match');assert.ok(await evaluate("!!document.querySelector('.agents-empty')"));
  await evaluate("document.querySelector('.agents-all').click()");await delay(400);await idle();
  await evaluate("document.querySelector('.agents-sort .MuiSelect-select').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}))");await until("!!document.querySelector('[role=option]')",'sort menu');
  await evaluate("[...document.querySelectorAll('[role=option]')].find(e=>e.getAttribute('data-value')==='memberLikes').click()");await delay(400);await idle();
  assert.equal(await evaluate("JSON.parse(new URLSearchParams(location.search).get('input')).sort"),'memberLikes');
  await evaluate("document.querySelector('.agents-pagination button[aria-label=\"Go to page 2\"]').click()");await delay(400);await idle();
  assert.equal(await evaluate("JSON.parse(new URLSearchParams(location.search).get('input')).page"),2);
  await command('Page.reload');await delay(700);await idle();assert.equal(await evaluate("document.querySelector('.agents-pagination .Mui-selected').textContent"),'2');
  await navigate(1440,'en','?input=invalid-json');assert.equal(await evaluate("document.querySelectorAll('.agents-profile-card').length"),ids.length);
  await evaluate("document.querySelector('.agents-like').click()");await until("!!document.querySelector('.swal2-popup')",'guest like warning');
  await evaluate("document.querySelector('.swal2-confirm')?.click()");
  for(const locale of ['kr','ru']) {await navigate(390,locale);console.log('Locale',locale,await evaluate("({label:document.querySelector('.agents-profile-link').textContent,locale:JSON.parse(document.getElementById('__NEXT_DATA__').textContent).locale,translations:Object.fromEntries(Object.entries(JSON.parse(document.getElementById('__NEXT_DATA__').textContent).props.pageProps._nextI18Next.initialI18nStore).map(([locale,store])=>[locale,store.common['View Profile']]))})"));await until("document.querySelector('.agents-profile-link')?.textContent!=='View Profile'",'localized profile');}
  await command('Network.setBlockedURLs',{urls:['*localhost:3007/graphql*']});
  await command('Page.reload');await until("!!document.querySelector('.agents-results .MuiAlert-root')",'failed backend state');
  await command('Network.setBlockedURLs',{urls:[]});
  await evaluate("document.querySelector('.agents-results .MuiAlert-root button').click()");await delay(400);await idle();
  assert.equal(await evaluate("document.querySelectorAll('.agents-profile-card').length"),ids.length);
  assert.deepEqual(exceptions,[]);console.log('PASS: real agent IDs/order/count, 4/3/2/1 responsive grid, list views, photos, literal nickname search, empty/reset, sorting, pagination/reload, malformed URL, guest like and KR/RU; no runtime exceptions.');
 } finally {if(socket)socket.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});


