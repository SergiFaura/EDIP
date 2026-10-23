/* Live map verification. Visits Contacte only: never reads review API keys. */
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Administrador/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.argv[2]||'http://127.0.0.1:8000',out=process.argv[3]||'qa/map-auto-live';
const expected=JSON.parse(fs.readFileSync(path.join(__dirname,'../maintenance/site-data.json'),'utf8')).maps_embed;
const report={generated:new Date().toISOString(),cases:[],errors:[]};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  for(const width of [375,1440]){
   const page=await browser.newPage({viewport:{width,height:950},reducedMotion:'reduce'});
   const entry={width,embedStatuses:[],pageErrors:[]};report.cases.push(entry);
   page.on('pageerror',e=>entry.pageErrors.push(e.message));
   page.on('response',r=>{if(r.url()===expected)entry.embedStatuses.push(r.status());});
   await page.addInitScript(()=>{window.__interactions=0;addEventListener('click',()=>window.__interactions++,true);addEventListener('scroll',()=>window.__interactions++,true);});
   const embedLoaded=page.waitForResponse(r=>r.url()===expected&&r.status()===200,{timeout:25000});
   await page.goto(base+'/contacte.html',{waitUntil:'domcontentloaded'});
   const iframe=page.locator('[data-map-canvas] iframe');
   await iframe.waitFor({state:'attached'});
   await embedLoaded;
   entry.loadedBeforeInteraction=await page.evaluate(()=>window.__interactions===0&&scrollY===0);
   // Google defers internal map tiles/controls until its iframe is on screen.
   // Confirm automatic document loading first, then expose the map to inspect it.
   await page.locator('[data-google-map]').scrollIntoViewIfNeeded();
   const frame=await(await iframe.elementHandle()).contentFrame();
   await frame.locator('a[href*="cid=2399472120630877683"]').first().waitFor({state:'attached',timeout:25000});
   await frame.waitForFunction(()=>[...document.images].some(i=>i.complete&&i.naturalWidth>200),null,{timeout:25000});
   entry.officialUrl=await iframe.getAttribute('src')===expected;
   entry.correctPlace=true;
   entry.noToggle=await page.locator('[data-map-toggle]').count()===0;
   entry.noOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
   await page.locator('[data-google-map]').scrollIntoViewIfNeeded();
   await page.waitForTimeout(500);
   fs.mkdirSync(out,{recursive:true});
   await page.locator('[data-google-map]').screenshot({path:path.join(out,`map-${width}-REAL.png`)});
   entry.passed=entry.embedStatuses.includes(200)&&entry.loadedBeforeInteraction&&entry.officialUrl&&entry.correctPlace&&entry.noToggle&&entry.noOverflow&&entry.pageErrors.length===0;
   await page.close();
  }
 }catch(e){report.errors.push(e.message);}
 finally{
  await browser.close();report.passed=report.cases.length===2&&report.cases.every(c=>c.passed)&&report.errors.length===0;
  fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
 }
})();
