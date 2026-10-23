/* Isolated Google reviews integration QA. All external requests are intercepted:
 * the SDK and any displayed review content are TEST FIXTURES, never real reviews.
 * No credentials file is read and no billable Google request is sent.
 * NODE qa/reviews_qa.cjs BASE_URL OUTPUT_DIR
 */
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('C:/Users/Administrador/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = (process.argv[2] || 'http://127.0.0.1:8000').replace(/\/$/, '');
const origin = new URL(base).origin;
const output = process.argv[3] || path.join(__dirname, 'browser-reviews');
const placeId = 'ChIJD2Lre4XhphIR8x2oRi6jTCE';
const mockKey = 'AIzaSy' + 'A'.repeat(33); // Deliberately synthetic, never transmitted.
const report = {
  generated: new Date().toISOString(),
  scope: 'Simulated Google SDK only; verifies newest request configuration, not actual Google review ordering, response, billing or authenticity.',
  checks: [], cases: [], errors: []
};
const check = (name, pass, detail = {}) => report.checks.push({name, pass, ...detail});
const safeUrl = value => { const u = new URL(value); if (u.searchParams.has('key')) u.searchParams.set('key', '[TEST-KEY]'); return u.href; };
fs.mkdirSync(output, {recursive:true});

function sdkFixture(mode) {
  return `(() => {
    const mode = ${JSON.stringify(mode)};
    class MockAdvancedPlaceDetails extends HTMLElement {
      connectedCallback() {
        setTimeout(() => {
          const reviews = this.querySelector('gmp-place-reviews');
          if (reviews) {
            const note = document.createElement('p');
            note.textContent = 'SIMULACIÓ QA: dades de prova; no és una ressenya real.';
            reviews.append(note);
          }
          if (mode === 'success') this.dispatchEvent(new Event('gmp-load'));
          if (mode === 'widget-error') this.dispatchEvent(new Event('gmp-error'));
          if (mode === 'auth-error' && typeof window.gm_authFailure === 'function') window.gm_authFailure();
        }, 30);
      }
    }
    if (!customElements.get('gmp-advanced-place-details')) customElements.define('gmp-advanced-place-details', MockAdvancedPlaceDetails);
    window.google = {maps: {importLibrary: async () => ({AdvancedPlaceDetailsElement: MockAdvancedPlaceDetails})}};
    setTimeout(() => window.edipReviewsReady(), 0);
  })();`;
}

async function makeCase(browser, name, options = {}) {
  const context = await browser.newContext({viewport:{width:options.width || 375,height:900}, reducedMotion:'reduce', javaScriptEnabled:options.noJS ? false : true});
  const result = {name, external:[], unexpectedExternal:[], sdkRequests:[], pageErrors:[]};
  report.cases.push(result);
  await context.addInitScript(() => {
    if (window !== window.top) return;
    window.__qaReviewActivity = {clicks:0,scrolls:0,iframeInsertions:0};
    addEventListener('click',() => window.__qaReviewActivity.clicks++,true);
    addEventListener('scroll',() => window.__qaReviewActivity.scrolls++,true);
    new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches('[data-reviews-panel] iframe')) window.__qaReviewActivity.iframeInsertions++;
        window.__qaReviewActivity.iframeInsertions += node.querySelectorAll('[data-reviews-panel] iframe').length;
      }
    }).observe(document,{childList:true,subtree:true});
  });
  if (options.accelerateTimeout) {
    await context.addInitScript(() => {
      const native = window.setTimeout.bind(window);
      window.setTimeout = (callback, delay, ...args) => native(callback, delay >= 10000 ? 500 : delay, ...args);
    });
  }
  let sdkMode = options.mode || 'success';
  const config = {apiKey:options.empty ? '' : (options.invalidKey ?? mockKey), placeId:options.invalidPlace ?? placeId};
  // A single routing boundary ensures that unexpected Google subresources,
  // other external domains and all real SDK traffic are denied, not fetched.
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === origin) {
      if (url.pathname.endsWith('/assets/js/google-reviews-config.js')) {
        await route.fulfill({contentType:'application/javascript; charset=utf-8', body:`window.EDIP_GOOGLE_REVIEWS=${JSON.stringify(config)};`});
      } else await route.continue();
      return;
    }
    result.external.push(safeUrl(url.href));
    if (url.origin === 'https://maps.googleapis.com' && url.pathname === '/maps/api/js') {
      result.sdkRequests.push({url:safeUrl(url.href), isWidget:request.frame().url().includes('/assets/widgets/google-reviews.html')});
      if (sdkMode === 'network-error') await route.abort('failed');
      else await route.fulfill({contentType:'application/javascript; charset=utf-8', body:sdkFixture(sdkMode)});
    } else {
      result.unexpectedExternal.push(safeUrl(url.href));
      await route.abort('blockedbyclient');
    }
  });
  const page = await context.newPage();
  page.on('pageerror', error => result.pageErrors.push(error.message));
  await page.goto(`${base}/index.html`, {waitUntil:'networkidle'});
  page.setDefaultTimeout(5000);
  const retry = page.locator('[data-reviews-retry]');
  const panel = page.locator('[data-reviews-panel]');
  const status = page.locator('[data-reviews-status]');
  const placeholder = page.locator('[data-reviews-placeholder]');
  const iframe = panel.locator('iframe');
  const section = page.locator('section[aria-labelledby="opinions-title"]');
  const notice = page.locator('[data-reviews-notice]');
  return {context,page,result,retry,panel,status,placeholder,iframe,section,notice,setMode:value => {sdkMode = value;}};
}

