// Real frontend with isolated overview counts. No mutations or video streaming.
const assert = require('assert/strict');
const fs = require('fs'), os = require('os'), path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const imageFile=fs.readFileSync('public/img/carimg21.png');
const sourceDimensions={width:imageFile.readUInt32BE(16),height:imageFile.readUInt32BE(20)};
const base = process.env.QA_BASE_URL || 'http://localhost:3000';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'anorcar-showcase-'));
const chrome = spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket, sequence = 0;
const pending = new Map(), exceptions = [];
const command = (method, params = {}) => new Promise((resolve,reject) => { const id=++sequence; pending.set(id,{resolve,reject}); socket.send(JSON.stringify({id,method,params})); });
async function evaluate(expression) { const result=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value; }
async function until(expression,label) { for(let i=0;i<200;i++){if(await evaluate(`Boolean(${expression})`))return;await delay(150);}throw Error('Timeout: '+label+' '+JSON.stringify(await evaluate("({counts:document.querySelector('.seller-showcase-metrics')?.innerText,calls:window.__overviewCalls,top:document.querySelector('.seller-showcase')?.getBoundingClientRect().top,errors:document.querySelector('.seller-showcase-metrics-error')?.textContent,image:(()=>{const i=document.querySelector('.seller-showcase-media img');return{src:i?.currentSrc,complete:i?.complete,width:i?.naturalWidth,rect:i?.getBoundingClientRect().toJSON()}})()})"))); }
const fixture=`(()=>{const nativeFetch=fetch.bind(window);window.__overviewMode='success';window.__overviewCalls=0;window.fetch=async(resource,options)=>{
 const url=typeof resource==='string'?resource:resource.url;
 if(url?.includes('/graphql')&&options?.body){const request=JSON.parse(options.body);if(request.query.trim().startsWith('mutation'))throw Error('No mutations allowed');
 if(request.operationName==='GetMarketplaceOverview'){window.__overviewCalls++;if(window.__overviewMode==='error')throw TypeError('Fixture offline');const empty=window.__overviewMode==='empty';return new Response(JSON.stringify({data:{getCars:{__typename:'Cars',metaCounter:empty?[]:[{__typename:'TotalCounter',total:53}]},getAgents:{__typename:'Members',metaCounter:empty?[]:[{__typename:'TotalCounter',total:4}]},getBrands:empty?[]:[{__typename:'Brand',_id:'one'}]}}),{headers:{'Content-Type':'application/json'}});}}
 return nativeFetch(resource,options);};})();`;
