/* Local browser regression checks; no npm install or project dependency required.
 * NODE browser_qa.cjs BASE_URL OUTPUT_DIR [--baseline] [--site ROOT]
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Administrador/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const args=process.argv.slice(2), base=args[0]||'http://127.0.0.1:8000', output=args[1]||path.join(__dirname,'browser-final');
const baseline=args.includes('--baseline');
const siteArg=args.indexOf('--site');
const site=siteArg<0?null:args[siteArg+1];
const selected=args.indexOf('--pages');
const pages=selected>=0?args[selected+1].split(','):site?fs.readdirSync(site).filter(x=>x.endsWith('.html')):['index.html','serveis.html','equip.html','contacte.html','centre.html','psicologia-adults.html','psicologia-infantil-juvenil.html','pedagogia-reeducacions.html','logopedia.html','parella-familia.html','tallers-formacions.html','metode.html','preguntes-frequents.html','avis-legal.html','privacitat.html','cookies.html','404.html'];
const visual=['index.html','serveis.html','equip.html','contacte.html','centre.html','psicologia-adults.html','psicologia-infantil-juvenil.html','pedagogia-reeducacions.html','logopedia.html','parella-familia.html','tallers-formacions.html','metode.html'];
const widths=baseline?[375,1440]:[320,375,768,1024,1440];
const report={base,baseline,generated:new Date().toISOString(),scope:{reviews:'Configuration intercepted as empty; no real API key is read or sent.',map:'Official embed request intercepted with a labelled local test fixture; real Google rendering is outside this regression suite.'},pages:[],checks:[],errors:[]};
fs.mkdirSync(output,{recursive:true});
const check=(name,pass,detail)=>report.checks.push({name,pass,...detail});
const mapRequest=url=>{const parsed=new URL(url);return parsed.origin==='https://www.google.com'&&parsed.pathname==='/maps/embed';};
const safeUrl=url=>{const parsed=new URL(url);return parsed.origin+parsed.pathname;};
const safeText=value=>String(value).replace(/AIza[\w-]+/g,'[REDACTED]');
async function isolateExternal(context){
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin===new URL(base).origin){
   if(url.pathname.endsWith('/assets/js/google-reviews-config.js'))return route.fulfill({contentType:'application/javascript',body:'window.EDIP_GOOGLE_REVIEWS=Object.freeze({apiKey:"",placeId:""});'});
   return route.continue();
  }
  if(mapRequest(url.href))return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="ca"><meta charset="utf-8"><title>Mapa simulat per QA</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#eee9e1;font:16px sans-serif;color:#302622"><p>Mapa de Google · resposta simulada per QA</p></body></html>'});
  return route.abort('blockedbyclient');
 });
}
async function scrollAll(page){
 await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}});
 // Lazy images can be scheduled after a fast scroll. Give each pending image a
 // real viewport exposure before judging it broken; never force loading=eager.
 for(const img of await page.locator('img').all()){
  if(!await img.evaluate(e=>e.complete)){
   await img.scrollIntoViewIfNeeded();
   await page.waitForFunction(e=>e.complete,await img.elementHandle(),{timeout:10000});
  }
 }
 await page.evaluate(()=>window.scrollTo(0,0));await page.waitForLoadState('networkidle');await page.waitForTimeout(750);
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const context=await browser.newContext({reducedMotion:'reduce'});
  await isolateExternal(context);
  for(const width of widths){
   const page=await context.newPage(); await page.setViewportSize({width,height:900});
   for(const name of baseline?visual:pages){
    const errors=[],network=[],external=[];
    const expectedMap=[];
    const onError=e=>errors.push(safeText(e.message));
    const onConsole=m=>{if(m.type()==='error')errors.push(safeText(m.text()));};
    const onResponse=r=>{if(r.status()>=400)network.push({url:safeUrl(r.url()),status:r.status()});};
    const onRequest=r=>{if(new URL(r.url()).origin!==new URL(base).origin){if(mapRequest(r.url()))expectedMap.push(safeUrl(r.url()));else external.push(safeUrl(r.url()));}};
    page.on('pageerror',onError);page.on('console',onConsole);page.on('response',onResponse);page.on('request',onRequest);
    const response=await page.goto(`${base}/${name}`,{waitUntil:'networkidle'});
    await scrollAll(page);
    const metrics=await page.evaluate(()=>{
     const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
     const bad=[...document.querySelectorAll('body *')].filter(e=>visible(e)&&!e.closest('[hidden]')).map(e=>({tag:e.tagName,class:e.className,text:(e.textContent||'').slice(0,80),left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right})).filter(e=>e.left<-.5||e.right>innerWidth+.5).slice(0,20);
     const broken=[...document.images].filter(e=>!e.complete||e.naturalWidth===0).map(e=>e.src);
     const nav=[...document.querySelectorAll('header a')].filter(visible).map(e=>({text:e.textContent.trim(),href:e.getAttribute('href')}));
     const headings=[...document.querySelectorAll('h1')].map(e=>({text:e.textContent,visible:visible(e)}));
     return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,outside:bad,broken,nav,headings};
    });
    report.pages.push({name,width,status:response.status(),...metrics,errors,network,external,expectedMap});
    if(visual.includes(name)&&(width===375||width===1440)){
     // Keep consent visible in first screenshot; then dismiss for complete content comparison.
     await page.screenshot({path:path.join(output,`${name.replace('.html','')}-${width}-initial.png`),fullPage:false});
     const dismiss=page.locator('[data-cookie-essential]');if(await dismiss.isVisible())await dismiss.click();
     await page.screenshot({path:path.join(output,`${name.replace('.html','')}-${width}.png`),fullPage:true});
    }
    page.off('pageerror',onError);page.off('console',onConsole);page.off('response',onResponse);page.off('request',onRequest);
   }
   await page.close();
  }
  await context.close();
  if(!baseline){
   const context=await browser.newContext({viewport:{width:375,height:900},reducedMotion:'reduce'});
   await isolateExternal(context);
   const page=await context.newPage();
   const interactionErrors=[];
   page.on('pageerror',e=>interactionErrors.push(safeText(e.message)));
   page.on('console',m=>{if(m.type()==='error')interactionErrors.push(safeText(m.text()));});
   await page.goto(`${base}/index.html`);
   if(await page.locator('[data-cookie-essential]').isVisible())await page.locator('[data-cookie-essential]').click();
   const toggle=page.locator('[data-menu-toggle]');await toggle.focus();await page.keyboard.press('Enter');
   check('mobile-menu-keyboard-open',await toggle.getAttribute('aria-expanded')==='true',{});
   check('mobile-faq-link',await page.locator('[data-mobile-menu] a[href="preguntes-frequents.html"]').isVisible(),{});
   check('mobile-menu-focus-enters',await page.locator('[data-mobile-menu] a').first().evaluate(e=>e===document.activeElement),{});
   await page.locator('[data-mobile-menu] a').last().focus();await page.keyboard.press('Tab');
   check('mobile-menu-tab-wrap',await toggle.evaluate(e=>e===document.activeElement),{});
   await page.keyboard.press('Escape');
   check('mobile-menu-escape',await toggle.getAttribute('aria-expanded')==='false'&&await page.locator('[data-mobile-menu]').isHidden(),{});
   check('mobile-menu-focus-restored',await toggle.evaluate(e=>e===document.activeElement),{});
   await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await toggle.click();
   const menuBounds=await page.locator('[data-mobile-menu]').boundingBox();
   check('mobile-menu-full-height-after-scroll',menuBounds.height>700,{bounds:menuBounds});
   await page.keyboard.press('Escape');
   await page.goto(`${base}/contacte.html`);
   await page.locator('[data-contact-form] button[type="submit"]').click();
   check('form-required-validation',await page.locator('#name').evaluate(e=>!e.validity.valid),{});
   // Only instrument the navigation sink in the served JS; all form encoding executes unchanged.
   let intercepted=false;
   await page.route('**/assets/js/main.js',async route=>{
    const response=await route.fetch();let source=await response.text();
    const re=/window\.location\.href\s*=\s*([^;]+);/g;
    source=source.replace(re,(all,rhs)=>{intercepted=true;return `window.__qaMailto = ${rhs};`;});
    await route.fulfill({response,body:source});
   });
   await page.reload();
   const storageBefore=await page.evaluate(()=>JSON.stringify({...localStorage}));
   await page.locator('#name').fill('Àngels & Júlia ? # <script>alert(1)</script>');
   await page.locator('#email').fill('incorrecte');
   await page.locator('[data-contact-form] button[type="submit"]').click();
   check('form-email-validation',await page.locator('#email').evaluate(e=>e.validity.typeMismatch),{});
   await page.locator('#email').fill('angels+qa@example.test');
   await page.locator('#phone').fill('+34 612 345 678');
   await page.locator('#availability').fill('Dilluns & dijous, 17 h');
   await page.locator('#message').fill('Consulta: "àèíòú" & <img src=x onerror=alert(1)> ? #');
   await page.locator('[data-contact-form] button[type="submit"]').click();
   check('form-consent-required',await page.locator('[data-contact-form] input[type="checkbox"]').evaluate(e=>!e.validity.valid),{});
   await page.locator('[data-contact-form] input[type="checkbox"]').check();
   for(const service of ['Teràpia de parella','Teràpia familiar']){
    await page.evaluate(()=>window.__qaMailto=null);
    await page.locator('#service').selectOption({label:service});
    await page.locator('[data-contact-form] button[type="submit"]').click();
    const mailto=await page.evaluate(()=>window.__qaMailto||null),status=await page.locator('[data-form-status]').textContent();
    let valid=false,body='',subject='';
    if(mailto){const url=new URL(mailto);body=url.searchParams.get('body');subject=url.searchParams.get('subject');valid=url.protocol==='mailto:'&&body.includes(service)&&body.includes('Àngels & Júlia ? # <script>')&&body.includes('<img src=x onerror=alert(1)>')&&subject.includes('Àngels & Júlia');}
    check(`mailto-${service}`,intercepted&&valid&&status.includes('encara no s’ha enviat'),{status,recipient:mailto?new URL(mailto).pathname:null,encoded:!!mailto});
   }
   check('form-does-not-store-personal-data',storageBefore===await page.evaluate(()=>JSON.stringify({...localStorage})),{});
   check('interactions-no-console-errors',interactionErrors.length===0,{errors:interactionErrors});
   await context.close();
   for(const mode of ['fresh','malformed','denied','untrusted']){
    const c=await browser.newContext({viewport:{width:375,height:900},reducedMotion:'reduce'});await isolateExternal(c);const p=await c.newPage();const errors=[],failedRequests=[];p.on('pageerror',e=>errors.push(safeText(e.message)));
    p.on('console',m=>{if(m.type()==='error')errors.push(safeText(m.text()));});
    p.on('requestfailed',request=>failedRequests.push({url:safeUrl(request.url()),error:safeText(request.failure()?.errorText||'Unknown request failure')}));
    await c.addInitScript(mode=>{if(mode==='malformed')localStorage.setItem('edip-cookie-consent-v1','{invalid');if(mode==='denied')Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked by browser','SecurityError');}});if(mode==='untrusted')localStorage.setItem('edip-cookie-consent-v1',JSON.stringify({essential:true,analytics:true,payload:'<img src=x onerror=alert(1)>'}));},mode);
    await p.goto(`${base}/index.html`);
    const banner=await p.locator('[data-cookie-banner]').isVisible();
    if(await p.locator('[data-cookie-essential]').isVisible())await p.locator('[data-cookie-essential]').click();
    const settings=p.locator('footer [data-open-cookie-settings]');
    await settings.click();
    const dialog=await p.locator('[data-cookie-dialog]').isVisible();
    const analytics=p.locator('[data-analytics-consent]');
    check(`cookies-no-analytics-${mode}`,await analytics.isDisabled()&&!await analytics.isChecked(),{});
    await p.keyboard.press('Escape');
    check(`cookies-escape-${mode}`,await p.locator('[data-cookie-dialog]').isHidden(),{});
    await settings.click();await p.locator('.dialog-close').click();
    check(`cookies-close-${mode}`,await p.locator('[data-cookie-dialog]').isHidden(),{});
    await settings.click();await p.locator('[data-save-cookie-settings]').focus();await p.keyboard.press('Enter');
    const closed=await p.locator('[data-cookie-dialog]').isHidden();
    const stored=mode==='denied'?null:await p.evaluate(()=>JSON.parse(localStorage.getItem('edip-cookie-consent-v1')));
    check(`cookies-${mode}`,errors.length===0&&failedRequests.length===0&&banner===(mode!=='untrusted')&&dialog&&closed&&(mode==='denied'||JSON.stringify(stored)==='{"essential":true,"analytics":false}'),{errors,failedRequests,banner,dialog,closed,stored});
    await c.close();
   }
   const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:900}});await isolateExternal(nojs);const np=await nojs.newPage();
   for(const name of visual){
    await np.goto(`${base}/${name}`);
    const h1=await np.locator('h1').isVisible();
    const nav=await np.locator('header a[href="serveis.html"]').all();let visibleNav=false;for(const a of nav)if(await a.isVisible())visibleNav=true;
    check(`no-js-${name}`,h1&&visibleNav,{h1,visibleNav});
   }
   await nojs.close();
  }
 }catch(e){report.errors.push(safeText(e.stack));}
 finally{await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));}
 const failures=report.pages.filter(p=>p.status!==200||p.overflow||p.broken.length||p.errors.length||p.network.length||p.external.length);
 const failedChecks=report.checks.filter(x=>!x.pass);
 console.log(JSON.stringify({output,pages:report.pages.length,failures:failures.map(x=>({name:x.name,width:x.width,overflow:x.overflow,broken:x.broken,errors:x.errors,network:x.network})),failedChecks,errors:report.errors},null,2));
 process.exitCode=failures.length||failedChecks.length||report.errors.length?1:0;
})();
