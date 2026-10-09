const fs=require('fs'),os=require('os'),path=require('path');
const previous=fs.readFileSync(path.join(os.tmpdir(),'anorcar-navbar-parity.cjs'),'utf8');
const checks=async function(){
 const state=()=>evaluate(`(()=>{const nav=document.querySelector('.navbar-main'),wrapper=nav?.parentElement,marker=document.querySelector('[data-home-navbar-trigger]');const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {top:r.top,height:r.height,width:r.width,docTop:r.top+scrollY}};const css=nav&&getComputedStyle(nav);return {scroll:scrollY,visible:wrapper?.classList.contains('is-visible'),hidden:wrapper?.classList.contains('is-hidden'),aria:wrapper?.getAttribute('aria-hidden'),inert:wrapper?.hasAttribute('inert'),position:css?.position,visibility:css?.visibility,bg:css?.backgroundColor,transition:css?.transitionDuration,nav:box(nav),marker:box(marker),hero:box(document.querySelector('.homepage-header')),search:box(document.querySelector('.compact-search')),budget:box(document.querySelector('.browse-by-budget')),budgetHeading:box(document.querySelector('#budget-heading')),links:[...document.querySelectorAll('.navbar-main .router-box a')].map(e=>[e.textContent.trim(),e.getAttribute('href')]),observed:window.__navObserved??0}})()`);
 await command('Page.addScriptToEvaluateOnNewDocument',{source:`window.__navObserved=0;const NativeObserver=window.IntersectionObserver;window.IntersectionObserver=class extends NativeObserver{observe(target){if(target.hasAttribute('data-home-navbar-trigger'))window.__navObserved++;super.observe(target)}};`});
 const html=await(await fetch('http://localhost:3000/')).text();assert.ok(html.includes('homepage-scroll-nav is-hidden'));assert.ok(html.includes('inert=""'));
 async function navigate(width,mobile,route='/',locale='en'){
  await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile});
  await command('Emulation.setUserAgentOverride',{userAgent:mobile?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1':'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36'});
  await command('Page.navigate',{url:'http://localhost:3000'+(locale==='en'?'':'/'+locale)+route});
  await until("document.readyState==='complete' && !!window.next?.router && !!document.querySelector('.navbar-main')");await evaluate('document.fonts.ready.then(()=>true)');await delay(400);
 }
 for(const [width,mobile,locale]of [[1440,false,'en'],[768,false,'en'],[390,true,'en'],[320,true,'en'],[390,true,'ru']]){
  await navigate(width,mobile,'/',locale);await evaluate('scrollTo(0,0)');await delay(350);
  const start=await state();assert.ok(start.hidden&&!start.visible&&start.inert&&start.aria==='true');assert.equal(start.visibility,'hidden');assert.equal(start.position,'fixed');assert.ok(start.observed>=1);assert.equal(start.transition.split(',')[0],'0.25s');
  const markerTop=start.marker.docTop;
  await evaluate(`scrollTo(0,${markerTop-2})`);await delay(300);assert.ok((await state()).hidden);
  await evaluate(`scrollTo(0,${markerTop+2})`);await until("document.querySelector('.homepage-scroll-nav').classList.contains('is-visible')");await delay(300);
  const shown=await state();assert.equal(shown.visibility,'visible',JSON.stringify(shown));assert.ok(!shown.inert&&shown.aria===null);assert.equal(shown.bg,'rgb(24, 26, 32)');assert.ok(Math.abs(shown.nav.top)<.1);
  for(const key of ['hero','search','budget','budgetHeading']){assert.ok(Math.abs(shown[key].docTop-start[key].docTop)<.1,'no jump '+key+' '+width);assert.equal(shown[key].height,start[key].height);}
  assert.deepEqual(shown.links,start.links);
  await evaluate("document.querySelector('.btn-lang').click()");await until("!!document.querySelector('[role=menu]')");await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});await delay(250);
  if(locale==='en'&&[1440,390].includes(width)){const shot=await command('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`docs/screenshots/home-scroll-navbar-visible-${width}.png`,Buffer.from(shot.data,'base64'));}
  await evaluate('scrollTo(0,0)');await delay(350);assert.ok((await state()).hidden);
  if(locale==='en'&&[1440,390].includes(width)){const shot=await command('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`docs/screenshots/home-scroll-navbar-hidden-${width}.png`,Buffer.from(shot.data,'base64'));}
  await evaluate('scrollTo(0,document.documentElement.scrollHeight-innerHeight)');await delay(350);assert.ok((await state()).visible);
  await evaluate('scrollTo(0,0)');await delay(350);assert.ok((await state()).hidden);
  console.log(JSON.stringify({width,locale,initialHidden:true,trigger:markerTop,showHide:true,deepJump:true,layoutStable:true,mobileHeroTop:start.hero.top}));
 }
 await navigate(1440,false);await evaluate('scrollTo(0,2000)');await delay(350);assert.ok((await state()).visible);
 await command('Page.reload',{});await until("document.readyState==='complete' && !!window.next?.router && !!document.querySelector('[data-home-navbar-trigger]')");await delay(500);
 const reload=await state();assert.equal(reload.visible,reload.marker.top<=0,'reload restored position');
 await evaluate("document.querySelector('.router-box a[href=\"/car\"]').click()");await until("location.pathname==='/car' && !!document.querySelector('.navbar-main') && !document.querySelector('.homepage-scroll-nav')");await delay(350);
 const cars=await state();assert.ok(!cars.hidden&&cars.visibility==='visible'&&!cars.inert);
 const history=await command('Page.getNavigationHistory');await command('Page.navigateToHistoryEntry',{entryId:history.entries[history.currentIndex-1].id});
 await until("location.pathname==='/' && !!window.next?.router && !!document.querySelector('[data-home-navbar-trigger]')");await delay(600);
 const back=await state();assert.equal(back.visible,back.marker.top<=0,'browser back restored position');
 await evaluate('scrollTo(0,0)');await delay(350);await command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});assert.equal((await state()).transition,'0s');await command('Emulation.setEmulatedMedia',{features:[]});
 await evaluate('scrollTo(0,2000)');await delay(350);await command('Emulation.setDeviceMetricsOverride',{width:768,height:1000,deviceScaleFactor:1,mobile:false});await delay(400);const resized=await state();assert.equal(resized.visible,resized.marker.top<=0);assert.equal(resized.position,'fixed');
 for(const route of ['/car','/agent','/community?articleCategory=FREE','/cs']){await navigate(1440,false,route);const normal=await state();assert.ok(!normal.hidden&&normal.visibility==='visible'&&!normal.inert);assert.ok(await evaluate("!document.querySelector('.homepage-scroll-nav')"));}
 await navigate(390,true,'/car');const mobileCars=await state();assert.equal(mobileCars.position,'relative');assert.equal(mobileCars.visibility,'visible');
 assert.equal(errors.length,0,JSON.stringify(errors));console.log('Homepage navbar checks passed: SSR hidden, observer trigger, bidirectional/deep scrolling, stable geometry, locale/menu, reload/back/resize, reduced motion, unchanged other routes.');
};
const body=checks.toString().slice(checks.toString().indexOf('{')+1,-1);
const loopStart=previous.indexOf('for(const [width,locale]');
fs.writeFileSync(path.join(os.tmpdir(),'anorcar-home-scroll-navbar-qa.cjs'),previous.slice(0,loopStart)+body+"\n}catch(e){console.error(e);process.exitCode=1;}finally{socket?.close();chrome.kill();}})();\n");