async function click(selector){assert.ok(await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)return false;e.click();return true;})()`),selector);}
async function navigate(width,locale='en'){
 await command('Emulation.setDeviceMetricsOverride',{width,height:Number(process.env.QA_HEIGHT || 1000),deviceScaleFactor:1,mobile:width<600});
 await command('Network.setUserAgentOverride',{userAgent:width<600?'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'});
 await command('Page.navigate',{url:base+(locale==='en'?'/':'/'+locale)});
 await until(width<600?"document.querySelector('#mobile-wrap')":"document.querySelector('#pc-wrap')",'device layout');
 await until("document.querySelector('.seller-showcase')",'showcase');
 await evaluate("document.querySelector('.seller-showcase').scrollIntoView({block:'start'})");
 await until("(()=>{document.querySelector('.seller-showcase').scrollIntoView({block:'start'});window.scrollBy(0,-110);return document.querySelector('.seller-showcase-metrics dd').textContent==='53'})()",'overview counts');
 await until("document.querySelector('.seller-showcase-media img').complete && document.querySelector('.seller-showcase-media img').naturalWidth>0",'supplied image');
}
async function shot(name){
 // Isolate the requested sections in exported previews; shared launchers stay unchanged in the app and other checks.
 await evaluate("(()=>{const s=document.createElement('style');s.id='qa-showcase-preview';s.textContent='.support-launchers{visibility:hidden!important}';document.head.appendChild(s)})()");
 try {await delay(250);const clip=await evaluate("(()=>{const r=document.querySelector('.seller-showcase').getBoundingClientRect();return{x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1}})()");const result=await command('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});fs.mkdirSync('docs/screenshots',{recursive:true});fs.writeFileSync('docs/screenshots/'+name+'.png',Buffer.from(result.data,'base64'));}
 finally {await evaluate("document.getElementById('qa-showcase-preview')?.remove()");}
}

(async()=>{try{
 const active=path.join(profile,'DevToolsActivePort');for(let i=0;i<100&&!fs.existsSync(active);i++)await delay(100);
 const port=fs.readFileSync(active,'utf8').split('\n')[0];const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();socket=new WebSocket(targets.find(target=>target.type==='page').webSocketDebuggerUrl);await new Promise(resolve=>socket.once('open',resolve));
 socket.on('message',raw=>{const value=JSON.parse(raw);if(value.id){const handler=pending.get(value.id);pending.delete(value.id);value.error?handler.reject(Error(JSON.stringify(value.error))):handler.resolve(value.result);}if(value.method==='Runtime.exceptionThrown')exceptions.push(value.params.exceptionDetails);});
 await command('Runtime.enable');await command('Page.enable');await command('Network.enable');await command('Network.setBlockedURLs',{urls:['*youtube-nocookie.com*','*googlevideo.com*']});await command('Page.addScriptToEvaluateOnNewDocument',{source:fixture});
 for(const width of (process.env.QA_WIDTHS || '3440,2560,1920,1440,1280,1024,768,390,375,320').split(',').map(Number)){
  await navigate(width);
  assert.ok(await evaluate("(()=>{const e=document.querySelector('.seller-showcase');return !!(e.previousElementSibling?.classList.contains('top-agents') && e.nextElementSibling?.classList.contains('recently-added-cars'))})()"),'section order');
  assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),'page overflow '+width);
  assert.ok(await evaluate("getComputedStyle(document.querySelector('#seller-showcase-heading')).fontFamily.includes('Poppins')"));
  assert.equal(await evaluate("document.querySelectorAll('.seller-showcase-benefit-grid article').length"),4);
  assert.equal(await evaluate("document.querySelectorAll('.seller-showcase-video-dialog iframe').length"),0);
  assert.ok(await evaluate("document.querySelector('.seller-showcase-copy a').getAttribute('href')==='/car'"));
  assert.equal(await evaluate("document.querySelectorAll('.seller-showcase-play').length"),1);
  assert.equal(await evaluate("document.querySelectorAll('.seller-showcase-video-label').length"),0);
  assert.equal(await evaluate("document.querySelectorAll('.seller-showcase-copy li').length"),3);
  const layout=await evaluate("(()=>{const media=document.querySelector('.seller-showcase-media'),copy=document.querySelector('.seller-showcase-copy'),split=document.querySelector('.seller-showcase-split');const r=split.getBoundingClientRect(),prev=document.querySelector('.top-agents');return {width:r.width,left:r.left,topAligned:Math.abs(media.getBoundingClientRect().top-copy.getBoundingClientRect().top)<=1,sideGap:copy.getBoundingClientRect().left-media.getBoundingClientRect().right,gap:r.top-prev.getBoundingClientRect().bottom,minAgentHeight:getComputedStyle(prev).minHeight,mediaWidth:media.offsetWidth,media:media.offsetHeight,copy:copy.offsetHeight,split:split.offsetHeight,position:getComputedStyle(media.querySelector('img')).objectPosition}})()");
  const viewport=await evaluate('document.documentElement.clientWidth');
  const gutter=width>1200?24:width>600?20:14;
  assert.ok(Math.abs(layout.left-gutter)<=1,'small card side gutter');assert.ok(Math.abs(layout.left-(viewport-layout.left-layout.width))<=1,'balanced horizontal spacing');assert.ok(Math.abs(layout.width-(viewport-gutter*2))<=1,'near-full-width card');
  const expectedGap=width>1200?32:width>600?24:16;assert.ok(Math.abs(layout.gap-expectedGap)<=1,'small intentional gap after agents');assert.equal(layout.minAgentHeight,'0px');
  assert.ok(await evaluate("(()=>{const frames=Array.from(document.querySelectorAll('.seller-showcase-container:not(.seller-showcase-split)')).map(e=>e.getBoundingClientRect());return frames.every(r=>Math.abs(r.left-frames[0].left)<=1&&Math.abs(r.right-frames[0].right)<=1)})()"),'metrics and benefits keep reading-column alignment');
  if(width>1200){assert.ok(layout.topAligned,'panel tops match');assert.ok(Math.abs(layout.sideGap)<=1,'no horizontal panel gap');assert.equal(layout.media,layout.copy,'equal panel heights');assert.ok(Math.abs(layout.mediaWidth-(layout.width-2)*.6)<=2,'wider image panel');}
  else assert.ok(await evaluate("(()=>{const media=document.querySelector('.seller-showcase-media').getBoundingClientRect(),copy=document.querySelector('.seller-showcase-copy').getBoundingClientRect();return Math.abs(copy.top-media.bottom)<=1})()"),'stacked panels touch without overlap');
  if(process.env.QA_DIAG)console.log('LAYOUT',width,await evaluate(`(()=>{const selectors=['#top','.navbar-main','#main','.home-page','.top-agents','.top-agents .wrapper','.seller-showcase','.seller-showcase-split','.seller-showcase-media','.seller-showcase-copy'];return selectors.map(s=>{const e=document.querySelector(s);if(!e)return{s};const r=e.getBoundingClientRect(),c=getComputedStyle(e);return{s,rect:r.toJSON(),padding:c.padding,margin:c.margin,height:c.height,position:c.position,overflow:c.overflow,transform:c.transform}})})()`));
  assert.equal(layout.position,'50% 50%');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.seller-showcase-media img')).objectFit"),'contain');
  const composition=await evaluate(`(()=>{
   const image=document.querySelector('.seller-showcase-media img'),media=image.getBoundingClientRect(),button=document.querySelector('.seller-showcase-play').getBoundingClientRect();
   const sourceWidth=${sourceDimensions.width},sourceHeight=${sourceDimensions.height};
   const scale=Math.min(media.width/sourceWidth,media.height/sourceHeight),offsetX=(media.width-sourceWidth*scale)*.5,offsetY=(media.height-sourceHeight*scale)*.5;
   // Conservative vehicle bounds in the unchanged 1756x896 source, inspected visually.
   const vehicle={left:offsetX+710*scale,top:offsetY+660*scale,right:offsetX+1040*scale,bottom:offsetY+810*scale};
   const grid=getComputedStyle(document.querySelector('.seller-showcase-benefit-grid'));
   return {vehicle,media:{width:media.width,height:media.height},source:{width:sourceWidth,height:sourceHeight},play:{left:button.left-media.left,top:button.top-media.top,right:button.right-media.left,bottom:button.bottom-media.top,width:button.width},horizontalCrop:Math.max(0,sourceWidth*scale-media.width),verticalCrop:Math.max(0,sourceHeight*scale-media.height),columns:grid.gridTemplateColumns.split(' ').length,gap:parseFloat(grid.columnGap)};
  })()`);
  assert.deepEqual(composition.source,{width:1756,height:896});assert.ok(composition.horizontalCrop<=1&&composition.verticalCrop<=1,'whole photograph visible on both axes '+JSON.stringify(composition));
  const {vehicle,media,play}=composition;
  assert.ok(vehicle.left>=0&&vehicle.top>=0&&vehicle.right<=media.width&&vehicle.bottom<=media.height,'entire vehicle within photo '+JSON.stringify(composition));
  assert.ok(play.bottom<vehicle.top||play.top>vehicle.bottom||play.right<vehicle.left||play.left>vehicle.right,'play does not cover car');
  assert.ok(play.width>=76&&play.width<=88,'play diameter');
  assert.equal(composition.columns,width>1200?4:width>600?2:1,'benefit columns');
  if(width>1200)assert.ok(composition.gap>=40&&composition.gap<=56,'spacious feature gaps');
  if(width<=1200)assert.ok(Math.abs(media.width/media.height-1756/896)<.01,'stacked photo preserves source frame');
  if(width===3440||width===1920||width===1440||width===390)await shot('home-seller-showcase-'+width);
  await click('.seller-showcase-play');await until("document.querySelector('.seller-showcase-video-dialog iframe')",'video dialog');
  assert.ok(await evaluate("document.querySelector('.seller-showcase-video-dialog iframe').src.includes('youtube-nocookie.com/embed/Cdh5Taq7H6A?autoplay=1')"));
  assert.ok(await evaluate("document.querySelector('.seller-showcase-video-dialog a').href.includes('youtube.com/watch?v=Cdh5Taq7H6A')"));
  if(width===1920)await click('.seller-showcase-video-dialog button');
  else {await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});}
  await until("!document.querySelector('.seller-showcase-video-dialog iframe')",'video unmounted');
  await until("document.activeElement.classList.contains('seller-showcase-play')",'play focus restored');
  console.log('PASS showcase centered/spacing/full-image/order/metrics/CTA/video/responsive',width);
 }
 for(const locale of ['kr','ru']){await navigate(390,locale);const heading=await evaluate("document.querySelector('#seller-showcase-heading').textContent");assert.notEqual(heading,'Find a Car That Moves You.');assert.ok(!heading.includes('???'),'translated Unicode');assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"));console.log('PASS showcase locale',locale);}
 await navigate(1440);await click('.seller-showcase-copy a');await until("location.pathname.replace(/\\/$/,'')==='/car'",'CTA navigation to Cars');console.log('PASS Explore Cars navigation');
 assert.deepEqual(exceptions,[]);console.log('Homepage showcase browser checks passed; video modal lifecycle (streaming blocked), no live writes.');
}finally{socket?.close();chrome.kill();}})().catch(error=>{console.error(error);process.exitCode=1;});
