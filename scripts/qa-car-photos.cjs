// Real Apollo/React auth flow with isolated fetch/cookie fixtures, no live login or database writes.
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'anorcar-car-photos-'));
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
	const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
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

let uploads=0, photoSequence=0, chooserCount=0, failUpload=false;
const claims={_id:'507f1f77bcf86cd799439011',memberType:'AGENT',memberStatus:'ACTIVE',memberAuthType:'PHONE',memberNick:'photoagent',memberPhone:'01000000000',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+900};
const fixture=`(()=>{if(location.origin!=='http://localhost:3000')return;localStorage.clear();localStorage.setItem('accessToken',${JSON.stringify('header.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.fixture')});})();`;
const photoFiles=Array.from({length:5},(_,index)=>{const filename=path.join(profile,'photo-'+index+'.png');fs.copyFileSync('public/img/car/loginpageimg.png',filename);return filename;});
async function intercept(params) {
 const headers=[{name:'Access-Control-Allow-Origin',value:'http://localhost:3000'},{name:'Access-Control-Allow-Credentials',value:'true'},{name:'Access-Control-Allow-Headers',value:'content-type,authorization,apollo-require-preflight,x-anorcar-client'},{name:'Content-Type',value:'application/json'}];
 let response={data:{}};
 if(params.request.method==='OPTIONS') {await command('Fetch.fulfillRequest',{requestId:params.requestId,responseCode:204,responseHeaders:headers});return;}
 const body=params.request.postData||'';
 if(body.includes('ImagesUploader')) {
  uploads++;const count=new Set(body.match(/variables\.files\.\d+/g)||[]).size;
  await delay(450);
  response=failUpload?{errors:[{message:'Upload failed. Please try again.'}]}:{data:{imagesUploader:Array.from({length:count},()=>'/img/car/loginpageimg.png?fixture='+ (++photoSequence))}};
 } else {
  const operation=JSON.parse(body).operationName;
  if(operation==='GetBrands') response={data:{getBrands:[{__typename:'Brand',_id:'507f1f77bcf86cd799439022',brandName:'Fixture',brandLogo:null,brandStatus:'ACTIVE'}]}};
  else if(operation==='GetMember') response={data:{getMember:{...claims,memberImage:null,memberFullName:'',memberAddress:'',memberDesc:'',memberCars:0,memberArticles:0,memberRank:0,memberPoints:0,memberLikes:0,memberViews:0,memberWarnings:0,memberBlocks:0,memberFollowers:0,memberFollowings:0,memberComments:0,createdAt:'2026-10-13T00:00:00Z',updatedAt:'2026-10-13T00:00:00Z',deletedAt:null,accessToken:null}}};
  else if(JSON.parse(body).query.trim().startsWith('mutation')) throw new Error('Unexpected mutation: '+operation);
 }
 await command('Fetch.fulfillRequest',{requestId:params.requestId,responseCode:200,responseHeaders:headers,body:Buffer.from(JSON.stringify(response)).toString('base64')});
}
async function navigate(width) {
 await command('Page.navigate',{url:'about:blank'});await until("location.href==='about:blank'",'blank');
 await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});
 await command('Emulation.setUserAgentOverride',{userAgent:width<500?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1':'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36'});
 await command('Page.navigate',{url:'http://localhost:3000/mypage?category=addCar'});
 await until("document.readyState==='complete'&&document.querySelectorAll('.car-photo-add').length===5",'photo form');await delay(500);
}
async function selectPhotos(files) {
 const {root}=await command('DOM.getDocument');
 const {nodeId}=await command('DOM.querySelector',{nodeId:root.nodeId,selector:'.car-photo-section input[type=file]'});
 await command('DOM.setFileInputFiles',{nodeId,files});
}
async function screenshot(name) {
 await evaluate("document.querySelector('.car-photo-section').scrollIntoView({block:'center'})");await delay(150);
 const clip=await evaluate("(()=>{const r=document.querySelector('.car-photo-section').getBoundingClientRect();return{x:r.left+scrollX-4,y:r.top+scrollY-4,width:r.width+8,height:r.height+8,scale:1};})()");
 const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});
 fs.mkdirSync('docs/screenshots',{recursive:true});fs.writeFileSync('docs/screenshots/'+name+'.png',Buffer.from(shot.data,'base64'));
}
(async()=>{try{
 const active=path.join(profile,'DevToolsActivePort');for(let n=0;n<100&&!fs.existsSync(active);n++)await delay(100);
 const port=fs.readFileSync(active,'utf8').split('\n')[0];const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
 socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>socket.once('open',r));
 socket.on('message',raw=>{const m=JSON.parse(raw);if(m.id){const item=pending.get(m.id);pending.delete(m.id);m.error?item.reject(Error(JSON.stringify(m.error))):item.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails);if(m.method==='Page.fileChooserOpened')chooserCount++;if(m.method==='Fetch.requestPaused')intercept(m.params).catch(e=>{exceptions.push(String(e));command('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'Failed'}).catch(()=>{});});});
 await command('Runtime.enable');await command('Page.enable');await command('DOM.enable');await command('Page.addScriptToEvaluateOnNewDocument',{source:fixture});await command('Fetch.enable',{patterns:[{urlPattern:'*localhost:3007/graphql*'}]});await command('Page.setInterceptFileChooserDialog',{enabled:true});
 for(const width of [1440,390]) {
  await navigate(width);assert.equal(await evaluate("getComputedStyle(document.querySelector('.car-photo-section input')).display"),'none');
  await evaluate("document.querySelector('.car-photo-add').click()");await until('true','chooser');await delay(100);assert.ok(chooserCount>0);
  await selectPhotos([photoFiles[0]]);await until("document.querySelectorAll('.car-photo-slot').length===1",'one photo');
  assert.equal(await evaluate("document.querySelectorAll('.car-photo-add').length"),4);await screenshot('car-photos-one-'+width);
  assert.ok(await evaluate("[...document.querySelectorAll('.car-photo-add')].every(e=>{const r=e.getBoundingClientRect();return r.width>44&&r.width<=112&&r.left>=0&&r.right<=innerWidth;})"));
  await selectPhotos(photoFiles.slice(1));await until("document.querySelectorAll('.car-photo-slot').length===5",'five photos');
  assert.equal(await evaluate("document.querySelectorAll('.car-photo-add').length"),0);assert.ok(await evaluate("document.querySelector('.car-photo-section input').disabled"));
  await evaluate("document.querySelector('.car-photo-remove').click()");assert.equal(await evaluate("document.querySelectorAll('.car-photo-add').length"),1);
  const before=uploads;await selectPhotos(photoFiles.slice(0,2));await delay(300);assert.equal(uploads,before,'over-limit rejected');assert.equal(await evaluate("document.querySelectorAll('.car-photo-slot').length"),4);
  failUpload=true;await selectPhotos([photoFiles[0]]);await until("document.querySelector('#add-car-page .MuiAlert-root')?.textContent.includes('Upload failed')",'failure');
  assert.equal(await evaluate("document.querySelectorAll('.car-photo-slot').length"),4);assert.equal(await evaluate("document.querySelectorAll('.car-photo-add').length"),1);
  failUpload=false;await selectPhotos([photoFiles[0]]);await until("document.querySelectorAll('.car-photo-slot').length===5",'retry');await screenshot('car-photos-full-'+width);
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));console.log('PASS photo slots, chooser, 1+4 upload, limit, removal, failure/retry',width);
 }
 assert.deepEqual(exceptions,[]);console.log('PASS isolated car photo UI; no real uploads or listing writes.');
}finally{if(socket)socket.close();chrome.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