async function storage(page) {
  return page.evaluate(() => ({
    local:Object.fromEntries(Object.keys(localStorage).sort().map(key => [key,localStorage.getItem(key)])),
    session:Object.fromEntries(Object.keys(sessionStorage).sort().map(key => [key,sessionStorage.getItem(key)])),
    cookies:document.cookie
  }));
}

async function waitReady(c) {
  await c.iframe.waitFor();
  const frame = await (await c.iframe.elementHandle()).contentFrame();
  await frame.locator('gmp-advanced-place-details > gmp-place-reviews').waitFor({state:'attached'});
  await c.page.waitForFunction(() => {
    const status = document.querySelector('[data-reviews-status]');
    return status?.textContent === 'Informació de Google Maps carregada.';
  });
  return frame;
}

async function waitError(c) {
  await c.retry.waitFor({state:'visible'});
  return await c.status.textContent();
}

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  async function run(name, options, fn) {
    let c;
    try { c = await makeCase(browser,name,options); await fn(c); }
    catch (error) { report.errors.push({name,error:error.stack}); }
    finally {
      if (c) {
        check(`${name}:no-unexpected-external-requests`, c.result.unexpectedExternal.length === 0, {requests:c.result.unexpectedExternal});
        check(`${name}:no-uncaught-JS-errors`, c.result.pageErrors.length === 0, {errors:c.result.pageErrors});
        await c.context.close();
      }
    }
  }
  try {
    await run('empty-config', {empty:true}, async c => {
      check('empty-config:no-retry-iframe-or-external', await c.retry.isHidden() && await c.panel.isHidden() && await c.iframe.count() === 0 && c.result.external.length === 0);
      check('empty-config:no-activation-button', await c.page.locator('[data-reviews-toggle]').count() === 0);
      check('empty-config:real-Google-link', await c.section.locator('a[data-site-href="maps_reviews"]').isVisible());
      check('empty-config:honest-placeholder', await c.placeholder.isVisible() && (await c.placeholder.locator('p').textContent()).trim() === 'Les ressenyes de Google es mostraran en aquest espai.');
      await c.section.screenshot({path:path.join(output,'reviews-empty.png')});
    });
    await run('no-JavaScript', {noJS:true}, async c => {
      check('no-JavaScript:Google-link-without-widget', await c.section.locator('a[data-site-href="maps_reviews"]').isVisible() && await c.retry.isHidden() && await c.iframe.count() === 0 && c.result.external.length === 0);
      check('no-JavaScript:placeholder-visible', await c.placeholder.isVisible());
    });

    for (const width of [320,350,1440]) {
      await run(`success-${width}`, {width}, async c => {
        const frame = await waitReady(c);
        const activity = await c.page.evaluate(() => ({...window.__qaReviewActivity,scrollY,activeTag:document.activeElement.tagName}));
        check(`success-${width}:automatic-without-click-scroll-or-cookies`, activity.clicks === 0 && activity.scrolls === 0 && activity.scrollY === 0 && activity.iframeInsertions === 1 && await c.page.locator('[data-cookie-banner]').isVisible(), activity);
        check(`success-${width}:no-activation-or-close-button`, await c.page.locator('[data-reviews-toggle]').count() === 0 && await c.retry.isHidden());
        check(`success-${width}:accessible-ready-state`, await c.panel.getAttribute('id') === 'reviews-panel' && await c.status.getAttribute('role') === 'status' && await c.panel.getAttribute('aria-busy') === 'false');
        check(`success-${width}:loaded-hides-placeholder-and-shows-notice`, await c.placeholder.isHidden() && await c.notice.isVisible());
        check(`success-${width}:single-local-iframe`, await c.iframe.count() === 1 && await c.iframe.getAttribute('src') === 'assets/widgets/google-reviews.html' && await c.iframe.getAttribute('title') === 'Ressenyes d’EDIP a Google Maps');
        check(`success-${width}:auto-load-does-not-steal-focus`, activity.activeTag === 'BODY' && await c.panel.isVisible());
        const structure = await frame.evaluate(() => ({
          details:document.querySelectorAll('gmp-advanced-place-details').length,
          place:document.querySelector('gmp-advanced-place-details > gmp-place-details-place-request')?.getAttribute('place'),
          names:document.querySelectorAll('gmp-advanced-place-details > gmp-place-name').length,
          ratings:document.querySelectorAll('gmp-advanced-place-details > gmp-place-rating').length,
          reviews:document.querySelectorAll('gmp-advanced-place-details > gmp-place-reviews').length,
          rank:document.querySelector('gmp-advanced-place-details > gmp-place-reviews')?.getAttribute('rank-preference'),
          attributions:document.querySelectorAll('gmp-advanced-place-details > gmp-place-attribution').length,
          attributionColor:document.querySelector('gmp-advanced-place-details > gmp-place-attribution')?.getAttribute('light-scheme-color'),
          legacyConfig:document.querySelectorAll('gmp-place-content-config, gmp-place-details').length
        }));
        check(`success-${width}:advanced-component-direct-children`, structure.details === 1 && structure.place === `places/${placeId}` && structure.names === 1 && structure.ratings === 1 && structure.reviews === 1 && structure.legacyConfig === 0, structure);
        check(`success-${width}:requests-newest-reviews`, structure.rank === 'newest');
        check(`success-${width}:Google-attribution-config`, structure.attributions === 1 && structure.attributionColor === 'black');
        const visual = await frame.evaluate(() => {
          const element = document.querySelector('gmp-advanced-place-details');
          const style = getComputedStyle(element), rect = element.getBoundingClientRect();
          const properties = ['color-surface','color-on-surface','color-on-surface-variant','color-primary','color-secondary-container','color-on-secondary-container','color-neutral-container','color-on-neutral-container','color-outline-decorative','font-family','font-display-small','font-body-medium'];
          return {variables:Object.fromEntries(properties.map(name => [name,style.getPropertyValue(`--gmp-mat-${name}`).trim()])),width:rect.width,height:rect.height,maxWidth:style.maxWidth,colorScheme:style.colorScheme};
        });
        const expectedColors = {'color-surface':'#fffdfb','color-on-surface':'#302622','color-on-surface-variant':'#74655e','color-primary':'#7f3d29','color-secondary-container':'#e8d8ca','color-on-secondary-container':'#302622','color-neutral-container':'#faf6f2','color-on-neutral-container':'#302622','color-outline-decorative':'#e8d8ca'};
        const expectedFonts = {'font-family':'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif','font-display-small':'400 1.8rem/1.2 Georgia,"Times New Roman",serif','font-body-medium':'400 1rem/1.62 Inter,ui-sans-serif,system-ui,sans-serif'};
        check(`success-${width}:EDIP-color-variables`, Object.entries(expectedColors).every(([name,value]) => visual.variables[name] === value), {variables:visual.variables});
        check(`success-${width}:EDIP-font-variables`, Object.entries(expectedFonts).every(([name,value]) => visual.variables[name] === value));
        check(`success-${width}:component-responsive-dimensions`, visual.width > 0 && visual.width <= 400 && visual.maxWidth === '400px' && visual.height === 680 && visual.colorScheme === 'light', {width:visual.width,height:visual.height,maxWidth:visual.maxWidth,colorScheme:visual.colorScheme});
        const request = c.result.sdkRequests[0], sdk = request && new URL(request.url);
        check(`success-${width}:SDK-beta-contract`, c.result.sdkRequests.length === 1 && request.isWidget && sdk.searchParams.get('callback') === 'edipReviewsReady' && sdk.searchParams.get('libraries') === 'places' && sdk.searchParams.get('v') === 'beta' && sdk.searchParams.get('language') === 'ca' && sdk.searchParams.get('region') === 'ES' && sdk.searchParams.get('loading') === 'async');
        const geometry = await c.page.evaluate(() => {
          const rect = document.querySelector('[data-reviews-panel] iframe').getBoundingClientRect();
          return {pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,left:rect.left,right:rect.right,width:rect.width};
        });
        const childOverflow = await frame.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        check(`success-${width}:responsive-no-overflow`, geometry.pageWidth <= geometry.viewport && geometry.left >= -1 && geometry.right <= geometry.viewport + 1 && geometry.width > 0 && !childOverflow, geometry);
        check(`success-${width}:automatic-load-does-not-store-data`, JSON.stringify(await storage(c.page)) === JSON.stringify({local:{},session:{},cookies:''}));
        // All automatic-loading assertions above precede any screenshot scroll.
        await c.section.screenshot({path:path.join(output,`reviews-${width}-loaded-MOCK.png`)});
        await c.page.reload({waitUntil:'networkidle'});
        await waitReady(c);
        check(`success-${width}:reload-automatically-loads-one-frame`, await c.iframe.count() === 1 && c.result.sdkRequests.length === 2 && await c.page.evaluate(() => window.__qaReviewActivity.iframeInsertions === 1 && window.__qaReviewActivity.clicks === 0));
        check(`success-${width}:reload-hides-placeholder-and-retry`, await c.placeholder.isHidden() && await c.retry.isHidden());
      });
    }

    await run('spoofed-messages', {mode:'hold'}, async c => {
      await c.iframe.waitFor();
      const frame = await (await c.iframe.elementHandle()).contentFrame();
      await frame.locator('gmp-advanced-place-details').waitFor({state:'attached'});
      const loading = await c.status.textContent();
      check('loading:auto-frame-hidden-placeholder-and-retry', await c.iframe.count() === 1 && await c.placeholder.isHidden() && await c.retry.isHidden() && await c.notice.isVisible() && await c.panel.getAttribute('aria-busy') === 'true' && /carregant/i.test(loading));
      await c.page.evaluate(() => {
        const child = document.querySelector('[data-reviews-panel] iframe').contentWindow;
        for (const state of ['ready','error']) {
          dispatchEvent(new MessageEvent('message',{origin:'https://untrusted.invalid',source:child,data:{type:'edip-google-reviews',state}}));
          dispatchEvent(new MessageEvent('message',{origin:location.origin,source:window,data:{type:'edip-google-reviews',state}}));
        }
        dispatchEvent(new MessageEvent('message',{origin:location.origin,source:child,data:{type:'another-widget',state:'error'}}));
        dispatchEvent(new MessageEvent('message',{origin:location.origin,source:child,data:{type:'edip-google-reviews',state:'unknown'}}));
      });
      check('spoofed-messages:ignored-origin-source-type-state', await c.iframe.count() === 1 && await c.status.textContent() === loading && await c.retry.isHidden() && await c.panel.getAttribute('aria-busy') === 'true');
      await frame.evaluate(() => parent.postMessage({type:'edip-google-reviews',state:'ready'},location.origin));
      await c.page.waitForFunction(before => document.querySelector('[data-reviews-status]').textContent !== before, loading);
      check('spoofed-messages:correct-child-ready-accepted', await c.iframe.count() === 1 && await c.status.textContent() !== loading);
    });

    for (const mode of ['network-error','auth-error','widget-error','timeout']) {
      await run(mode, {mode:mode === 'timeout' ? 'hold' : mode,accelerateTimeout:mode === 'timeout'}, async c => {
        const message = await waitError(c);
        check(`${mode}:error-without-user-action`, await c.page.evaluate(() => window.__qaReviewActivity.clicks === 0 && window.__qaReviewActivity.scrolls === 0) && c.result.sdkRequests.length === 1);
        check(`${mode}:error-cleans-frame-and-allows-retry`, await c.iframe.count() === 0 && await c.panel.isHidden() && await c.retry.isVisible() && /torna.ho a provar/i.test(await c.retry.textContent()) && Boolean(message.trim()) && await c.status.getAttribute('role') === 'status', {message});
        check(`${mode}:error-restores-placeholder`, await c.placeholder.isVisible());
        c.setMode('success');
        await c.retry.focus();
        await c.retry.press('Enter');
        check(`${mode}:retry-hides-during-loading`, await c.retry.isHidden() && await c.placeholder.isHidden());
        await waitReady(c);
        check(`${mode}:keyboard-retry-recovers-single-frame`, await c.iframe.count() === 1 && await c.retry.isHidden() && c.result.sdkRequests.length === 2 && await c.page.evaluate(() => window.__qaReviewActivity.iframeInsertions === 2));
        check(`${mode}:no-reviews-storage`, JSON.stringify(await storage(c.page)) === JSON.stringify({local:{},session:{},cookies:''}));
      });
    }

    await run('invalid-place-id', {invalidPlace:'\"><img src=x onerror="window.__reviewsXSS=true">'}, async c => {
      check('invalid-place-id:rejected-without-XSS-or-network', await c.retry.isHidden() && await c.placeholder.isVisible() && await c.iframe.count() === 0 && c.result.external.length === 0 && await c.page.evaluate(() => !window.__reviewsXSS && !document.querySelector('img[src="x"]')));
      await c.page.goto(`${base}/assets/widgets/google-reviews.html`,{waitUntil:'networkidle'});
      check('invalid-place-id:direct-widget-navigation-loads-no-Google', c.result.external.length === 0 && await c.page.locator('gmp-advanced-place-details, gmp-place-details').count() === 0 && await c.page.evaluate(() => !window.__reviewsXSS && !document.querySelector('img[src="x"]')));
    });
    await run('invalid-api-key', {invalidKey:'not a valid key'}, async c => {
      check('invalid-api-key:no-automatic-request', await c.retry.isHidden() && await c.placeholder.isVisible() && await c.iframe.count() === 0 && c.result.external.length === 0);
    });
  } catch (error) { report.errors.push({name:'runner',error:error.stack}); }
  finally {
    await browser.close();
    report.passed = report.errors.length === 0 && report.checks.every(result => result.pass);
    fs.writeFileSync(path.join(output,'report.json'), JSON.stringify(report,null,2));
    console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,failures:report.checks.filter(result => !result.pass),errors:report.errors},null,2));
    process.exitCode = report.passed ? 0 : 1;
  }
})();
