const fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert/strict');
const {spawn}=require('child_process'),WebSocket=require('ws');const delay=ms=>new Promise(r=>setTimeout(r,ms));
const report=JSON.parse(fs.readFileSync('docs/community-articles-2026-10-14.json','utf8'));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'anorcar-community-population-'));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--disable-gpu','about:blank'],{windowsHide:true,stdio:'ignore'});
let socket,id=0;const pending=new Map();
const command=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
async function evaluate(expression){const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function until(expression,label){for(let i=0;i<360;i++){if(await evaluate(expression))return;await delay(200);}throw Error('Timeout: '+label);}
(async()=>{try{
 const active=path.join(profile,'DevToolsActivePort');for(let i=0;i<100&&!fs.existsSync(active);i++)await delay(100);
 const port=fs.readFileSync(active,'utf8').split('\n')[0];const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>socket.once('open',r));socket.on('message',raw=>{const m=JSON.parse(raw);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}});
 await command('Page.enable');await command('Runtime.enable');fs.mkdirSync('docs/screenshots',{recursive:true});
 for(const width of process.env.QA_DETAIL_ONLY ? [] : [1440,390]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});
  await command('Emulation.setUserAgentOverride',{userAgent:width<500?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1':'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36'});
  await command('Page.navigate',{url:'http://localhost:3000/'});await until("document.querySelectorAll('.community-highlight-card').length===4",'news cards');
  for(const category of ['NEWS','FREE','RECOMMEND','HUMOR']){
   await evaluate(`document.querySelector('#community-tab-${category}').click()`);
   await until(`document.querySelectorAll('.community-highlight-card').length===4&&Array.from(document.querySelectorAll('.community-highlight-card')).every(a=>new URL(a.href).searchParams.get('articleCategory')==='${category}')`,category+' cards');
   await evaluate("document.querySelector('.community-highlights').scrollIntoView({block:'start'});document.querySelectorAll('.community-post-image').forEach(i=>i.loading='eager');");
   await until("Array.from(document.querySelectorAll('.community-post-image')).every(i=>i.complete&&i.naturalWidth>0)",'covers');
   const state=await evaluate("({overflow:document.documentElement.scrollWidth>innerWidth+1,cards:Array.from(document.querySelectorAll('.community-highlight-card')).map(a=>({id:new URL(a.href).searchParams.get('id'),title:a.querySelector('h3').textContent,src:a.querySelector('img').currentSrc})),all:document.querySelector('.community-view-all').href})");
   assert(!state.overflow);assert(state.cards.every(c=>report.entries.some(e=>e.articleId===c.id&&e.input.articleTitle===c.title)));assert(new URL(state.all).searchParams.get('articleCategory')===category);assert(state.cards.every(c=>c.src.includes('/uploads/car/')));
   const clip=await evaluate("(()=>{const r=document.querySelector('.community-highlights .container').getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:Math.min(r.height,2000),scale:1}})()");const shot=await command('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});fs.writeFileSync(`docs/screenshots/community-populated-${category.toLowerCase()}-${width}.png`,Buffer.from(shot.data,'base64'));console.log(JSON.stringify({width,category,posts:4,photosLoaded:true,overflow:false}));
  }
 }
 await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await command('Emulation.setUserAgentOverride',{userAgent:'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36'});
 const first=report.entries[0];await command('Page.navigate',{url:`http://localhost:3000/community/detail?articleCategory=NEWS&id=${first.articleId}`});await until(`document.querySelector('.content-data')?.textContent===${JSON.stringify(first.input.articleTitle)}`,'article details');await until("document.querySelector('.toastui-editor-contents')?.innerText.includes('Source:')",'rendered article');assert(await evaluate(`document.querySelector('.toastui-editor-contents').innerText.includes('2022')`));console.log('PASS article detail routing, published title and sourced body. Guest checks only.');
}finally{socket?.close();chrome.kill();}})().catch(e=>{console.error(e.message);process.exitCode=1});
