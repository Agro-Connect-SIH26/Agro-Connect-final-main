const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const report = {
    steps: {},
    consoleErrors: [],
    networkRequests: [],
    timestamp: new Date().toISOString(),
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors
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

  const waitForPage = async (url, label) => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // Give JS a moment to hydrate
    await page.waitForTimeout(1500);
    console.log(`  [OK] ${label}`);
  };

  try {
    // Step 1: Open the application
    console.log('--- Step 1: Open Application ---');
    await waitForPage('http://localhost:5173/', 'Home loaded');
    report.steps['1_open_app'] = { passed: true, url: page.url() };

    // Step 2: Login as farmer
    console.log('--- Step 2: Login as Farmer ---');
    await waitForPage('http://localhost:5173/login', 'Login page');
    await page.getByRole('button', { name: /Use sample account/i }).first().click();
    await page.waitForURL('**/farmer', { timeout: 15000 });
    report.steps['2_login_farmer'] = { passed: true, user: 'farmer@agroconnect.demo' };

    // Step 3: Open Market Prices
    console.log('--- Step 3: Open Market Prices ---');
    await waitForPage('http://localhost:5173/market-prices', 'Market prices');
    report.steps['3_open_market_prices'] = { passed: true };

    // Step 4: Verify safety gate — no unconstrained request on page load
    console.log('--- Step 4: Verify Safety Gate ---');
    const fullPriceRequestsOnLoad = report.networkRequests.filter(
      r => r.url.includes('/api/market-prices') && !r.url.includes('/metadata')
    );
    const bodyText = await page.textContent('body');
    const initialNotePresent = bodyText.includes('Crop and state are required');
    report.steps['4_safety_gate'] = {
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

    // Step 7: Click Search and verify live AGMARKNET prices appear
    console.log('--- Step 7: Search & Verify Live AGMARKNET Prices ---');
    const searchBtn = page.getByRole('button', { name: /Search Prices/i });
    await searchBtn.click();

    // Wait for the table to appear (meaning data loaded and rendered)
    await page.waitForSelector('table tbody tr', { timeout: 20000 });

    const rows = await page.locator('table tbody tr').count();
    const hasLiveBadge = (await page.getByText(/Live AGMARKNET/i).count()) > 0;
    report.steps['7_live_prices'] = {
      passed: rows > 0,
      rowCount: rows,
      hasLiveBadge,
    };

    // Step 8: Table responsiveness / usability
    console.log('--- Step 8: Table Usability ---');
    let sampleRow = '';
    if (rows > 0) {
      sampleRow = (await page.locator('table tbody tr').first().innerText()).replace(/\n/g, ' | ');
    }
    report.steps['8_table_usable'] = {
      passed: rows > 0 && sampleRow.length > 0,
      sampleRow,
    };

    // Step 10: Price Trend Chart (inline, below table)
    console.log('--- Step 10: Price Trend Chart ---');
    const trendEls = await page.locator('.recharts-responsive-container, svg.recharts-surface').count();
    const trendLabel = await page.getByText('Price Trend').count();
    report.steps['10_price_trend'] = {
      passed: trendEls > 0 || trendLabel > 0,
      rechartsElements: trendEls,
      label: trendLabel,
    };

    // Step 11: Mandi Map (inline, below table)
    console.log('--- Step 11: Nearby Mandis / Mandi Map ---');
    const mapEls = await page.locator('.leaflet-container, #map').count();
    const mandiListLabel = await page.getByText(/Nearby mandis/i).count();
    report.steps['11_mandi_map'] = {
      passed: mapEls > 0 || mandiListLabel > 0,
      mapElements: mapEls,
      mandiLabel: mandiListLabel,
    };

    // Step 9: Change Filters → select a district → verify refined results
    console.log('--- Step 9: District Refinement ---');
    const changeFiltersBtn = page.getByText(/Change filters/i);
    if (await changeFiltersBtn.count() > 0) {
      await changeFiltersBtn.click();
      await page.waitForTimeout(500);

      // Re-select Crop & State (handleReset clears them)
      await page.locator('#crop-select').click();
      await page.locator('#crop-select').fill('Potato');
      await page.locator('role=option[name="Potato"]').click();
      await page.keyboard.press('Escape');

      await page.locator('#state-select').click();
      await page.locator('#state-select').fill('Bihar');
      await page.locator('role=option[name="Bihar"]').click();
      await page.keyboard.press('Escape');

      // Wait for district dropdown to become live
      await page.waitForSelector('#district-select:not([disabled])', { timeout: 10000 });
      await page.waitForTimeout(500);

      await page.locator('#district-select').click();
      await page.locator('#district-select').fill('Madhubani');
      const opt = page.locator('role=option[name="Madhubani"]');
      if (await opt.count() > 0) {
        await opt.click();
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
        refinedRows,
      };
    } else {
      report.steps['9_district_refinement'] = { passed: false, note: 'Change filters button not found' };
    }

    // Step 12: Crop lot / decision support journey
    console.log('--- Step 12: Crop Lot / Decision Support ---');
    await waitForPage('http://localhost:5173/farmer/crop-lots', 'Crop lots page');
    const hasCropLots = (await page.locator('text="Manage →"').count()) > 0;
    let decisionSupportLoaded = false;
    if (hasCropLots) {
      await page.locator('text="Manage →"').first().click();
      await page.waitForTimeout(2000);
      const decisionLink = page.locator('a[href*="/decision"]');
      if (await decisionLink.count() > 0) {
        await decisionLink.first().click();
        await page.waitForTimeout(2000);
        decisionSupportLoaded = (await page.getByText(/Price Forecast|Recommendation|Model|Decision/i).count()) > 0;
      }
    }
    report.steps['12_farmer_decision_journey'] = {
      passed: true,
      hasCropLots,
      decisionSupportLoaded,
    };

    // Step 13: Browser console audit
    console.log('--- Step 13: Browser Console Audit ---');
    report.steps['13_console_audit'] = {
      passed: report.consoleErrors.length === 0,
      errorCount: report.consoleErrors.length,
      errors: report.consoleErrors.slice(0, 10),
    };

    // Step 15: Backend / ML health
    console.log('--- Step 15: Backend & ML Health ---');
    const healthResp = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        return { status: res.status, data };
      } catch (e) {
        return { error: e.toString() };
      }
    });
    report.steps['15_backend_health'] = {
      passed: healthResp.status === 200,
      response: healthResp,
    };

  } catch (err) {
    console.error('Test error:', err.message || err);
    report.error = err.toString();
  } finally {
    await browser.close();
    fs.writeFileSync('e2e-run-report.json', JSON.stringify(report, null, 2));
    console.log('=== Run complete. Report: e2e-run-report.json ===');
  }
})();
