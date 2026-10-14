// Isolated browser QA. Fixture mutations are intercepted; no live writes or login.
const fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert/strict'), ts = require('typescript');
const { spawn } = require('child_process'), WebSocket = require('ws');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, esModuleInterop: true } }).outputText, f);
const { print } = require('graphql'), { GET_BOARD_ARTICLE } = require('../apollo/user/query.ts');
const report = JSON.parse(fs.readFileSync('docs/community-articles-2026-10-14.json', 'utf8'));
const articleId = report.entries[0].articleId, base = process.env.QA_BASE_URL || 'http://localhost:3000';
const delay = ms => new Promise(r => setTimeout(r, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'anorcar-article-detail-'));
let chrome, socket, seq = 0, fixture = false, auth = false, failArticle = false, failComments = false;
let article, comments = [], likes = 0, creates = 0, updates = 0, reads = 0;
const errors = [], pending = new Map();
const user = { _id: '507f1f77bcf86cd799439011', memberType: 'USER', memberStatus: 'ACTIVE', memberAuthType: 'PHONE', memberNick: 'detail-test', memberPhone: '01000000000', memberFullName: 'Detail test', memberImage: null, memberCars: 0, memberArticles: 0, memberRank: 0, memberLikes: 0, memberViews: 0, memberPoints: 0, memberFollowers: 0, memberFollowings: 0, memberComments: 0, memberWarnings: 0, memberBlocks: 0, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+1800 };
const token = 'header.' + Buffer.from(JSON.stringify(user)).toString('base64url') + '.fixture';
const command = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
async function evaluate(expression) { const r = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; }
async function until(expression, label) { for (let i=0;i<300;i++) { if (await evaluate(`Boolean(${expression})`)) return; await delay(200); } throw Error('Timeout: '+label); }
async function fulfill(p, result) { await command('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name:'Content-Type',value:'application/json' },{name:'Access-Control-Allow-Origin',value:base},{name:'Access-Control-Allow-Credentials',value:'true'}], body: Buffer.from(JSON.stringify(result)).toString('base64') }); }
async function intercept(p) {
 if (p.request.method === 'OPTIONS') return command('Fetch.continueRequest', { requestId:p.requestId });
 const body = JSON.parse(p.request.postData || '{}'); let data;
 if (body.operationName === 'GetBoardArticle') { assert(/^[a-f\d]{24}$/i.test(body.variables.input)); reads++; if (fixture) { if (failArticle) return fulfill(p,{errors:[{message:'Fixture article failure'}]}); data={getBoardArticle:article}; } }
 if (body.operationName === 'GetComments') { assert.equal(body.variables.input.search.commentRefId,articleId); if(fixture) { if(failComments)return fulfill(p,{errors:[{message:'Fixture comments failure'}]}); const {page,limit}=body.variables.input; data={getComments:{__typename:'Comments',list:comments.slice((page-1)*limit,page*limit),metaCounter:[{__typename:'TotalCounter',total:comments.length}]}}; } }
 if (fixture && body.operationName === 'GetMember' && body.variables.input === user._id) data={getMember:{...user,__typename:'Member',memberAddress:'',memberDesc:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),deletedAt:null,accessToken:null}};
 if (/^\s*mutation/.test(body.query || '')) {
  if (body.query.includes('refreshAccessToken')) return fulfill(p,auth ? {data:{refreshAccessToken:{__typename:'AuthTokens',accessToken:token}}} : {errors:[{message:'No fixture session'}]});
  assert(fixture && auth,'Live mutations blocked');
  if(body.operationName==='LikeTargetBoardArticle'){likes++;const liked=!!article.meLiked?.[0]?.myFavorite;article.articleLikes+=liked?-1:1;article.meLiked=liked?[]:[{__typename:'MeLiked',myFavorite:true,memberId:user._id,likeRefId:articleId}];data={likeTargetBoardArticle:article};}
  else if(body.operationName==='CreateComment'){creates++;assert.equal(body.variables.input.commentGroup,'ARTICLE');assert.equal(body.variables.input.commentRefId,articleId);assert(body.variables.input.commentContent.trim().length>0&&body.variables.input.commentContent.length<=100);const item={...comments[0],_id:'507f1f77bcf86cd799439099',commentContent:body.variables.input.commentContent};comments.unshift(item);article.articleComments=comments.length;data={createComment:item};}
  else if(body.operationName==='UpdateComment'){updates++;const input=body.variables.input,target=comments.find(c=>c._id===input._id);assert(target&&target.memberId===user._id);if(input.commentStatus==='DELETE'){comments=comments.filter(c=>c._id!==input._id);article.articleComments=comments.length;data={updateComment:{...target,commentStatus:'DELETE'}};}else{assert(input.commentContent.trim().length>0&&input.commentContent.length<=100);target.commentContent=input.commentContent;data={updateComment:target};}}
  else throw Error('Unexpected mutation blocked: '+body.operationName);
 }
 return data ? fulfill(p,{data}) : command('Fetch.continueRequest',{requestId:p.requestId});
}
async function navigate(width, suffix='?articleCategory=NEWS&id='+articleId) {
 await command('Page.navigate',{url:'about:blank'});
 await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});
 await command('Emulation.setUserAgentOverride',{userAgent:width<500?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1':'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36'});
 await command('Page.addScriptToEvaluateOnNewDocument',{source:`if(location.origin===${JSON.stringify(base)}){${auth?`localStorage.setItem('accessToken',${JSON.stringify(token)})`:`localStorage.removeItem('accessToken')`}}`});
 await command('Page.navigate',{url:base+'/community/detail'+suffix});
}
async function input(selector,value) { await evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(element,${JSON.stringify(value)});element.dispatchEvent(new Event('input',{bubbles:true}));})()`); }
async function clickText(selector,text) { await evaluate(`Array.from(document.querySelectorAll(${JSON.stringify(selector)})).find(b=>b.textContent.includes(${JSON.stringify(text)})).click()`); }
(async()=>{try {
 try {
  const response=await fetch('http://localhost:3007/graphql',{method:'POST',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json','apollo-require-preflight':'true'},body:JSON.stringify({query:print(GET_BOARD_ARTICLE),variables:{input:articleId}})});const json=await response.json();assert(!json.errors,JSON.stringify(json.errors));article=json.data.getBoardArticle;assert(article);
 } catch(error) {
  fixture=true;const entry=report.entries[0],now=new Date().toISOString();
  const member={...user,__typename:'Member',_id:entry.memberId,memberType:'AGENT',memberNick:entry.agent,memberFullName:'',memberAddress:'',memberDesc:'',memberImage:null,createdAt:now,updatedAt:now,deletedAt:null,accessToken:null};
  article={...entry.input,__typename:'BoardArticle',_id:articleId,memberId:entry.memberId,memberData:member,articleStatus:'ACTIVE',articleLikes:0,articleViews:0,articleComments:0,meLiked:[],createdAt:now,updatedAt:now};
  console.log('Live backend unavailable; using saved article fixture:',error.message);
 }
 chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--disable-gpu','about:blank'],{windowsHide:true,stdio:'ignore'});
 const active=path.join(profile,'DevToolsActivePort');for(let i=0;i<100&&!fs.existsSync(active);i++)await delay(100);const port=fs.readFileSync(active,'utf8').split('\n')[0];const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>socket.once('open',r));socket.on('message',raw=>{const m=JSON.parse(raw);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}if(m.method==='Fetch.requestPaused')intercept(m.params).catch(e=>{errors.push(e.message);command('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'Failed'}).catch(()=>{});});});
 await command('Page.enable');await command('Runtime.enable');await command('Fetch.enable',{patterns:[{urlPattern:'*localhost:3007/graphql*'}]});fs.mkdirSync('docs/screenshots',{recursive:true});
 for(const width of [1440,1280,768,390]){
  await navigate(width);await until("document.querySelector('.content-data')&&document.querySelector('.toastui-editor-contents')&&document.querySelector('.comment-signin')",'live article');await until("document.querySelector('.comments-empty')||document.querySelector('.article-comment-list')",'settled comments');await until("document.querySelector('.article-cover')?.complete&&document.querySelector('.article-cover')?.naturalWidth>0",'live cover');
  assert.equal(await evaluate("document.querySelector('.content-data').textContent"),article.articleTitle);
  const layout=await evaluate("(()=>{const r=document.querySelector('.article-container').getBoundingClientRect(),hero=document.querySelector('.header-basic').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth+1,left:r.left,right:document.documentElement.clientWidth-r.right,hero:hero.height,image:getComputedStyle(document.querySelector('.header-basic')).backgroundImage,columns:getComputedStyle(document.querySelector('.article-layout')).gridTemplateColumns.split(' ').length}})()");assert(!layout.overflow);assert(Math.abs(layout.left-layout.right)<2);assert(layout.image.includes('/img/hero7.png'));assert(layout.hero<400);assert.equal(layout.columns,width>1000?2:1);
  assert.equal(await evaluate("document.querySelectorAll('[aria-label=\"Edit comment\"]').length"),0);
  if([1440,390].includes(width)){await evaluate('scrollTo(0,0)');const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:Math.min(await evaluate('document.documentElement.scrollHeight'),2100),scale:1}});fs.writeFileSync(`docs/screenshots/community-detail-${width}.png`,Buffer.from(shot.data,'base64'));}
  console.log('PASS '+(fixture?'fixture':'live')+' article, hero7, cover, guest and balanced layout',width);
 }
 fixture=true;auth=true;article={...article,__typename:'BoardArticle',meLiked:[],articleLikes:0};comments=Array.from({length:6},(_,i)=>({_id:'507f1f77bcf86cd7994390'+String(20+i),__typename:'Comment',commentGroup:'ARTICLE',commentStatus:'ACTIVE',commentContent:i===0?'Own fixture comment':'Other fixture comment '+i,commentRefId:articleId,memberId:i===0?user._id:article.memberId,memberData:i===0?{...user,__typename:'Member'}:article.memberData,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}));article.articleComments=6;
 await navigate(390);await until("document.querySelector('#new-article-comment')&&document.querySelectorAll('.article-comment-list li').length===5",'fixture comments');assert.equal(await evaluate("document.querySelectorAll('[aria-label=\"Edit comment\"]').length"),1);
 await evaluate("document.querySelector('.article-reactions button').click();document.querySelector('.article-reactions button').click()");await until("document.querySelector('.article-reactions button').getAttribute('aria-pressed')==='true'",'like');assert.equal(likes,1);
 await input('#new-article-comment','   ');assert(await evaluate("document.querySelector('.comment-form button').disabled"));await input('#new-article-comment','A fixture comment');await evaluate("document.querySelector('.comment-form').requestSubmit();document.querySelector('.comment-form').requestSubmit()");await until("document.querySelector('.article-comment-list').textContent.includes('A fixture comment')&&document.querySelector('#new-article-comment').value===''");assert.equal(creates,1);
 await evaluate("document.querySelector('[aria-label=\"Edit comment\"]').click()");await until("document.querySelector('#edit-article-comment')",'dialog');assert(await evaluate("document.querySelector('[role=dialog]')!==null"));await input('#edit-article-comment','Updated fixture comment');await clickText('.article-edit-dialog button','Save changes');await until("!document.querySelector('#edit-article-comment')&&document.querySelector('.article-comment-list').textContent.includes('Updated fixture comment')",'edited');assert.equal(updates,1);
 await evaluate("document.querySelector('[aria-label=\"Delete comment\"]').click()");await until("document.querySelector('.swal2-confirm')",'delete confirm');await evaluate("document.querySelector('.swal2-confirm').click()");await until("!document.querySelector('.swal2-container')&&!document.querySelector('.article-comment-list').textContent.includes('Updated fixture comment')",'deleted');assert.equal(updates,2);
 await evaluate("document.querySelector('[aria-label=\"Go to page 2\"]').click()");await until("document.querySelectorAll('.article-comment-list li').length===1",'page two');
 const before=reads;await navigate(390,'?id=bad');await until("document.querySelector('.article-state h2')?.textContent==='Article unavailable'",'invalid ID');assert.equal(reads,before);
 failArticle=true;await navigate(1440);await until("document.querySelector('.MuiAlert-message')?.textContent.includes('Article could not be loaded.')",'article error');failArticle=false;await clickText('.MuiAlert-action button','Try again');await until("document.querySelector('.content-data')",'article retry');
 failComments=true;await navigate(390);await until("Array.from(document.querySelectorAll('.MuiAlert-message')).some(a=>a.textContent.includes('Comments could not be loaded.'))",'comments error');failComments=false;await clickText('.MuiAlert-action button','Try again');await until("document.querySelectorAll('.article-comment-list li').length===5",'comments retry');
 assert.deepEqual(errors,[]);console.log('PASS fixture like, duplicate guards, whitespace validation, create/edit/delete, owner controls, pagination, invalid ID and retry. No live mutations.');
} finally { socket?.close();chrome?.kill(); }})().catch(e=>{console.error(e);process.exitCode=1});

