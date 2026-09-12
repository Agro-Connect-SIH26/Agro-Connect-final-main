const { chromium } = require('playwright');
// Debug version: see what's happening step by step
(async () => {
  console.log('=== Launch browser ===');
  const browser = await chromium.launch({ headless: false, slowMo: 50 }); // visible for debugging
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging to see what's happening in the page
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  console.log('At root, URL:', page.url());

  // Go to login explicitly
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  console.log('At login, URL:', page.url());

  // Take a snapshot of the login page to see what's there
  const loginHTML = await page.content();
  console.log('Login page length:', loginHTML.length);
  // Save to file for inspection? Not now.

  // Click the farmer demo button by text
  const farmerButton = page.getByRole('button', { name: /farmer/i });
  if (await farmerButton.count() > 0) {
    console.log('Found farmer button');
    await farmerButton.click();
  } else {
    console.log('Farmer button not found, trying to fill form manually');
    // Fill in the demo credentials manually
    await page.fill('input[type="email"]', 'farmer@agroconnect.demo');
    await page.fill('input[type="password"]', 'farmer123');
    await page.click('button:has-text("Sign in")');
  }

  await page.waitForLoadState('networkidle');
  console.log('After login attempt, URL:', page.url());

  // Wait a bit for redirect
  await page.waitForTimeout(2000);

  // Now go to market prices directly
  await page.goto('http://localhost:5173/farmer/market-prices');
  await page.waitForLoadState('networkidle');
  console.log('At market prices, URL:', page.url());

  // Check if the crop select is present
  const cropSelect = page.locator('#crop-select');
  if (await cropSelect.count() > 0) {
    console.log('Crop select found');
    await cropSelect.selectOption({ label: /potato/i });
  } else {
    console.log('Crop select NOT found');
    // Let's see what is in the page
    const pageText = await page.innerText('body');
    console.log('Page text preview:', pageText.substring(0, 500));
  }

  // Similarly for state
  const stateSelect = page.locator('#state-select');
  if (await stateSelect.count() > 0) {
    console.log('State select found');
    await stateSelect.selectOption({ label: /Bihar/i });
  } else {
    console.log('State select NOT found');
  }

  // Click search
  const searchBtn = page.getByRole('button', { name: /Search Prices/i });
  if (await searchBtn.count() > 0) {
    console.log('Search button found');
    await searchBtn.click();
    await page.waitForTimeout(3000);
    console.log('After search, URL:', page.url());
  } else {
    console.log('Search button NOT found');
  }

  // Keep browser open for a bit to inspect manually if needed
  await page.waitForTimeout(5000);

  await browser.close();
  console.log('Debug session ended');
})();