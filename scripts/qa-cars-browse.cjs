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
  for(const width of [1440, 1024, 768, 390, 320]) {
   await navigate(width);
   assert.ok(await evaluate("getComputedStyle(document.querySelector('.car-browse-toolbar h1')).fontFamily.includes('Poppins')"));
   assert.equal(await evaluate('innerWidth'),width);
   assert.ok(await evaluate("[...document.querySelectorAll('#car-list-page .cars-listing-card, #car-list-page .filter-config, #car-list-page .main-config')].every(el=>{const r=el.getBoundingClientRect();return r.left>=-1 && r.right<=innerWidth+1})"), `viewport bounds ${width}`);
   assert.ok(await evaluate("(() => {const cards=[...document.querySelectorAll('.cars-listing-card')]; return Math.max(...cards.map(c=>c.getBoundingClientRect().height))-Math.min(...cards.map(c=>c.getBoundingClientRect().height))<2})()"), `equal grid heights ${width}`);
   if(width<=800) {
    assert.ok(await evaluate("document.querySelector('.cars-filter-trigger').getAttribute('aria-expanded')==='false' && getComputedStyle(document.querySelector('.cars-filter-drawer')).visibility==='hidden'"), 'drawer initially closed');
    await evaluate("document.querySelector('.cars-filter-trigger').focus(); document.querySelector('.cars-filter-trigger').click()");
    await until("!!document.querySelector('.cars-filter-drawer [role=dialog]') && getComputedStyle(document.querySelector('.cars-filter-drawer')).visibility!=='hidden'", 'drawer open');
    assert.ok(await evaluate("document.querySelector('.cars-filter-drawer').contains(document.activeElement)"), 'drawer focus contained');
    await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});
    await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});
    await until("document.querySelector('.cars-filter-trigger').getAttribute('aria-expanded')==='false'", 'drawer Escape');
    await delay(350);
    assert.ok(await evaluate("document.activeElement===document.querySelector('.cars-filter-trigger')"), 'drawer focus returns');
   }
   const columns=await evaluate("document.querySelectorAll('.cars-listing-card').length > 1 ? (()=>{ const cards=[...document.querySelectorAll('.cars-listing-card')]; const top=cards[0].getBoundingClientRect().top; return cards.filter(c=>Math.abs(c.getBoundingClientRect().top-top)<2).length; })() : 1");
   assert.equal(columns,width>=1200?3:width>480?2:1, `columns at ${width}px`);
   assert.ok(await evaluate("[...document.querySelectorAll('.cars-listing-price')].every(el=>el.textContent.startsWith('$'))"));
   if(width===1440 || width===390) await screenshot(`cars-browse-${width===1440?'desktop':'mobile'}`);
  }
  console.log('Responsive cards and drawer accessibility passed.');
  await navigate(1440);
  await evaluate("document.querySelector('.cars-sort-controls button[aria-label=\"List view\"]').click()");
  await until("!!document.querySelector('.cars-results-list')", 'list mode');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.cars-results')).gridTemplateColumns.split(' ').length"),1);
  await screenshot('cars-browse-list');
  await setField('.cars-browse-filter input[aria-label="Search cars"]','retained keyword');
  await evaluate("document.querySelector('.cars-brand-strip button:nth-child(2)').click()");
  await until("new URLSearchParams(location.search).has('input') && document.querySelector('.cars-results').getAttribute('aria-busy')==='false'", 'brand filter');
  assert.equal(await evaluate("JSON.parse(new URLSearchParams(location.search).get('input'))?.search.brandIds.length"),1);
  assert.equal(await evaluate("document.querySelector('.cars-browse-filter input[aria-label=\"Search cars\"]').value"),'retained keyword','brand chip preserves keyword draft');
  await until("!document.querySelectorAll('.cars-browse-filter .MuiSelect-select')[1].classList.contains('Mui-disabled')", 'models loaded');
  await evaluate("document.querySelectorAll('.cars-browse-filter .MuiSelect-select')[1].dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}))");
  await until("!!document.querySelector('[role=option][data-value]:not([data-value=\"\"])')", 'real model choices');
  const model=await evaluate("document.querySelector('[role=option][data-value]:not([data-value=\"\"])').getAttribute('data-value')");
  await evaluate("document.querySelector('[role=option][data-value]:not([data-value=\"\"])').click()");
  await until(`document.querySelectorAll('.cars-browse-filter .MuiSelect-select')[1].textContent===${JSON.stringify(model)}`, 'selected model');
  await evaluate("document.querySelector('.cars-browse-filter button[type=submit]').click()");
  await until(`JSON.parse(new URLSearchParams(location.search).get('input'))?.search.text===${JSON.stringify(model)}`, 'model search');
  await evaluate("document.querySelector('.cars-browse-filter button[data-action=reset]').click()");
  await until("JSON.stringify(JSON.parse(new URLSearchParams(location.search).get('input'))?.search)==='{}'", 'reset');
  await until("document.querySelector('.cars-browse-filter input[aria-label=\"Search cars\"]').value==='' && document.querySelector('.cars-results').getAttribute('aria-busy')==='false'", 'reset form');
  await evaluate("document.querySelector('.cars-browse-filter input[type=checkbox]').click(); document.querySelector('.cars-browse-filter button[type=submit]').click()");
  await until("JSON.parse(new URLSearchParams(location.search).get('input'))?.search.locations?.length===1", 'location filter');
  const query='?input='+encodeURIComponent(JSON.stringify({page:1,limit:1,sort:'carPrice',direction:'ASC',search:{}}));
  await navigate(1440,'en',query);
  if(await evaluate("!!document.querySelector('.MuiPagination-root button[aria-label=\"Go to next page\"]:not(:disabled)')")) {
   await evaluate('scrollTo(0,document.body.scrollHeight)');
   await evaluate("document.querySelector('.MuiPagination-root button[aria-label=\"Go to next page\"]').click()");
   await until("JSON.parse(new URLSearchParams(location.search).get('input'))?.page===2 && document.querySelector('.cars-results').getAttribute('aria-busy')==='false'", 'server pagination');
   await delay(650);
   assert.ok(await evaluate("document.querySelector('#cars-listing-heading').getBoundingClientRect().top>0 && document.querySelector('#cars-listing-heading').getBoundingClientRect().top<innerHeight/2"),'pagination scroll clearance');
   await evaluate('history.back()');
   await until("JSON.parse(new URLSearchParams(location.search).get('input'))?.page===1",'Back restores page'); await idle();
   await evaluate('history.forward()');
   await until("JSON.parse(new URLSearchParams(location.search).get('input'))?.page===2",'Forward restores page'); await idle();
  }
  await navigate(1440);
  // Use data from actual controls, without depending on generated MUI IDs.
  await evaluate("document.querySelectorAll('.cars-browse-filter input[inputmode=numeric]').forEach((el,index)=>el.dataset.qaRange=String(index))");
  await setField('[data-qa-range="0"]','2020'); await setField('[data-qa-range="1"]','2024');
  await setField('[data-qa-range="0"]','');
  assert.equal(await evaluate("document.querySelector('[data-qa-range=\"1\"]').value"),'2024','clearing minimum keeps maximum');
  await setField('[data-qa-range="0"]','999999');
  assert.ok(await evaluate("document.querySelector('.cars-browse-filter button[type=submit]').disabled && !!document.querySelector('.cars-field-error')"),'invalid range feedback');
  await setField('[data-qa-range="0"]',''); await setField('[data-qa-range="1"]','');
  await setField('[data-qa-range="3"]','50000');
  assert.equal(await evaluate("document.querySelector('[data-qa-range=\"2\"]').value"),'','no artificial minimum in UI');
  await evaluate("document.querySelector('.cars-browse-filter button[type=submit]').click()");
  await until("JSON.parse(new URLSearchParams(location.search).get('input'))?.search.pricesRange?.end===50000",'max-only price apply'); await idle();
  assert.deepEqual(await evaluate("JSON.parse(new URLSearchParams(location.search).get('input'))?.search.pricesRange"),{start:0,end:50000});
  await command('Page.reload'); await delay(1200); await idle();
  assert.equal(await evaluate("document.querySelectorAll('.cars-browse-filter input[inputmode=numeric]')[3].value"),'50000','refresh restores maximum');
  assert.equal(await evaluate("document.querySelectorAll('.cars-browse-filter input[inputmode=numeric]')[2].value"),'','refresh keeps open minimum blank');
  await setField('.cars-browse-filter input[aria-label="Search cars"]','unapplied keyword');
  await evaluate("document.querySelector('.cars-sort-controls .MuiSelect-select').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}))");
  await until("!!document.querySelector('[role=option][data-value=\"carPrice:ASC\"]')",'sorting options');
  await evaluate("document.querySelector('[role=option][data-value=\"carPrice:ASC\"]').click()");
  await until("JSON.parse(new URLSearchParams(location.search).get('input'))?.sort==='carPrice'",'sorting URL'); await idle();
  assert.equal(await evaluate("document.querySelector('.cars-browse-filter input[aria-label=\"Search cars\"]').value"),'unapplied keyword','sorting preserves draft');
  assert.equal(await evaluate("JSON.parse(new URLSearchParams(location.search).get('input'))?.search.pricesRange.end"),50000);
  await setField('.cars-browse-filter input[aria-label="Search cars"]','no-match-anorcar-[refinement]+');
  await evaluate("document.querySelector('.cars-browse-filter button[type=submit]').click()");
  await until("!!document.querySelector('.cars-empty-state')",'real empty state');
  assert.equal(await evaluate("JSON.parse(new URLSearchParams(location.search).get('input'))?.search.text"),'no-match-anorcar-\\[refinement\\]\\+');
  await evaluate("document.querySelector('.cars-empty-state button').click()");
  await until("JSON.stringify(JSON.parse(new URLSearchParams(location.search).get('input'))?.search)==='{}'",'Clear Filters'); await idle();
  assert.equal(await evaluate("JSON.parse(new URLSearchParams(location.search).get('input'))?.sort"),'carPrice','Clear Filters keeps sort');
  const emptyBrand={page:1,limit:9,sort:'createdAt',direction:'DESC',search:{brandIds:['000000000000000000000000']}};
  await command('Page.navigate',{url:'http://localhost:3000/car?input='+encodeURIComponent(JSON.stringify(emptyBrand))});
  await delay(1200); await until("!!document.querySelector('.cars-empty-state')",'unavailable URL brand');
  await setField('.cars-browse-filter input[aria-label="Search cars"]','unapplied empty-state draft');
  await evaluate("document.querySelector('.cars-empty-state button').click()"); await idle();
  assert.equal(await evaluate("document.querySelector('.cars-browse-filter input[aria-label=\"Search cars\"]').value"),'','Clear Filters clears drafts as well');
  await command('Fetch.enable',{patterns:[{urlPattern:'*localhost:3007/graphql*',requestStage:'Request'}]});
  requestMode='delay';
  await command('Page.navigate',{url:'http://localhost:3000/car'});
  await until("document.querySelectorAll('.cars-card-skeleton').length>0 && document.querySelector('.cars-results').getAttribute('aria-busy')==='true'",'initial skeletons');
  await until("!!document.querySelector('.cars-card-skeleton')",'loading layout');
  requestMode='';
  while(heldRequests.length) await intercepted('Fetch.continueRequest',{requestId:heldRequests.shift()});
  await until("!!document.querySelector('.cars-listing-card:not(.cars-card-skeleton)')",'loading completes'); await idle();
  requestMode='error'; await command('Page.navigate',{url:'http://localhost:3000/car'});
  await until("!!document.querySelector('#car-list-page .MuiAlert-standardError')",'retryable outage state');
  requestMode=''; await evaluate("document.querySelector('#car-list-page .MuiAlert-standardError button').click()");
  await until("!!document.querySelector('.cars-listing-card:not(.cars-card-skeleton)') && !document.querySelector('#car-list-page .MuiAlert-standardError')",'retry recovers'); await idle();
  await command('Fetch.disable');
  await navigate(390);
  await evaluate("document.querySelector('.cars-filter-trigger').click()");
  await until("getComputedStyle(document.querySelector('.cars-filter-drawer')).visibility!=='hidden'",'mobile filters');
  await setField('.cars-filter-drawer input[aria-label="Search cars"]','mobile draft');
  await evaluate("document.querySelector('.cars-filter-drawer button[aria-label=\"Close filters\"]').click()");
  await delay(350); await evaluate("document.querySelector('.cars-filter-trigger').click()");
  await until("getComputedStyle(document.querySelector('.cars-filter-drawer')).visibility!=='hidden'",'reopened drawer');
  assert.equal(await evaluate("document.querySelector('.cars-filter-drawer input[aria-label=\"Search cars\"]').value"),'mobile draft','close preserves draft');
  await setField('.cars-filter-drawer input[aria-label="Search cars"]','');
  await evaluate("document.querySelector('.cars-filter-drawer input[type=checkbox]').click()"); await delay(100);
  await evaluate("document.querySelector('.cars-filter-drawer button[type=submit]').click()");
  await until("document.querySelector('.cars-filter-trigger').getAttribute('aria-expanded')==='false' && JSON.parse(new URLSearchParams(location.search).get('input'))?.search.locations?.length===1",'drawer applies and closes'); await idle();
  for(const locale of ['kr','ru']) {
   await navigate(1440,locale);
   const labels=JSON.parse(fs.readFileSync(`public/locales/${locale}/common.json`,'utf8'));
   assert.equal(await evaluate("document.querySelector('.car-browse-toolbar h1').textContent"),labels['Cars for Sale']);
  }
  assert.equal(exceptions.length,0,exceptions[0]?.exception?.description?.slice(0,300));
  console.log('Cars refinement QA passed: real inventory, responsive bounds/equal heights, Poppins/USD, grid/list, model/location filters, independent bounds, validation, draft retention, refresh/Back/Forward, pagination scroll, literal/empty/Clear Filters, delayed loading, simulated outage/retry, drawer focus/Escape/drafts/apply and EN/KR/RU.');
 } finally { if(socket) socket.close(); chrome.kill(); }
})().catch(error=>{ console.error(error); process.exitCode=1; });
