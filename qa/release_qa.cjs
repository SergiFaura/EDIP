/* Focused release checks for home copy, service copy, team layout and automatic map.
 * NODE qa/release_qa.cjs BASE_URL OUTPUT_DIR
 * Reviews are disabled by an in-memory route fixture; the actual API key is never read.
 * The map URL is requested normally, but its response is a labelled local fixture.
 */
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('C:/Users/Administrador/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.argv[2] || 'http://127.0.0.1:8000';
const output = process.argv[3] || path.join(__dirname, 'browser-release');
const expectedMap = JSON.parse(fs.readFileSync(path.join(__dirname, '../maintenance/site-data.json'), 'utf8')).maps_embed;
const report = {generated:new Date().toISOString(), scope:{reviews:'Empty configuration fixture; actual API key not read.', map:'Automatic embedding and layout verified using a labelled response fixture. This suite does not claim a live Google render.'}, checks:[], errors:[]};
const check = (name, pass, detail={}) => report.checks.push({name, pass, ...detail});
const safeText = value => String(value).replace(/AIza[\w-]+/g, '[REDACTED]');
const safeUrl = value => { const url = new URL(value); return url.origin + url.pathname; };
const isMap = value => { const url = new URL(value); return url.origin === 'https://www.google.com' && url.pathname === '/maps/embed'; };
fs.mkdirSync(output, {recursive:true});

async function prepare(context) {
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(base).origin) {
      if (url.pathname.endsWith('/assets/js/google-reviews-config.js')) return route.fulfill({contentType:'application/javascript', body:'window.EDIP_GOOGLE_REVIEWS=Object.freeze({apiKey:"",placeId:""});'});
      return route.continue();
    }
    if (isMap(url.href)) return route.fulfill({contentType:'text/html', body:'<!doctype html><html lang="ca"><meta charset="utf-8"><title>Mapa simulat per QA</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#eee9e1;font:16px sans-serif;color:#302622"><p>Mapa de Google · resposta simulada per QA</p></body></html>'});
    return route.abort('blockedbyclient');
  });
}

