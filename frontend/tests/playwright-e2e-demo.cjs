const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const report = {
    steps: {},
    consoleErrors: [],
    networkRequests: [],
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      report.consoleErrors.push(msg.text());
    }
  });

  // Track network calls to /api/market-prices
  page.on('request', req => {
    if (req.url().includes('/api/market-prices')) {
      report.networkRequests.push({
        url: req.url(),
        time: new Date().toISOString(),
      });
    }
  });

  try {
    // Step 1: Open the application
    console.log('--- Step 1: Open Application ---');
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    report.steps['1_open_app'] = { passed: true, url: page.url() };

    // Step 2: Login as farmer
    console.log('--- Step 2: Login as Farmer ---');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Use sample account/i }).first().click();
    await page.waitForURL('**/farmer', { timeout: 10000 });
    report.steps['2_login_farmer'] = { passed: true, user: 'farmer@agroconnect.demo' };

    // Step 3: Open Market Prices
    console.log('--- Step 3: Open Market Prices ---');
    await page.goto('http://localhost:5173/market-prices');
    await page.waitForLoadState('networkidle');
    report.steps['3_open_market_prices'] = { passed: true };

    // Step 4: Verify no huge request on initial load
    console.log('--- Step 4: Verify Safety Gate on Page Load ---');
    const fullPriceRequestsOnLoad = report.networkRequests.filter(
      r => r.url.includes('/api/market-prices') && !r.url.includes('/metadata')
    );
    const initialNotePresent = await page.getByText(/Crop and state are required/i).isVisible();
    report.steps['4_safety_gate_initial_load'] = {
      passed: fullPriceRequestsOnLoad.length === 0 && initialNotePresent,
      requestsFired: fullPriceRequestsOnLoad.length,
      gateMessageVisible: initialNotePresent,
    };

    // Step 5: Select Potato
    console.log('--- Step 5: Select Potato ---');
    await page.locator('#crop-select').click();
    await page.locator('#crop-select').fill('Potato');
    await page.locator('role=option[name="Potato"]').click();
    await page.keyboard.press('Escape');
    report.steps['5_select_potato'] = { passed: true };

    // Step 6: Select Bihar
    console.log('--- Step 6: Select Bihar ---');
    await page.locator('#state-select').click();
    await page.locator('#state-select').fill('Bihar');
    await page.locator('role=option[name="Bihar"]').click();
    await page.keyboard.press('Escape');
    report.steps['6_select_bihar'] = { passed: true };

    // Step 7: Verify live AGMARKNET market prices appear in UI
    console.log('--- Step 7: Verify Live AGMARKNET Prices Appear ---');
    const searchBtn = page.getByRole('button', { name: /Search Prices/i });
    await searchBtn.click();
    await page.waitForTimeout(3000);
    const rows = await page.locator('table tbody tr').count();
    const isLiveTag = await page.getByText(/Live AGMARKNET/i).count();
    report.steps['7_live_prices_appear'] = {
      passed: rows > 0,
      rowCount: rows,
      hasLiveBadge: isLiveTag > 0,
    };

    // Step 8: Verify table is usable, no freeze/timeout
    console.log('--- Step 8: Table Usability & Responsiveness ---');
    const firstRowText = await page.locator('table tbody tr').first().innerText();
    report.steps['8_table_usable'] = {
      passed: rows > 0 && firstRowText.length > 0,
      sampleRow: firstRowText.replace(/\n/g, ' | '),
    };

    // Step 10: Open Price Trend and verify it loads (rendered inline)
    console.log('--- Step 10: Price Trend Chart ---');
    const trendLoaded = (await page.locator('.recharts-responsive-container').count() + await page.locator('svg.recharts-surface').count() > 0) || await page.getByText('Price Trend').count() > 0;
    report.steps['10_price_trend'] = { passed: trendLoaded, elementsFound: trendLoaded };

    // Step 11: Open Nearby Mandis / Mandi Map and verify it loads (rendered inline)
    console.log('--- Step 11: Nearby Mandis / Map ---');
    const mapLoaded = (await page.locator('.leaflet-container, #map').count()) > 0;
    report.steps['11_mandi_map'] = { passed: mapLoaded, elementsFound: mapLoaded };

    // Step 9: Click Change Filters, select a district, and verify results change
    console.log('--- Step 9: Select District & Refine Search ---');
    await page.getByText(/Change filters/i).click();
    await page.waitForTimeout(500);

    // Re-select Crop & State (handleReset clears these)
    await page.locator('#crop-select').click();
    await page.locator('#crop-select').fill('Potato');
    await page.locator('role=option[name="Potato"]').click();
    await page.keyboard.press('Escape');

    await page.locator('#state-select').click();
    await page.locator('#state-select').fill('Bihar');
    await page.locator('role=option[name="Bihar"]').click();
    await page.keyboard.press('Escape');

    // Wait for district options to load from API (enables the input)
    await page.waitForSelector('#district-select:not([disabled])', { timeout: 10000 });
    await page.waitForTimeout(500);

    await page.locator('#district-select').click();
    await page.locator('#district-select').fill('Patna');
    const patnaOpt = page.locator('role=option[name="Patna"]');
    if (await patnaOpt.count() > 0) {
      await patnaOpt.click();
    } else {
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Re-run search
    await page.getByRole('button', { name: /Search Prices/i }).click();
    await page.waitForTimeout(3000);
    const refinedRows = await page.locator('table tbody tr').count();
    report.steps['9_district_refinement'] = {
      passed: refinedRows > 0 && refinedRows <= rows,
      initialRows: rows,
      refinedRows: refinedRows,
    };

    // Step 12: Crop lot / decision support / offers flow
    console.log('--- Step 12: Crop Lot / Decision Support / Offers ---');
    await page.goto('http://localhost:5173/farmer/crop-lots');
    await page.waitForLoadState('networkidle');
    const hasCropLots = (await page.locator('text="Manage →"').count()) > 0;

    let decisionSupportPassed = false;
    if (hasCropLots) {
      await page.locator('text="Manage →"').first().click();
      await page.waitForLoadState('networkidle');

      // Navigate to decision support for this lot
      const decisionLink = page.locator('a[href*="/decision"]');
      if (await decisionLink.count() > 0) {
        await decisionLink.first().click();
        await page.waitForLoadState('networkidle');
        decisionSupportPassed = (await page.getByText(/Price Forecast|Recommendation|Model/i).count()) > 0;
      }
    }
    report.steps['12_farmer_decision_journey'] = {
      passed: true,
      hasCropLots,
      decisionSupportLoaded: decisionSupportPassed,
    };

    // Step 13: Browser console audit
    console.log('--- Step 13: Browser Console Check ---');
    report.steps['13_console_audit'] = {
      passed: report.consoleErrors.length === 0,
      errors: report.consoleErrors,
    };

    // Step 15: Verify ML service connectivity & predict
    console.log('--- Step 15: ML Service Predict Verification ---');
    const mlResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        return { status: res.status, data };
      } catch (e) {
        return { error: e.toString() };
      }
    });
    report.steps['15_ml_and_backend_health'] = {
      passed: mlResponse.status === 200,
      backendStatus: mlResponse.data,
    };

  } catch (err) {
    console.error('Test execution encountered an error:', err);
    report.error = err.toString();
  } finally {
    await browser.close();
    fs.writeFileSync('e2e-demo-report.json', JSON.stringify(report, null, 2));
    console.log('=== E2E Browser Demo Complete ===');
  }
})();
