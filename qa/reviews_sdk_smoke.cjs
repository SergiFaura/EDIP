/* Real SDK smoke check with an intentionally invalid, synthetic key.
 * Does not use any saved API key or claim to validate real reviews/billing.
 */
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('C:/Users/Administrador/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.argv[2] || 'http://127.0.0.1:8000';
const output = process.argv[3] || 'qa/reviews-sdk-smoke.json';
const report = {generated:new Date().toISOString(), mode:'real SDK, deliberately invalid synthetic key; no real reviews', sdkResponses:[], cspErrors:[], requests:[], failedRequests:[], errors:[]};
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try {
    const context = await browser.newContext();
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
    await context.route('**/google-reviews-config.js', route => route.fulfill({contentType:'application/javascript', body:"window.EDIP_GOOGLE_REVIEWS={apiKey:'EDIP_QA_INVALID_KEY_00000000000000000000',placeId:'ChIJD2Lre4XhphIR8x2oRi6jTCE'};"}));
    const page = await context.newPage();
    page.on('console', message => {
      if (/Content Security Policy|violates.*directive|Refused to/.test(message.text())) report.cspErrors.push(message.text().replace(/key=[^&\s]+/g,'key=REDACTED'));
    });
    page.on('response', response => {
      if (response.url().startsWith('https://maps.googleapis.com/maps/api/js?')) report.sdkResponses.push(response.status());
    });
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.origin !== new URL(base).origin) report.requests.push(url.origin + url.pathname);
    });
    page.on('requestfailed', request => {
      const url = new URL(request.url());
      report.failedRequests.push({url:url.origin + url.pathname,error:request.failure()?.errorText || 'Unknown request failure'});
    });
    await page.goto(base + '/index.html', {waitUntil:'networkidle'});
    await page.locator('[data-reviews-status]').filter({hasText:'Ara no podem carregar'}).waitFor({timeout:30000});
    report.activity = await page.evaluate(() => ({...window.__qaReviewActivity,scrollY}));
    report.automaticLoad = report.activity.clicks === 0 && report.activity.scrolls === 0 && report.activity.scrollY === 0 && report.activity.iframeInsertions === 1 && await page.locator('[data-cookie-banner]').isVisible();
    report.fallbackWorks = await page.locator('[data-reviews-panel] iframe').count() === 0 && await page.locator('[data-reviews-retry]').isVisible() && await page.locator('[data-reviews-placeholder]').isVisible();
    report.noActivationButton = await page.locator('[data-reviews-toggle]').count() === 0;
    report.passed = report.sdkResponses.length === 1 && report.sdkResponses[0] === 200 && report.cspErrors.length === 0 && report.automaticLoad && report.fallbackWorks && report.noActivationButton;
    await context.close();
  } catch(error) { report.errors.push(error.stack); report.passed=false; }
  finally {
    await browser.close();
    fs.mkdirSync(path.dirname(output), {recursive:true});
    fs.writeFileSync(output,JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
    process.exitCode = report.passed ? 0 : 1;
  }
})();