async function prepareScreenshot(page) {
  const dismiss = page.locator('[data-cookie-essential]');
  if (await dismiss.isVisible()) await dismiss.click();
  await page.evaluate(async () => {
    for (let y=0; y<document.body.scrollHeight; y+=600) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 35));
    }
  });
  for (const image of await page.locator('img').all()) {
    if (!await image.evaluate(element => element.complete)) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(element => new Promise(resolve => { if (element.complete) return resolve(); element.addEventListener('load', resolve, {once:true}); element.addEventListener('error', resolve, {once:true}); }));
    }
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
}

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try {
    for (const width of [320,375,768,1440]) {
      const context = await browser.newContext({viewport:{width,height:900}, reducedMotion:'reduce'});
      await prepare(context);
      const page = await context.newPage();
      const errors = [], unexpected = [], maps = [];
      page.on('pageerror', error => errors.push(safeText(error.message)));
      page.on('console', message => { if (message.type()==='error') errors.push(safeText(message.text())); });
      page.on('request', request => {
        if (isMap(request.url())) maps.push({expected:request.url()===expectedMap});
        else if (new URL(request.url()).origin!==new URL(base).origin) unexpected.push(safeUrl(request.url()));
      });
      await page.goto(`${base}/index.html`, {waitUntil:'networkidle'});
      const visit = page.locator('.process-step').filter({has:page.getByRole('heading', {name:'Primera visita', exact:true})});
      check(`home-first-visit-no-price-or-badge-${width}`, await visit.count()===1 && !/€/.test(await visit.innerText()) && await visit.locator('.price-pill').count()===0);
      const family = await page.locator('main summary').allTextContents();
      check(`home-family-question-includes-adolescents-${width}`, family.some(text=>/família/i.test(text) && /infant/i.test(text) && /adolescent/i.test(text)), {question:family.find(text=>/família/i.test(text))});
      check(`home-responsive-${width}`, await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await prepareScreenshot(page);
      await page.screenshot({path:path.join(output,`index-${width}.png`),fullPage:true});

      await page.goto(`${base}/equip.html`, {waitUntil:'networkidle'});
      const team = await page.evaluate(() => {
        const background = element => { while (element) { const color = getComputedStyle(element).backgroundColor; if (color!=='rgba(0, 0, 0, 0)' && color!=='transparent') return color; element=element.parentElement; } return 'transparent'; };
        return ['judith-faura','ester','maria','teresa'].map(id => {
          const section = document.getElementById(id), list=section.querySelector('.credentials'), name=section.querySelector('.profile-name');
          return {id, count:list.querySelectorAll('li').length, sectionBackground:background(section), trainingBackground:background(list), nameBackground:background(name), containsTraining:section.contains(list), listClass:list.className};
        });
      });
      check(`team-preserves-all-36-credentials-${width}`, JSON.stringify(team.map(member=>member.count))==='[9,11,7,9]', {team});
      check(`judith-training-shares-profile-background-${width}`, team[0].containsTraining && team[0].trainingBackground===team[0].nameBackground && team.every(member=>member.listClass===team[0].listClass));
      check(`team-alternating-backgrounds-${width}`, team[0].sectionBackground===team[2].sectionBackground && team[1].sectionBackground===team[3].sectionBackground && team[0].sectionBackground!==team[1].sectionBackground);
      check(`team-responsive-${width}`, await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await prepareScreenshot(page);
      await page.screenshot({path:path.join(output,`equip-${width}.png`),fullPage:true});

      const before = maps.length;
      await page.goto(`${base}/contacte.html`, {waitUntil:'networkidle'});
      // No scrolling, clicking, consent interaction or script injection before this assertion.
      const map = page.locator('iframe[data-site-src="maps_embed"]');
      check(`map-loads-before-interaction-${width}`, maps.length===before+1 && maps.at(-1).expected && await map.count()===1 && await map.getAttribute('src')===expectedMap);
      check(`map-has-no-activation-button-${width}`, await page.locator('[data-map-toggle]').count()===0 && await map.isVisible());
      const address = await page.locator('.contact-item strong').filter({hasText:/^Adreça$/}).evaluate(element => {
        const range=document.createRange(); range.selectNodeContents(element); const rows=[...range.getClientRects()].map(rect=>Math.round(rect.top));
        return {text:element.textContent, lines:new Set(rows).size, width:element.getBoundingClientRect().width};
      });
      check(`address-label-unbroken-${width}`, address.text==='Adreça' && address.lines===1, {address});
      check(`contact-responsive-${width}`, await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await prepareScreenshot(page);
      await page.screenshot({path:path.join(output,`contacte-${width}.png`),fullPage:true});
      await map.screenshot({path:path.join(output,`map-fixture-${width}.png`)});
      check(`pages-no-console-or-unexpected-network-errors-${width}`, errors.length===0 && unexpected.length===0, {errors, unexpected});
      await context.close();
    }

    const context=await browser.newContext({viewport:{width:1440,height:900}, reducedMotion:'reduce'});
    await prepare(context);
    const page=await context.newPage();
    await page.goto(`${base}/preguntes-frequents.html`,{waitUntil:'networkidle'});
    const faq=await page.evaluate(()=>{
      const visible=[...document.querySelectorAll('main details')].map(element=>({question:element.querySelector('summary').textContent.trim(),answer:element.querySelector('div').textContent.trim()}));
      const scripts=[...document.querySelectorAll('script[type="application/ld+json"]')].map(element=>JSON.parse(element.textContent));
      const schemas=scripts.flatMap(item=>item['@graph']||[item]).filter(item=>item['@type']==='FAQPage');
      return {visible:visible.filter(item=>/família.*procés/i.test(item.question)),structured:schemas.flatMap(item=>item.mainEntity||[]).filter(item=>/família.*procés/i.test(item.name))};
    });
    check('faq-visible-and-structured-include-adolescents',faq.visible.length===1&&faq.structured.length===1&&/adolescent/i.test(faq.visible[0].question)&&faq.visible[0].question===faq.structured[0].name&&faq.visible[0].answer===faq.structured[0].acceptedAnswer.text,{faq});
    const services=['psicologia-adults.html','psicologia-infantil-juvenil.html','pedagogia-reeducacions.html','logopedia.html','parella-familia.html','tallers-formacions.html'];
    for(const name of services){
      await page.goto(`${base}/${name}`,{waitUntil:'networkidle'});
      const duplicates=await page.evaluate(()=>{
        const normalize=text=>text.trim().replace(/\s+/g,' ').toLocaleLowerCase('ca');
        const copy=[...document.querySelectorAll('main p, main h2, main h3, main li, main details > div')].map(element=>normalize(element.textContent)).filter(text=>text.length>35);
        return [...new Set(copy.filter((text,index)=>copy.indexOf(text)!==index))];
      });
      check(`service-no-repeated-content-${name}`,duplicates.length===0,{duplicates});
    }
    await context.close();

    const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:900}});
    await prepare(nojs);
    const nojsPage=await nojs.newPage();const requests=[];
    nojsPage.on('request',request=>{if(isMap(request.url()))requests.push(request.url()===expectedMap);});
    await nojsPage.goto(`${base}/contacte.html`,{waitUntil:'networkidle'});
    check('map-loads-with-javascript-disabled',requests.length===1&&requests[0]&&await nojsPage.locator('iframe[data-site-src="maps_embed"]').isVisible());
    await nojs.close();
  } catch(error) { report.errors.push(safeText(error.stack)); }
  finally { await browser.close(); fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)); }
  const failed=report.checks.filter(item=>!item.pass);
  console.log(JSON.stringify({output,checks:report.checks.length,failed,errors:report.errors},null,2));
  process.exitCode=failed.length||report.errors.length?1:0;
})();
