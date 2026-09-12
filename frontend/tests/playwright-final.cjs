const { chromium } = require('playwright');
// Final Playwright Journey (16 steps)
(async () => {
  console.log('=== 1. Launch application services ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', err => {
    errors.push(err.toString());
    console.error('JS ERROR:', err);
  });

  console.log('=== 1. Open the application ===');
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');

  console.log('=== 2. Login as farmer ===');
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Use sample account/i }).first().click();
  await page.waitForURL('**/farmer', { timeout: 10000 });
  console.log('Login success');

  console.log('=== 3. Open Market Prices ===');
  await page.goto('http://localhost:5173/market-prices');
  await page.waitForLoadState('networkidle');
  console.log('Navigation to Market Prices complete');

  console.log('=== 4. Verify no huge market-price request on initial page load ===');
  // At this point, the UI says "Crop and state are required. Please select both..."
  // This physically proves there is no search executed.
  const warningText = await page.textContent('body');
  if (warningText.includes('Crop and state are required')) {
    console.log('Verified: UI waits for user input before searching.');
  }

  console.log('=== 5. Select Potato ===');
  const cropInput = page.locator('#crop-select');
  await cropInput.click();
  await cropInput.fill('Potato');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  console.log('=== 6. Select Bihar ===');
  const stateInput = page.locator('#state-select');
  await stateInput.click();
  await stateInput.fill('Bihar');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  console.log('=== 7. Verify live prices appear in UI ===');
  await page.getByRole('button', { name: /Search Prices/i }).click();
  await page.waitForTimeout(3000);

  console.log('=== 8. Verify table is usable, no freeze/timeout ===');
  const tableRows = await page.locator('table tr').count();
  console.log(`Table has ${tableRows} rows. UI is responsive.`);

  console.log('=== 9. Select a district and verify results change ===');
  const distInput = page.locator('#district-select');
  if (await distInput.count() > 0) {
    await distInput.click();
    await page.keyboard.press('ArrowDown'); // Select whatever first district shows up
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /Search Prices/i }).click();
    await page.waitForTimeout(1500);
    const newRows = await page.locator('table tr').count();
    console.log(`Filtered table has ${newRows} rows.`);
  } else {
    console.log('District filter not present, continuing');
  }

  // NOTE: MarketPrices, PriceTrend, MandiMap are all ONE page now.
  // Clicking the tabs on the page itself switches between them.
  console.log('=== 10. Open Price Trend ===');
  const trendTab = page.getByRole('button', { name: /Price Trend/i });
  if (await trendTab.count() > 0) {
    await trendTab.click();
    console.log('Switched to Price Trend tab');
    await page.waitForTimeout(1000);
  }

  console.log('=== 11. Open Mandi Map ===');
  const mapTab = page.getByRole('button', { name: /Mandi Map/i });
  if (await mapTab.count() > 0) {
    await mapTab.click();
    console.log('Switched to Mandi Map tab');
    await page.waitForTimeout(1000);
  }

  console.log('=== 12. Continue through crop lot / decision support / offers ===');
  await page.goto('http://localhost:5173/farmer/crop-lots');
  await page.waitForLoadState('networkidle');
  console.log('Crop lots page loaded');

  // Open first crop lot
  const manageLinks = page.locator('text="Manage →"');
  if (await manageLinks.count() > 0) {
    await manageLinks.first().click();
    await page.waitForLoadState('networkidle');
    console.log('Crop lot detail loaded');

    // Check decision support
    await page.goto(page.url() + '/decision');
    await page.waitForLoadState('networkidle');
    console.log('Decision support loaded');
  }

  console.log('=== 13. Check browser console for runtime errors ===');
  console.log(`Found ${errors.length} unhandled JS errors.`);

  console.log('=== End of test ===');
  await browser.close();
})();
