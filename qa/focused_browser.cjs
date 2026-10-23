/* Focused visual, keyboard and local performance evidence; no mail is sent. */
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('C:/Users/Administrador/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.argv[2]||'http://127.0.0.1:8000';
const output=process.argv[3]||path.join(__dirname,'focused-final');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const report={pages:[],checks:[],errors:[],note:'Local unthrottled Chrome observations, not field Core Web Vitals or production results.'};
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.addInitScript(()=>{
   window.__qaPerf={cls:0,lcp:0};
   let start=0,last=0,total=0;
   new PerformanceObserver(list=>list.getEntries().forEach(e=>{if(!e.hadRecentInput){if(e.startTime-last>1000||e.startTime-start>5000){start=e.startTime;total=0;}total+=e.value;last=e.startTime;window.__qaPerf.cls=Math.max(window.__qaPerf.cls,total);}})).observe({type:'layout-shift',buffered:true});
   new PerformanceObserver(list=>{for(const e of list.getEntries())window.__qaPerf.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
  });
  const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  for(const name of ['index.html','serveis.html','equip.html','contacte.html','centre.html']){
   await p.goto(`${base}/${name}`,{waitUntil:'networkidle'});await p.waitForTimeout(1000);
   report.pages.push({name,...await p.evaluate(()=>({...window.__qaPerf,images:[...document.images].filter(i=>i.getAttribute('loading')!=='lazy').every(i=>i.complete&&i.naturalWidth>0),transferBytes:performance.getEntriesByType('resource').reduce((sum,r)=>sum+r.transferSize,0)}))});
   if(await p.locator('[data-cookie-essential]').isVisible())await p.locator('[data-cookie-essential]').click();
   if(name==='index.html'){
    for(const selector of ['.finder','.google-reviews']){await p.locator(selector).scrollIntoViewIfNeeded();await p.waitForTimeout(750);await p.locator(selector).screenshot({path:path.join(output,selector.slice(1)+'-1440.png')});}
    await p.locator('.faq-list summary').first().focus();await p.keyboard.press('Enter');
    report.checks.push({name:'faq-keyboard-open',pass:await p.locator('.faq-list details').first().evaluate(e=>e.open)});
    await p.keyboard.press('Enter');report.checks.push({name:'faq-keyboard-close',pass:!await p.locator('.faq-list details').first().evaluate(e=>e.open)});
   }
   if(name==='contacte.html'){
    for(const width of [1440,375,320]){await p.setViewportSize({width,height:900});await p.locator('.contact-form').scrollIntoViewIfNeeded();await p.waitForTimeout(750);await p.locator('.contact-form').screenshot({path:path.join(output,`form-${width}.png`)});}
    await p.locator('footer [data-open-cookie-settings]').click();await p.locator('[data-cookie-dialog]').screenshot({path:path.join(output,'privacy-320.png')});await p.keyboard.press('Escape');
    await p.locator('[data-menu-toggle]').click();
    const menuBounds=await p.locator('[data-mobile-menu]').boundingBox();
    report.checks.push({name:'mobile-menu-full-height-after-scroll',pass:menuBounds.height>700,bounds:menuBounds});
    await p.locator('[data-mobile-menu]').screenshot({path:path.join(output,'menu-320.png')});await p.keyboard.press('Escape');
    await p.setViewportSize({width:1440,height:900});
   }
  }
  await p.setViewportSize({width:320,height:900});await p.goto(`${base}/serveis.html`,{waitUntil:'networkidle'});await p.waitForTimeout(750);
  report.checks.push({name:'services-320-overflow-fixed',pass:await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)});
  await p.screenshot({path:path.join(output,'services-320.png')});
  await context.close();
 }catch(e){report.errors.push(e.stack);}
 finally{await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report,null,2));process.exitCode=report.errors.length||report.checks.some(c=>!c.pass)?1:0;
})();
