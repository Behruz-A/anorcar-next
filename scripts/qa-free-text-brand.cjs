// Real Apollo/React auth flow with isolated fetch/cookie fixtures, no live login or database writes.
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const base=process.env.QA_BASE_URL || 'http://localhost:3000';
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

let uploads=0, photoSequence=0, chooserCount=0, failUpload=false, catalogCalls=0;
const claims={_id:'507f1f77bcf86cd799439011',memberType:'AGENT',memberStatus:'ACTIVE',memberAuthType:'PHONE',memberNick:'photoagent',memberPhone:'01000000000',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+900};
const fixture=`(()=>{if(location.origin!==${JSON.stringify(base)})return;localStorage.clear();localStorage.setItem('accessToken',${JSON.stringify('header.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.fixture')});})();`;
async function intercept(params) {
 const headers=[{name:'Access-Control-Allow-Origin',value:base},{name:'Access-Control-Allow-Credentials',value:'true'},{name:'Access-Control-Allow-Headers',value:'content-type,authorization,apollo-require-preflight,x-anorcar-client'},{name:'Content-Type',value:'application/json'}];
 let response={data:{}};
 if(params.request.method==='OPTIONS') {await command('Fetch.fulfillRequest',{requestId:params.requestId,responseCode:204,responseHeaders:headers});return;}
 const body=params.request.postData||'';
 if(body.includes('ImagesUploader')) {
  uploads++;const count=new Set(body.match(/variables\.files\.\d+/g)||[]).size;
  await delay(450);
  response=failUpload?{errors:[{message:'Upload failed. Please try again.'}]}:{data:{imagesUploader:Array.from({length:count},()=>'/img/car/loginpageimg.png?fixture='+ (++photoSequence))}};
 } else {
  const operation=JSON.parse(body).operationName;
  if(operation==='GetBrands') {catalogCalls++;response={data:{getBrands:[{__typename:'Brand',_id:'507f1f77bcf86cd799439022',brandName:'Fixture',brandLogo:null,brandStatus:'ACTIVE'}]}};}
  else if(operation==='GetCar') response={data:{getCar:{__typename:'Car',_id:'507f1f77bcf86cd799439033',memberId:claims._id,brandId:'507f1f77bcf86cd799439022',carStatus:'ACTIVE',carTitle:'Existing Hyundai',carModel:'Sonata',carYear:2024,carMileage:12000,carLocation:'SEOUL',carAddress:'Seoul Korea',carTransmission:'AUTOMATIC',carFuelType:'GASOLINE',carCondition:'USED',carPrice:20000,carColor:'Blue',carImages:['/img/carimg21.png'],carDesc:'Clean existing listing',carBarter:false,carRent:false,carViews:2,carLikes:1,carComments:0,carRank:0,soldAt:null,deletedAt:null,createdAt:'2026-10-13T00:00:00Z',updatedAt:'2026-10-13T00:00:00Z',meLiked:[],memberData:null,brandData:{__typename:'Brand',_id:'507f1f77bcf86cd799439022',brandName:'Hyundai',brandLogo:'/img/car/placeholder.svg',brandStatus:'ACTIVE'}}}};
  else if(operation==='GetMember') response={data:{getMember:{...claims,memberImage:null,memberFullName:'',memberAddress:'',memberDesc:'',memberCars:0,memberArticles:0,memberRank:0,memberPoints:0,memberLikes:0,memberViews:0,memberWarnings:0,memberBlocks:0,memberFollowers:0,memberFollowings:0,memberComments:0,createdAt:'2026-10-13T00:00:00Z',updatedAt:'2026-10-13T00:00:00Z',deletedAt:null,accessToken:null}}};
  else if(JSON.parse(body).query.trim().startsWith('mutation')) throw new Error('Unexpected mutation: '+operation);
 }
 await command('Fetch.fulfillRequest',{requestId:params.requestId,responseCode:200,responseHeaders:headers,body:Buffer.from(JSON.stringify(response)).toString('base64')});
}
async function navigate(width) {
 await command('Page.navigate',{url:'about:blank'});await until("location.href==='about:blank'",'blank');
 await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});
 await command('Emulation.setUserAgentOverride',{userAgent:width<500?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1':'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36'});
 await command('Page.navigate',{url:base+'/mypage?category=addCar'});
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

async function typeBrand(value){
 await evaluate(`(()=>{const e=document.querySelector('input[name="brandName"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await until(`document.querySelector('input[name="brandName"]').value===${JSON.stringify(value)}`,'typed brand');
}
(async()=>{try{
 const active=path.join(profile,'DevToolsActivePort');for(let n=0;n<100&&!fs.existsSync(active);n++)await delay(100);
 const port=fs.readFileSync(active,'utf8').split('\n')[0];const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
 socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>socket.once('open',r));
 socket.on('message',raw=>{const m=JSON.parse(raw);if(m.id){const item=pending.get(m.id);pending.delete(m.id);m.error?item.reject(Error(JSON.stringify(m.error))):item.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails);if(m.method==='Fetch.requestPaused')intercept(m.params).catch(e=>{exceptions.push(String(e));command('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'Failed'}).catch(()=>{});});});
 await command('Runtime.enable');await command('Page.enable');await command('Page.addScriptToEvaluateOnNewDocument',{source:fixture});await command('Fetch.enable',{patterns:[{urlPattern:'*localhost:3007/graphql*'}]});
 for(const width of [1440,390]){
  await navigate(width);
  assert.equal(await evaluate("document.querySelector('input[name=brandName]').type"),'text');
  assert.ok(await evaluate("!document.querySelector('.car-form button[type=submit]').disabled"));
  for(const name of ['BMW','Toyota','Mercedes-Benz','Unlisted Brand'])await typeBrand(name);
  assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"));
  console.log('PASS free brand typing/catalog-independent Save',width);
 }
 await command('Page.navigate',{url:base+'/mypage?category=addCar&carId=507f1f77bcf86cd799439033'});
 await until("document.querySelector('input[name=brandName]')?.value==='Hyundai'",'existing brand hydration');
 await typeBrand('Toyota');
 assert.equal(catalogCalls,0,'Form never requires getBrands');assert.equal(uploads,0);assert.deepEqual(exceptions,[]);
 console.log('PASS edit brand hydration and typing; no live writes or catalog request');
}finally{socket?.close();chrome.kill();}})().catch(error=>{console.error(error);process.exitCode=1;});
