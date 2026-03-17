const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));
  page.on('response', res => {
    if (res.status() >= 400) console.log('BAD RESPONSE:', res.url(), res.status());
  });

  console.log('Navigating to http://localhost:5173 ...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || 'NOT_FOUND');
  console.log('ROOT HTML LENGTH:', rootHtml.length);
  if (rootHtml.length === 0) console.log('=> ROOT IS EMPTY!');
  
  await browser.close();
})();
