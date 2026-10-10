// Read-only real-inventory browser checks in a separate temporary Chrome profile.
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'anorcar-browse-qa-'));
const chrome = spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket, id = 0;
let requestMode = '';
const heldRequests = [];
const networkRequests = new Map();
const pending = new Map(), exceptions = [];
const command = (method, params = {}) => new Promise((resolve, reject) => { const request = ++id; pending.set(request, { resolve, reject }); socket.send(JSON.stringify({ id: request, method, params })); });
async function intercepted(method, params) {
 try { await command(method, params); }
 catch (error) { if (!error.message.includes('Invalid InterceptionId')) throw error; }
}
async function evaluate(expression) {
 const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
 if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
 return result.result.value;
}
async function until(expression, label) {
 const end = Date.now() + 90000;
 while (Date.now() < end) { if (await evaluate(expression)) return; await delay(150); }
 const state=await evaluate("({url:location.href,busy:document.querySelector('.cars-results')?.getAttribute('aria-busy'),selects:[...document.querySelectorAll('.cars-browse-filter .MuiSelect-select')].map(el=>({text:el.textContent,disabled:el.classList.contains('Mui-disabled')})),alerts:[...document.querySelectorAll('#car-list-page .MuiAlert-root,.cars-filter-drawer .MuiAlert-root')].map(el=>el.textContent)})");
 throw new Error('Timed out: ' + label + ' ' + JSON.stringify(state) + ' requests=' + JSON.stringify([...networkRequests.values()].slice(-8)));
}
async function setField(selector,value) {
 await evaluate(`(() => {const input=document.querySelector(${JSON.stringify(selector)}); if(!input) throw new Error('Missing input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)}); input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await delay(100);
}
async function idle() { await until("document.querySelector('.cars-results')?.getAttribute('aria-busy')==='false'",'idle results'); }
async function screenshot(name) {
 await evaluate("document.querySelector('#car-list-page').scrollIntoView({block:'start'})");
 await evaluate('scrollBy(0,-100)');
 await delay(250);
 const clip = await evaluate("(() => { const r=document.querySelector('#car-list-page').getBoundingClientRect(); return {x:Math.max(0,r.left+scrollX),y:r.top+scrollY,width:r.width,height:r.height,scale:1}; })()");
 const result = await command('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });
 fs.mkdirSync('docs/screenshots', { recursive: true });
 fs.writeFileSync(`docs/screenshots/${name}.png`, Buffer.from(result.data, 'base64'));
}
async function navigate(width, locale='en', query='') {
 await command('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 500 });
 await command('Emulation.setUserAgentOverride', { userAgent: width < 500 ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' : 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36' });
 await command('Page.navigate', { url: `http://localhost:3000${locale === 'en' ? '' : '/' + locale}/car${query}` });
 await delay(1200);
 await until("document.readyState==='complete'", 'document loaded');
 await until("!!document.querySelector('.cars-listing-card:not(.cars-card-skeleton)') && document.querySelector('.cars-results').getAttribute('aria-busy')==='false'", 'live listings');
 await until("[...document.querySelectorAll('.cars-listing-photo img')].every(img=>img.complete && img.naturalWidth>0)", 'photos');
}
(async () => {
 try {
  const active = path.join(profile, 'DevToolsActivePort');
  for(let n=0; n<100 && !fs.existsSync(active); n++) await delay(100);
  const port=fs.readFileSync(active,'utf8').split('\n')[0];
  const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket=new WebSocket(targets.find(target=>target.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>socket.once('open',resolve));
  socket.on('message',raw=>{ const msg=JSON.parse(raw); if(msg.id){ const request=pending.get(msg.id); pending.delete(msg.id); if(msg.error) request.reject(new Error(JSON.stringify(msg.error))); else request.resolve(msg.result); } if(msg.method==='Runtime.exceptionThrown') exceptions.push(msg.params.exceptionDetails);
   if(msg.method==='Network.requestWillBeSent' && msg.params.request.url.includes('localhost:3007/graphql') && msg.params.request.postData) {
    try { const body=JSON.parse(msg.params.request.postData); if(/getCars\s*\(/.test(body.query ?? '')) networkRequests.set(msg.params.requestId,{input:body.variables?.input,state:'sent'}); } catch {}
   }
   if(msg.method==='Network.responseReceived' && networkRequests.has(msg.params.requestId)) networkRequests.get(msg.params.requestId).state='response '+msg.params.response.status;
   if(msg.method==='Network.loadingFinished' && networkRequests.has(msg.params.requestId)) networkRequests.get(msg.params.requestId).state='finished';
   if(msg.method==='Network.loadingFailed' && networkRequests.has(msg.params.requestId)) networkRequests.get(msg.params.requestId).state='failed '+msg.params.errorText;
   if(msg.method==='Fetch.requestPaused') {
    const {requestId,request}=msg.params;
    const isCars=/getCars\s*\(/.test(request.postData ?? '');
    if(isCars && requestMode==='delay') heldRequests.push(requestId);
    else if(isCars && requestMode==='error') void intercepted('Fetch.fulfillRequest',{requestId,responseCode:503,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'*'}],body:Buffer.from(JSON.stringify({errors:[{message:'Browser-only simulated outage'}]})).toString('base64')}).catch(error=>exceptions.push({exception:{description:error.message}}));
    else void intercepted('Fetch.continueRequest',{requestId}).catch(error=>exceptions.push({exception:{description:error.message}}));
   }
  });
  await command('Runtime.enable'); await command('Page.enable'); await command('Network.enable');
  // Avoid stale localhost keep-alive sockets during repeated full-document navigations.
  await command('Network.setExtraHTTPHeaders',{headers:{Connection:'close'}});

  await navigate(1440);
  assert.ok(await evaluate("[...document.querySelectorAll('.cars-browse-filter label')].some(e=>e.textContent==='Automatic')"));
  assert.ok(await evaluate("[...document.querySelectorAll('.cars-browse-filter label')].some(e=>e.textContent==='Daejeon')"));
  await evaluate("[...document.querySelectorAll('.cars-browse-filter label')].filter(e=>['Automatic','Daejeon'].includes(e.textContent)).forEach(e=>e.querySelector('input').click())");
  await evaluate("document.querySelector('.cars-browse-filter button[type=submit]').click()");
  await until("JSON.parse(new URLSearchParams(location.search).get('input'))?.search.transmissions?.[0]==='AUTOMATIC' && document.querySelector('.cars-results').getAttribute('aria-busy')==='false'",'canonical filters');
  assert.equal(await evaluate("JSON.parse(new URLSearchParams(location.search).get('input')).search.locations[0]"),'DAEJEON');
  assert.equal(await evaluate("document.querySelectorAll('.cars-listing-card').length"),2);
  const old='?input='+encodeURIComponent(JSON.stringify({page:1,limit:9,sort:'createdAt',direction:'DESC',search:{transmissions:['AVTOMATIC'],locations:['DAEJON']}}));
  await navigate(1440,'en',old);
  assert.equal(await evaluate("document.querySelectorAll('.cars-listing-card').length"),2);
  assert.ok([...networkRequests.values()].some(request=>request.input?.search.transmissions?.[0]==='AUTOMATIC' && request.input?.search.locations?.[0]==='DAEJEON'));
  await screenshot('car-enum-corrected-filters');
  for(const locale of ['kr','ru']) {
   await navigate(390,locale);
   await evaluate("document.querySelector('.cars-filter-trigger').click()");
   await until("!!document.querySelector('.cars-filter-drawer [role=dialog]')",'mobile filters');
   const labels=JSON.parse(fs.readFileSync('public/locales/'+locale+'/common.json','utf8'));
   await until("[...document.querySelectorAll('.cars-filter-drawer label')].some(e=>e.textContent==="+JSON.stringify(labels.Daejeon)+")",'localized Daejeon '+locale);
   assert.ok(await evaluate("[...document.querySelectorAll('.cars-filter-drawer label')].some(e=>e.textContent==="+JSON.stringify(labels.Automatic)+")"));
  }
  assert.equal(exceptions.length,0,JSON.stringify(exceptions));
  console.log('PASS: Automatic/Daejeon filter labels, exact AUTOMATIC/DAEJEON search serialization and real two-car result, preserved old bookmark filters, KR/RU mobile labels and no runtime exceptions.');
 } finally { if(socket)socket.close();chrome.kill(); }
})().catch(error=>{console.error(error);process.exitCode=1});
