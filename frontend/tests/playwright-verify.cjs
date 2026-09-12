const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('1. Login');
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Use sample account/i }).first().click();
  await page.waitForURL('**/farmer', { timeout: 10000 });

  console.log('2. Market Prices');
  await page.goto('http://localhost:5173/market-prices');
  await page.waitForLoadState('networkidle');

  // Explicitly wait for metadata to load
  await page.locator('#crop-select').waitFor({ state: 'visible' });

  console.log('3. Select Potato');
  await page.locator('#crop-select').click();
  await page.locator('#crop-select').fill('Potato');
  await page.locator('role=option[name="Potato"]').click();
  // Press Escape to ensure dropdown is completely closed
  await page.keyboard.press('Escape');

  console.log('4. Select Bihar');
  await page.locator('#state-select').click();
  await page.locator('#state-select').fill('Bihar');
  await page.locator('role=option[name="Bihar"]').click();
  await page.keyboard.press('Escape');

  console.log('5. Check Search button');
  const btn = page.getByRole('button', { name: /Search Prices/i });
  console.log('Button is disabled:', await btn.isDisabled());

  console.log('6. Click Search Prices');
  await btn.click();

  console.log('7. Waiting for results...');
  await page.waitForTimeout(4000);

  // Results summary
  const rows = await page.locator('table tbody tr').count();
  console.log(`Success! Found ${rows} data rows.`);

  await browser.close();
})();
