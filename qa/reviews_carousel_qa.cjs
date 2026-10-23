/* Google reviews carousel QA. All Google data below are synthetic fixtures.
 * Every external request is intercepted. The real configuration file is neither
 * read nor requested; this runner makes no Google API calls and stores no key.
 * NODE qa/reviews_carousel_qa.cjs BASE_URL OUTPUT_DIR
 */
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('C:/Users/Administrador/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = (process.argv[2] || 'http://127.0.0.1:8000').replace(/\/$/, '');
const origin = new URL(base).origin;
const output = process.argv[3] || path.join(__dirname, 'browser-reviews-carousel');
const placeId = 'ChIJD2Lre4XhphIR8x2oRi6jTCE';
const fakeKey = 'AIzaSy' + 'A'.repeat(33);
const report = {generated:new Date().toISOString(), scope:'SIMULATED SDK / TEST FIXTURE REVIEWS. No real Google request, key, review data, billing or activation is validated here. Isolated section screenshots temporarily hide sticky navigation and floating page chrome after functional assertions.', checks:[], cases:[], errors:[]};
const check = (name, pass, detail = {}) => report.checks.push({name,pass,...detail});
fs.mkdirSync(output,{recursive:true});
const safeURL = value => { const u = new URL(value); u.search = ''; return u.href; };
const fixture = {
  displayName:'EDIP — SIMULACIÓ QA',
  rating:4.8, userRatingCount:42, googleMapsURI:'https://maps.google.com/?cid=TEST',
  attributions:[{provider:'Proveïdor de prova',providerURI:'https://www.google.com/maps'},{provider:'Proveïdor de prova',providerURI:'https://www.google.com/maps'},{provider:'Text segur de prova',providerURI:'javascript:alert(1)'}],
  reviews:[
    {authorAttribution:{displayName:'Persona QA 1',uri:'https://www.google.com/maps/contrib/test1'},rating:4,publishTime:'2026-01-01T10:00:00Z',text:'SIMULACIÓ QA: primera ressenya de prova.',googleMapsURI:'https://www.google.com/maps/reviews/test1'},
    {authorAttribution:{displayName:'Persona QA 2',uri:'https://www.google.com/maps/contrib/test2',photoURI:'https://lh3.googleusercontent.com/qa-avatar'},rating:5,publishTime:'2026-05-01T10:00:00Z',text:'Traducció QA que no s’ha de preferir.',originalText:'SIMULACIÓ QA: aquest text llarg només comprova el disseny; no és una ressenya real. '.repeat(10),googleMapsURI:'https://www.google.com/maps/reviews/test2'},
    {authorAttribution:{displayName:'<img src=x onerror="window.__qaXSS=true">',uri:'javascript:alert(1)',photoURI:'https://name:password@google.com/bad'},rating:3,publishTime:'2026-03-01T10:00:00Z',text:'SIMULACIÓ QA <script>window.__qaXSS=true</script> <img src=x onerror="window.__qaXSS=true">',googleMapsURI:'data:text/html,test'},
    {authorAttribution:{displayName:'Persona QA 4',uri:'https://www.google.com/maps/contrib/test4'},rating:5,publishTime:'2026-04-01T10:00:00Z',text:'SIMULACIÓ QA: targeta de prova amb text breu.',googleMapsURI:'https://www.google.com/maps/reviews/test4'},
    {authorAttribution:{displayName:'Persona QA 5'},rating:4,publishTime:'2026-02-01T10:00:00Z',text:''},
    {authorAttribution:{displayName:'SISENA NO MOSTRADA'},rating:5,publishTime:'2026-06-01T10:00:00Z',text:'Aquesta sisena entrada comprova el límit defensiu de cinc.'}
  ]
};
fixture.reviews[1].originalTextLanguageCode='ca';
fixture.reviews[1].textLanguageCode='en';
fixture.reviews[2].textLanguageCode='"><script>';
fixture.reviews[3].textLanguageCode='ca-es';
function sdkFixture(mode) {
  return `(() => {
    const mode=${JSON.stringify(mode)}, data=${JSON.stringify(fixture)};
    window.__qaSDK={imports:[],fetches:[]};
    class Place {
      constructor(options){window.__qaSDK.place=options.id;}
      async fetchFields(options){
        window.__qaSDK.fetches.push(options.fields);
        window.parent.__qaFixtureFetches=(window.parent.__qaFixtureFetches||0)+1;
        const temporary=['UNAVAILABLE','INTERNAL','DEADLINE_EXCEEDED'].find(code=>mode===\`transient-\${code}\`);
        if((temporary&&window.__qaSDK.fetches.length===1)||mode==='persistent-transient') throw Object.assign(new Error('Mock temporary Google error'),{code:temporary||'UNAVAILABLE'});
        if(mode==='permission-denied'||mode==='quota-error') throw Object.assign(new Error('Mock non-retryable Google error'),{code:mode==='permission-denied'?'PERMISSION_DENIED':'RESOURCE_EXHAUSTED'});
        if(mode==='places-error') throw new Error('Mock Places API denied');
        if(mode==='hold') return new Promise(()=>{});
        Object.assign(this,data);
        if(mode==='empty') this.reviews=[];
        this.reviews.forEach(item=>{item.publishTime=new Date(item.publishTime)});
        return {place:this};
      }
    }
    window.google={maps:{importLibrary:async name=>{window.__qaSDK.imports.push(name);return {Place};}}};
    setTimeout(()=>{if(mode==='auth-error') window.gm_authFailure();else window.edipReviewsReady();},0);
  })();`;
}
async function makeCase(browser,name,options={}) {
  const context = await browser.newContext({viewport:{width:options.width||1440,height:960},reducedMotion:'reduce',javaScriptEnabled:!options.noJS});
  const result = {name,sdkRequests:[],external:[],unexpectedExternal:[],pageErrors:[]};
  report.cases.push(result);
  await context.addInitScript(() => {
    if (window !== top) return;
    window.__qaActivity={clicks:0,scrolls:0};
    addEventListener('click',()=>window.__qaActivity.clicks++,true);
    addEventListener('scroll',()=>window.__qaActivity.scrolls++,true);
  });
  if(options.fastTimeout) await context.addInitScript(() => {
    const original=window.setTimeout.bind(window);
    window.setTimeout=(fn,ms,...args)=>original(fn,ms>=10000?800:ms,...args);
  });
  let mode=options.mode||'success';
  const config={apiKey:options.empty?'':options.invalidKey??fakeKey,placeId:options.invalidPlace??placeId};
  await context.route('**/*',async route=>{
    const request=route.request(),u=new URL(request.url());
    if(u.origin===origin) {
      if(u.pathname.endsWith('/assets/js/google-reviews-config.js')) await route.fulfill({contentType:'application/javascript',body:`window.EDIP_GOOGLE_REVIEWS=${JSON.stringify(config)};`});
      else await route.continue();
      return;
    }
    result.external.push(safeURL(u.href));
    if(u.origin==='https://maps.googleapis.com'&&u.pathname==='/maps/api/js') {
      result.sdkRequests.push({path:u.pathname,parameters:Object.fromEntries([...u.searchParams].filter(([name])=>name!=='key')),inWidget:request.frame().url().includes('/assets/widgets/google-reviews.html')});
      if(mode==='network-error') await route.abort('failed');
      else await route.fulfill({contentType:'application/javascript',body:sdkFixture(mode)});
    } else if(u.href==='https://lh3.googleusercontent.com/qa-avatar') {
      await route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aIT8AAAAASUVORK5CYII=','base64')});
    } else {result.unexpectedExternal.push(safeURL(u.href));await route.abort('blockedbyclient');}
  });
  const page=await context.newPage();
  page.on('pageerror',error=>result.pageErrors.push(error.message));
  page.setDefaultTimeout(6000);
  await page.goto(`${base}/index.html`,{waitUntil:'networkidle'});
  const panel=page.locator('[data-reviews-panel]');
  return {context,page,result,panel,iframe:panel.locator('iframe'),retry:page.locator('[data-reviews-retry]'),status:page.locator('[data-reviews-status]'),placeholder:page.locator('[data-reviews-placeholder]'),section:page.locator('#opinions'),setMode:value=>{mode=value;}};
}
async function ready(c,state='ready') {
  await c.iframe.waitFor();
  const frame=await (await c.iframe.elementHandle()).contentFrame();
  await frame.locator(`#reviews-content[data-reviews-state="${state}"]`).waitFor();
  await c.page.waitForFunction(()=>document.querySelector('[data-reviews-panel]').getAttribute('aria-busy')==='false');
  return frame;
}
async function indices(frame) {return frame.locator('.review-card:visible').evaluateAll(cards=>cards.map(card=>Number(card.dataset.reviewIndex)));}
async function settledHeight(c,frame) {
  await c.page.waitForFunction(()=>{
    const iframe=document.querySelector('[data-reviews-panel] iframe');
    return iframe&&Math.abs(iframe.getBoundingClientRect().height-Math.ceil(iframe.contentDocument.body.getBoundingClientRect().height))<=2;
  });
  return frame.evaluate(()=>({height:document.body.getBoundingClientRect().height,scrollWidth:document.documentElement.scrollWidth,width:innerWidth}));
}
async function noStorage(c,frame) {
  const probe=()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage),cookies:document.cookie});
  const states=[await c.page.evaluate(probe)];
  if(frame) states.push(await frame.evaluate(probe));
  return states.every(s=>s.local.length===0&&s.session.length===0&&s.cookies==='');
}
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  async function run(name,options,fn){
    let c;
    try{c=await makeCase(browser,name,options);await fn(c);}
    catch(error){report.errors.push({name,error:error.stack});}
    finally{if(c){check(`${name}:no-unexpected-external`,!c.result.unexpectedExternal.length,{requests:c.result.unexpectedExternal});check(`${name}:no-uncaught-JS`,!c.result.pageErrors.length,{errors:c.result.pageErrors});await c.context.close();}}
  }
  try {
    for(const [width,count] of [[1440,4],[1100,3],[800,2],[375,1],[320,1]]) await run(`layout-${width}`,{width},async c=>{
      const frame=await ready(c), prefix=`layout-${width}`;
      const activity=await c.page.evaluate(()=>({...window.__qaActivity,scrollY,active:document.activeElement.tagName}));
      check(`${prefix}:automatic-before-interaction`,activity.clicks===0&&activity.scrolls===0&&activity.scrollY===0&&activity.active==='BODY',activity);
      check(`${prefix}:no-activation-button`,await c.page.locator('[data-reviews-toggle]').count()===0&&await c.retry.isHidden());
      check(`${prefix}:five-cards-created-expected-visible`,await frame.locator('.review-card').count()===5&&(await indices(frame)).join(',')===Array.from({length:count},(_,i)=>i).join(','));
      const structure=await frame.evaluate(()=>({
        authors:[...document.querySelectorAll('.review-author-name')].map(n=>n.textContent),
        dates:[...document.querySelectorAll('time')].map(n=>n.dateTime),
        hidden:[...document.querySelectorAll('.review-card[hidden]')].every(n=>n.inert),
        cols:getComputedStyle(document.querySelector('.reviews-grid')).gridTemplateColumns.split(' ').length,
        google:document.querySelector('.google-maps-attribution')?.getAttribute('alt')||document.querySelector('.google-maps-attribution')?.textContent,
        googleLogoLoaded:document.querySelector('img.google-maps-attribution')?.naturalWidth>0,
        languages:[...document.querySelectorAll('.review-text')].map(n=>n.getAttribute('lang')),
        source:document.querySelector('.reviews-source-link')?.getAttribute('href'),
        providerCount:[...document.querySelectorAll('.reviews-providers a')].filter(a=>a.textContent==='Proveïdor de prova').length,
        injection:!!window.__qaXSS||!!document.querySelector('img[src="x"],script:not([src])'),
        unsafeLinks:[...document.querySelectorAll('a[href]')].some(a=>!a.href.startsWith('https:')||!a.relList.contains('noopener')),
        original:document.querySelector('.review-card .review-text').textContent.startsWith('SIMULACIÓ QA: aquest text llarg')
      }));
      check(`${prefix}:date-order-and-original-wording`,structure.dates.join(',')===['2026-05-01','2026-04-01','2026-03-01','2026-02-01','2026-01-01'].map(x=>x+'T10:00:00.000Z').join(',')&&structure.original,structure);
      check(`${prefix}:safe-data-and-attribution`,!structure.injection&&!structure.unsafeLinks&&structure.providerCount===1&&structure.google==='Google Maps'&&structure.googleLogoLoaded&&structure.source==='https://maps.google.com/?cid=TEST');
      check(`${prefix}:correct-review-language`,JSON.stringify(structure.languages)===JSON.stringify(['ca','ca-ES',null,null,null]));
      check(`${prefix}:hidden-inert-and-horizontal-grid`,structure.hidden&&structure.cols===count);
      check(`${prefix}:single-Places-query`,await frame.evaluate(()=>window.__qaSDK.imports.join(',')==='places'&&window.__qaSDK.fetches.length===1&&window.__qaSDK.fetches[0].includes('reviews')&&window.__qaSDK.place==='ChIJD2Lre4XhphIR8x2oRi6jTCE'));
      const request=c.result.sdkRequests[0];
      check(`${prefix}:stable-SDK-configuration`,c.result.sdkRequests.length===1&&request.inWidget&&request.parameters.v==='weekly'&&request.parameters.libraries==='places'&&request.parameters.language==='ca'&&request.parameters.region==='ES'&&request.parameters.loading==='async'&&request.parameters.callback==='edipReviewsReady');
      const child=await settledHeight(c,frame);
      const geometry=await c.page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,iframe:document.querySelector('[data-reviews-panel] iframe').getBoundingClientRect().width}));
      check(`${prefix}:no-page-or-frame-overflow`,geometry.scroll<=geometry.width&&child.scrollWidth<=child.width&&geometry.iframe>0,{geometry,child});
      check(`${prefix}:no-storage-before-click`,await noStorage(c,frame));
      const previous=frame.locator('[data-review-prev]'),next=frame.locator('[data-review-next]');
      check(`${prefix}:initial-navigation`,await previous.isDisabled()&&await next.isEnabled());
      const arrowGeometry=await frame.evaluate(()=>{
        const previous=document.querySelector('[data-review-prev]').getBoundingClientRect(),next=document.querySelector('[data-review-next]').getBoundingClientRect(),grid=document.querySelector('.reviews-grid').getBoundingClientRect();
        return {wide:innerWidth>=600,previous:{left:previous.left,right:previous.right,top:previous.top,bottom:previous.bottom},next:{left:next.left,right:next.right,top:next.top,bottom:next.bottom},grid:{left:grid.left,right:grid.right,top:grid.top,bottom:grid.bottom}};
      });
      check(`${prefix}:arrows-beside-cards-or-below-on-mobile`,arrowGeometry.wide?arrowGeometry.previous.right<=arrowGeometry.grid.left&&arrowGeometry.next.left>=arrowGeometry.grid.right&&arrowGeometry.previous.top>=arrowGeometry.grid.top&&arrowGeometry.next.bottom<=arrowGeometry.grid.bottom:arrowGeometry.previous.top>=arrowGeometry.grid.bottom&&arrowGeometry.next.top>=arrowGeometry.grid.bottom,arrowGeometry);
      await next.focus();await next.press('Enter');
      check(`${prefix}:keyboard-next-hides-first`,(await indices(frame)).join(',')===Array.from({length:count},(_,i)=>i+1).join(',')&&await frame.locator('.review-card[data-review-index="0"]').getAttribute('inert')!==null&&await previous.isEnabled());
      while(await next.isEnabled()) await next.click();
      check(`${prefix}:end-boundary`,await next.isDisabled()&&(await indices(frame)).at(-1)===4);
      await previous.focus();await previous.press('Space');
      check(`${prefix}:keyboard-previous`,await next.isEnabled());
      while(await previous.isEnabled()) await previous.click();
      check(`${prefix}:start-boundary-no-refetch`,await previous.isDisabled()&&await frame.evaluate(()=>window.__qaSDK.fetches.length===1)&&c.result.sdkRequests.length===1);
      check(`${prefix}:no-storage-after-navigation`,await noStorage(c,frame));
      await c.page.locator('[data-cookie-essential]').click();
      // Fixture screenshots are explicitly labelled and must never be presented as real customer reviews.
      // Hide only sticky page chrome in this isolated section capture, avoiding
      // overlays produced when Playwright scrolls a section taller than a viewport.
      await c.page.evaluate(()=>{
        document.activeElement?.blur();
        document.querySelectorAll('.site-header,.skip-link,.floating-actions,.whatsapp-float,.back-to-top').forEach(node=>{node.style.visibility='hidden';});
      });
      await c.section.screenshot({path:path.join(output,`reviews-${width}-MOCK.png`)});
    });

    await run('expansion-and-resize',{width:1440},async c=>{
      const frame=await ready(c),more=frame.locator('.review-card[data-review-index="0"] [data-review-expand]');
      await more.waitFor({state:'visible'});
      const before=(await settledHeight(c,frame)).height;
      await more.click();
      await c.page.waitForFunction(previous=>document.querySelector('[data-reviews-panel] iframe').getBoundingClientRect().height>previous+100,before);
      const expanded=(await settledHeight(c,frame)).height;
      check('expansion:full-text-increases-parent-height',expanded>before+100&&await more.getAttribute('aria-expanded')==='true',{before,expanded});
      await more.click();
      await c.page.waitForFunction(previous=>document.querySelector('[data-reviews-panel] iframe').getBoundingClientRect().height<previous-100,expanded);
      check('expansion:collapse-restores-height',Math.abs((await settledHeight(c,frame)).height-before)<=2&&await more.getAttribute('aria-expanded')==='false');
      await c.page.setViewportSize({width:375,height:960});
      await frame.waitForFunction(()=>document.querySelectorAll('.review-card:not([hidden])').length===1);
      const next=frame.locator('[data-review-next]');
      while(await next.isEnabled())await next.click();
      check('resize:last-mobile-card-visible',(await indices(frame)).join(',')==='4');
      await frame.locator('.review-card:visible a').first().focus();
      await c.page.setViewportSize({width:1440,height:960});
      await frame.waitForFunction(()=>document.querySelectorAll('.review-card:not([hidden])').length===4);
      check('resize:clamped-to-full-last-window',(await indices(frame)).join(',')==='1,2,3,4'&&await next.isDisabled()&&await frame.evaluate(()=>!document.activeElement.closest('[hidden]')));
      await settledHeight(c,frame);
      check('resize:no-refetch',await frame.evaluate(()=>window.__qaSDK.fetches.length===1)&&c.result.sdkRequests.length===1);
    });

    await run('spoofed-messages',{mode:'hold'},async c=>{
      await c.iframe.waitFor();
      const frame=await(await c.iframe.elementHandle()).contentFrame();
      await frame.waitForFunction(()=>window.__qaSDK?.fetches.length===1);
      const before=await c.status.textContent();
      await c.page.evaluate(()=>{
        const child=document.querySelector('[data-reviews-panel] iframe').contentWindow;
        for(const state of ['ready','error','resize']){
          const data={type:'edip-google-reviews',state,height:5999};
          dispatchEvent(new MessageEvent('message',{origin:'https://untrusted.invalid',source:child,data}));
          dispatchEvent(new MessageEvent('message',{origin:location.origin,source:window,data}));
        }
        for(const height of [-1,0,119,6001,'999',NaN,Infinity])dispatchEvent(new MessageEvent('message',{origin:location.origin,source:child,data:{type:'edip-google-reviews',state:'resize',height}}));
        dispatchEvent(new MessageEvent('message',{origin:location.origin,source:child,data:{type:'wrong-type',state:'error'}}));
      });
      check('messages:reject-origin-source-type-invalid-height',await c.status.textContent()===before&&await c.retry.isHidden()&&await c.iframe.count()===1&&Number(await c.iframe.getAttribute('height'))!==5999);
      await frame.evaluate(()=>parent.postMessage({type:'edip-google-reviews',state:'resize',height:444},location.origin));
      await c.page.waitForFunction(()=>document.querySelector('[data-reviews-panel] iframe').height==='444');
      check('messages:valid-child-resize-accepted',await c.iframe.getAttribute('height')==='444');
    });

    await run('empty-result',{mode:'empty'},async c=>{
      const frame=await ready(c,'empty');
      check('empty:no-cards-but-Google-attribution',await frame.locator('.review-card').count()===0&&await frame.locator('.google-maps-attribution').isVisible()&&await frame.locator('.reviews-source-link').isVisible());
      check('empty:honest-status-no-retry',/no hi ha ressenyes/.test(await c.status.textContent())&&await c.retry.isHidden()&&await c.iframe.count()===1);
      await settledHeight(c,frame);
    });
    for(const code of ['UNAVAILABLE','INTERNAL','DEADLINE_EXCEEDED'])await run(`transient-${code}`,{mode:`transient-${code}`},async c=>{
      const frame=await ready(c);
      check(`transient-${code}:one-automatic-retry-recovers`,await c.page.evaluate(()=>window.__qaActivity.clicks===0&&window.__qaFixtureFetches===2)&&await frame.evaluate(()=>window.__qaSDK.fetches.length===2)&&c.result.sdkRequests.length===1&&await c.retry.isHidden());
    });
    for(const [mode,expected] of [['persistent-transient',2],['permission-denied',1],['quota-error',1]])await run(mode,{mode},async c=>{
      await c.retry.waitFor({state:'visible'});
      check(`${mode}:bounded-attempts-and-fallback`,await c.page.evaluate(expected=>window.__qaFixtureFetches===expected&&window.__qaActivity.clicks===0,expected)&&c.result.sdkRequests.length===1&&await c.iframe.count()===0&&await c.placeholder.isVisible());
    });
    for(const mode of ['network-error','auth-error','places-error','hold'])await run(`error-${mode}`,{mode,fastTimeout:mode==='hold'},async c=>{
      await c.retry.waitFor({state:'visible'});
      check(`${mode}:automatic-honest-error`,await c.page.evaluate(()=>window.__qaActivity.clicks===0)&&/no podem carregar/.test(await c.status.textContent())&&await c.iframe.count()===0&&await c.placeholder.isVisible()&&await c.panel.isHidden());
      c.setMode('success');await c.retry.focus();await c.retry.press('Enter');
      const frame=await ready(c);
      check(`${mode}:keyboard-retry-recovers-once`,await c.retry.isHidden()&&await c.iframe.count()===1&&c.result.sdkRequests.length===2&&await frame.locator('.review-card').count()===5);
      check(`${mode}:no-storage`,await noStorage(c,frame));
    });
    for(const [name,options] of [['empty-config',{empty:true}],['invalid-key',{invalidKey:'not a key'}],['invalid-place',{invalidPlace:'"><script>alert(1)</script>'}],['no-JavaScript',{noJS:true}]])await run(name,options,async c=>{
      check(`${name}:no-request-and-direct-link-remains`,c.result.external.length===0&&await c.iframe.count()===0&&await c.retry.isHidden()&&await c.placeholder.isVisible()&&await c.section.locator('[data-site-href="maps_reviews"]').isVisible());
    });
    await run('direct-widget',{},async c=>{
      const requestsBefore=c.result.sdkRequests.length;
      await c.page.goto(`${base}/assets/widgets/google-reviews.html`,{waitUntil:'networkidle'});
      check('direct-widget:no-extra-Google-request',c.result.sdkRequests.length===requestsBefore&&await c.page.locator('.review-card').count()===0&&/pàgina d’inici/.test(await c.page.locator('#reviews-message').textContent()));
    });
  } finally {
    await browser.close();
    report.passed=report.checks.filter(c=>c.pass).length;
    report.failed=report.checks.filter(c=>!c.pass).length+report.errors.length;
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({passed:report.passed,failed:report.failed,errors:report.errors,failedChecks:report.checks.filter(c=>!c.pass),report:path.join(output,'report.json')},null,2));
    process.exitCode=report.failed?1:0;
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
