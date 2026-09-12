const { chromium } = require('playwright');
// Debug version 2: Fix login and searchable select behavior
(async () => {
  console.log('=== Launch browser ===');
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');

  // Fix login: interact with the demo accounts part.
  console.log('Attempting demo login...');
  // Click the first "Use sample account" button.
  const sampleAccountButtons = page.getByRole('button', { name: /Use sample account/i });
  if (await sampleAccountButtons.count() > 0) {
    await sampleAccountButtons.first().click();
    console.log('Clicked "Use sample account"');
  } else {
    console.log('Manual login');
    await page.fill('input[type="email"]', 'farmer@agroconnect.demo');
    await page.fill('input[type="password"]', 'farmer123');
    await page.click('button[type="submit"]');
  }

  await page.waitForLoadState('networkidle');
  await page.waitForURL('**/farmer', { timeout: 10000 });
  console.log('After login, URL:', page.url());

  // Navigate to Market Prices.
  await page.goto('http://localhost:5173/market-prices');
  await page.waitForLoadState('networkidle');

  // Select Potato crop in SearchableSelect
  console.log('Selecting Potato...');
  const cropInput = page.locator('#crop-select');
  await cropInput.click();
  await cropInput.fill('Potato');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  // Select Bihar state
  console.log('Selecting Bihar...');
  const stateInput = page.locator('#state-select');
  await stateInput.click();
  await stateInput.fill('Bihar');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  console.log('Search prices...');
  await page.getByRole('button', { name: /Search Prices/i }).click();

  await page.waitForTimeout(5000);
  await browser.close();
})();
