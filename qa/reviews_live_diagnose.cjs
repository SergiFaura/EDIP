/* Live local-site diagnosis. Uses the configured browser key only with Google.
 * Saves sanitized technical diagnostics, never keys or review bodies.
 */
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('C:/Users/Administrador/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.argv[2] || 'http://127.0.0.1:8000';
const output = process.argv[3] || 'qa/reviews-live-diagnosis.json';
const config = fs.readFileSync(path.join(__dirname,'../edip_site/assets/js/google-reviews-config.js'),'utf8');
const secret = config.match(/apiKey:\s*(['"])(.*?)\1/s)?.[2] || '';
const clean = value => {
  let s=String(value);
  if(secret) s=s.split(secret).join('[REDACTED]');
  return s.replace(/AIza[A-Za-z0-9_-]+/g,'[REDACTED]').replace(/([?&]key=)[^&\s"<>]+/g,'$1[REDACTED]');
};
const safeUrl = value => {const u=new URL(value);return u.origin+(u.hostname.endsWith('googleusercontent.com')?'/[author-photo]':u.pathname);};
const report={generated:new Date().toISOString(),console:[],failedRequests:[],responses:[],errors:[]};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const pending=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')report.console.push(clean(m.text()));});
  page.on('pageerror',e=>report.errors.push(clean(e.message)));
  page.on('requestfailed',r=>report.failedRequests.push({url:safeUrl(r.url()),error:r.failure()?.errorText}));
  page.on('response',r=>{
   if(new URL(r.url()).origin===new URL(base).origin)return;
   const item={url:safeUrl(r.url()),status:r.status()};report.responses.push(item);
   if(r.status()>=400)pending.push(r.text().then(body=>{item.error=clean(body).slice(0,2500);}).catch(()=>{}));
  });
  await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(22000);
  report.page=await page.evaluate(()=>({status:document.querySelector('[data-reviews-status]')?.textContent,iframes:document.querySelectorAll('[data-reviews-panel] iframe').length,retryVisible:!!document.querySelector('[data-reviews-retry]')&&!document.querySelector('[data-reviews-retry]').hidden}));
  const frame=page.frames().find(f=>f.url().includes('/assets/widgets/google-reviews.html'));
  if(frame) {
   report.widget=await frame.evaluate(()=>({message:document.querySelector('#reviews-message')?.textContent,messageHidden:document.querySelector('#reviews-message')?.hidden,state:document.querySelector('#reviews-content')?.dataset.reviewsState,cards:document.querySelectorAll('.review-card').length,advancedComponent:!!document.querySelector('gmp-advanced-place-details'),placeClass:typeof window.google?.maps?.places?.Place}));
   if(report.widget.state==='ready') {
    report.layouts=[];
    const capture=async label=>{
     const layout=await frame.evaluate(()=>({
      width:innerWidth,height:innerHeight,bodyHeight:Math.ceil(document.body.getBoundingClientRect().height),
      overflow:document.documentElement.scrollWidth>innerWidth+1,
      visible:[...document.querySelectorAll('.review-card:not([hidden])')].map(n=>Number(n.dataset.reviewIndex)),
      previousDisabled:document.querySelector('[data-review-prev]').disabled,nextDisabled:document.querySelector('[data-review-next]').disabled
     }));
     report.layouts.push({label,...layout});
    };
    await capture('desktop');
    if(!await frame.locator('[data-review-next]').isDisabled()){
     await frame.locator('[data-review-next]').click();
     await page.waitForTimeout(250);
     await capture('desktop-next');
    }
    await page.setViewportSize({width:375,height:900});
    await page.waitForTimeout(350);
    await capture('mobile');
    if(!await frame.locator('[data-review-prev]').isDisabled()){
     await frame.locator('[data-review-prev]').click();
     await page.waitForTimeout(250);
     await capture('mobile-previous');
    }
   }
  }
  await Promise.allSettled(pending);
 }catch(e){report.errors.push(clean(e.message));}
 finally{
  report.passed=report.widget?.state==='ready'&&report.widget.cards>0
   &&report.responses.some(r=>r.url.endsWith('/GetPlace')&&r.status===200)
   &&report.errors.length===0
   &&report.layouts?.every(layout=>!layout.overflow&&layout.bodyHeight<=layout.height+1);
  await browser.close();
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output,clean(JSON.stringify(report,null,2)));
  console.log(clean(JSON.stringify(report,null,2)));
  process.exitCode=report.passed?0:1;
 }
})();
