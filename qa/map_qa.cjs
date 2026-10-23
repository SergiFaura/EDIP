/* Real Google embed verification; no mocked response and no mail submission.
 * NODE qa/map_qa.cjs BASE_URL OUTPUT_DIR
 */
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('C:/Users/Administrador/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.argv[2] || 'http://127.0.0.1:8000';
const output = process.argv[3] || path.join(__dirname, 'browser-map');
const expected = JSON.parse(fs.readFileSync(path.join(__dirname, '../maintenance/site-data.json'), 'utf8')).maps_embed;
const report = {generated: new Date().toISOString(), checks: [], cases: [], errors: []};
const check = (name, pass, detail = {}) => report.checks.push({name, pass, ...detail});
fs.mkdirSync(output, {recursive:true});
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try {
    for (const width of [320, 375, 1440]) {
      const context = await browser.newContext({viewport:{width, height:900}, reducedMotion:'reduce'});
      const page = await context.newPage();
      const external = [], parentErrors = [], networkFailures = [], embedResponses = [];
      const caseResult = {width, embedResponses, parentErrors, networkFailures};
      report.cases.push(caseResult);
      page.on('request', request => {
        if (new URL(request.url()).origin !== new URL(base).origin)
          external.push({url:request.url(), fromMainFrame:request.frame() === page.mainFrame()});
      });
      page.on('pageerror', error => parentErrors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error' && message.location().url.startsWith(base)) parentErrors.push(message.text());
      });
      page.on('response', response => {
        if (response.url() === expected) embedResponses.push(response.status());
        if (response.status() >= 400) networkFailures.push({url:response.url(), status:response.status()});
      });
      await page.goto(`${base}/contacte.html`, {waitUntil:'networkidle'});
      await page.locator('[data-google-map]').scrollIntoViewIfNeeded();
      await page.locator('[data-cookie-essential]').click();
      await page.getByRole('button', {name:'Preferències de cookies', exact:true}).click();
      await page.locator('[data-save-cookie-settings]').click();
      const toggle = page.locator('[data-map-toggle]');
      await toggle.scrollIntoViewIfNeeded();
      await page.waitForLoadState('networkidle');
      check(`no-Google-before-activation-${width}`, external.length === 0 && await page.locator('iframe').count() === 0, {requests:external.length});
      await page.locator('[data-google-map]').screenshot({path:path.join(output, `map-${width}-before.png`)});
      await toggle.focus();
      await toggle.press('Enter');
      const iframe = page.locator('[data-map-canvas] iframe');
      await iframe.waitFor();
      check(`single-official-iframe-${width}`, await iframe.count() === 1 && await iframe.getAttribute('src') === expected && await iframe.getAttribute('title') === 'Ubicació d’EDIP a Google Maps');
      check(`keyboard-focus-and-state-${width}`, await toggle.getAttribute('aria-expanded') === 'true' && await toggle.evaluate(e => e === document.activeElement));
      const frame = await iframe.elementHandle().then(handle => handle.contentFrame());
      // Google may render the business name on the map canvas rather than as
      // text. Verify its real place link as well as loaded map imagery.
      try {
        await frame.locator('a[href*="cid=2399472120630877683"]').first().waitFor({timeout:15000});
      } catch (error) {
        caseResult.frameDiagnostic = await frame.evaluate(() => ({url:location.href, text:document.body.innerText, links:[...document.querySelectorAll('a')].map(a => a.href)}));
        await page.locator('[data-google-map]').screenshot({path:path.join(output, `map-${width}-diagnostic.png`)});
        throw error;
      }
      await frame.waitForFunction(() => [...document.images].some(img => img.complete && img.naturalWidth > 200), null, {timeout:30000});
      await frame.waitForLoadState('networkidle');
      check(`live-Google-map-loaded-${width}`, embedResponses.includes(200), {embedResponses});
      check(`no-parent-external-resources-${width}`, external.every(request => !request.fromMainFrame));
      check(`no-page-overflow-${width}`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.locator('[data-google-map]').screenshot({path:path.join(output, `map-${width}-loaded.png`)});
      if (width === 1440) await page.locator('[data-google-map]').locator('..').screenshot({path:path.join(output, 'location-desktop.png')});
      await toggle.click();
      check(`close-removes-map-${width}`, await iframe.count() === 0 && await page.locator('[data-map-placeholder]').isVisible() && await toggle.getAttribute('aria-expanded') === 'false');
      await toggle.click();
      check(`reopen-one-map-${width}`, await iframe.count() === 1);
      await toggle.click();
      const stored = await page.evaluate(() => ({local:Object.keys(localStorage), session:Object.keys(sessionStorage)}));
      check(`map-activation-not-stored-${width}`, JSON.stringify(stored.local) === '["edip-cookie-consent-v1"]' && stored.session.length === 0, {stored});
      external.length = 0;
      await page.reload({waitUntil:'networkidle'});
      await toggle.scrollIntoViewIfNeeded();
      check(`reload-map-inactive-${width}`, external.length === 0 && await page.locator('iframe').count() === 0);
      check(`no-parent-JS-errors-${width}`, parentErrors.length === 0, {parentErrors});
      await context.close();
    }
    const nojs = await browser.newContext({javaScriptEnabled:false, viewport:{width:375,height:900}});
    const page = await nojs.newPage(), requests = [];
    page.on('request', request => {if (new URL(request.url()).origin !== new URL(base).origin) requests.push(request.url());});
    await page.goto(`${base}/contacte.html`, {waitUntil:'networkidle'});
    await page.locator('[data-google-map]').scrollIntoViewIfNeeded();
    check('no-JS-directions-and-no-external-load', await page.getByRole('link', {name:'Com arribar-hi', exact:true}).isVisible() && await page.locator('[data-map-toggle]').isHidden() && requests.length === 0);
    await nojs.close();
    const hostile = await browser.newContext();
    await hostile.addInitScript(() => localStorage.setItem('edip-cookie-consent-v1', JSON.stringify({essential:true, analytics:true, maps:true})));
    const hostilePage = await hostile.newPage(), hostileRequests = [];
    hostilePage.on('request', request => {if (new URL(request.url()).origin !== new URL(base).origin) hostileRequests.push(request.url());});
    await hostilePage.goto(`${base}/contacte.html`, {waitUntil:'networkidle'});
    await hostilePage.locator('[data-google-map]').scrollIntoViewIfNeeded();
    check('stored-flags-do-not-activate-map', hostileRequests.length === 0 && await hostilePage.locator('iframe').count() === 0);
    await hostile.close();
  } catch (error) { report.errors.push(error.stack); }
  finally {
    await browser.close();
    report.passed = report.errors.length === 0 && report.checks.every(result => result.pass);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({passed:report.passed, checks:report.checks.length, failures:report.checks.filter(result => !result.pass), errors:report.errors}, null, 2));
    process.exitCode = report.passed ? 0 : 1;
  }
})();
