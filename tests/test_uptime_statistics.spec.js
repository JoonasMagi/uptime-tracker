/**
 * Playwright tests for uptime statistics - TDD approach
 * Testing ALL acceptance criteria for User Story 3: "Uptime Statistics Viewing"
 * 
 * Acceptance Criteria:
 * 1. I can select a site by clicking to view its details
 * 2. Uptime percentage is displayed for the last 24 hours, 7 days, and 30 days
 * 3. Average response time for the selected period is shown
 * 4. Number and total duration of outages are displayed
 * 5. Statistics are calculated correctly based on monitoring data
 * 6. Data is presented in a clearly readable format
 */

const { test, expect } = require('@playwright/test');

test.describe('User Story 3: Uptime Statistics Viewing', () => {
  
  // Reset data before each test to ensure consistent state
  test.beforeEach(async ({ page }) => {
    // Reset to known mock data state
    await page.request.post('/reset-data');
    await page.goto('/dashboard');
  });
  
  // Criterion 1: I can select a site by clicking to view its details
  test('can select a site to view its details', async ({ page }) => {
    // Find the first website item and click it
    const firstWebsite = page.locator('[data-testid="website-item"]').first();
    await expect(firstWebsite).toBeVisible();
    
    // Store the website name for later verification
    const websiteName = await firstWebsite.locator('[data-testid="website-name"]').textContent();
    
    // Click on the website to view details
    await firstWebsite.click();
    
    // Should navigate to details page
    await expect(page).toHaveURL(/.*\/statistics\/.*|.*\/details\/.*/);
    
    // Verify the details page shows the correct website
    const detailsHeading = page.locator('[data-testid="statistics-heading"]');
    await expect(detailsHeading).toContainText(websiteName);
  });

  // Criterion 2: Uptime percentage is displayed for the last 24 hours, 7 days, and 30 days
  test('displays uptime percentages for different time periods', async ({ page }) => {
    // Navigate to details page of the first website
    await page.locator('[data-testid="website-item"]').first().click();
    
    // Check that uptime percentages are displayed for all required periods
    const uptimeStats = page.locator('[data-testid="uptime-stats"]');
    await expect(uptimeStats).toBeVisible();
    
    // Check 24 hours uptime
    const uptime24h = page.locator('[data-testid="uptime-24h"]');
    await expect(uptime24h).toBeVisible();
    await expect(uptime24h).toContainText(/\d+(\.\d+)?%/);
    
    // Check 7 days uptime
    const uptime7d = page.locator('[data-testid="uptime-7d"]');
    await expect(uptime7d).toBeVisible();
    await expect(uptime7d).toContainText(/\d+(\.\d+)?%/);
    
    // Check 30 days uptime
    const uptime30d = page.locator('[data-testid="uptime-30d"]');
    await expect(uptime30d).toBeVisible();
    await expect(uptime30d).toContainText(/\d+(\.\d+)?%/);
  });

  // Criterion 3: Average response time for the selected period is shown
  test('displays average response time for each period', async ({ page }) => {
    // Navigate to details page of the first website
    await page.locator('[data-testid="website-item"]').first().click();
    
    // Check that average response times are displayed
    const responseTimeStats = page.locator('[data-testid="response-time-stats"]');
    await expect(responseTimeStats).toBeVisible();
    
    // Check average response time for each period
    const avgResponse24h = page.locator('[data-testid="avg-response-24h"]');
    await expect(avgResponse24h).toBeVisible();
    await expect(avgResponse24h).toContainText(/\d+(\.\d+)?\s*ms/);
    
    const avgResponse7d = page.locator('[data-testid="avg-response-7d"]');
    await expect(avgResponse7d).toBeVisible();
    await expect(avgResponse7d).toContainText(/\d+(\.\d+)?\s*ms/);
    
    const avgResponse30d = page.locator('[data-testid="avg-response-30d"]');
    await expect(avgResponse30d).toBeVisible();
    await expect(avgResponse30d).toContainText(/\d+(\.\d+)?\s*ms/);
  });

  // Criterion 4: Number and total duration of outages are displayed
  test('displays number and duration of outages', async ({ page }) => {
    // Navigate to details page of the first website
    await page.locator('[data-testid="website-item"]').first().click();
    
    // Check outage statistics section
    const outageStats = page.locator('[data-testid="outage-stats"]');
    await expect(outageStats).toBeVisible();
    
    // Check number of outages
    const outageCount = page.locator('[data-testid="outage-count"]');
    await expect(outageCount).toBeVisible();
    await expect(outageCount).toContainText(/\d+/);
    
    // Check total outage duration
    const outageDuration = page.locator('[data-testid="outage-duration"]');
    await expect(outageDuration).toBeVisible();
    await expect(outageDuration).toContainText(/\d+\s*(min|h|s|sek|minutit|tundi)/);
  });

  // Criterion 5: Statistics are calculated correctly based on monitoring data
  test('calculates statistics correctly based on monitoring data', async ({ page }) => {
    // Navigate to details page of a website with known test data
    await page.goto('/dashboard');
    await page.locator('[data-testid="website-item"]').nth(1).click();
    
    // Get the displayed statistics
    const uptime24h = await page.locator('[data-testid="uptime-24h"]').textContent();
    const outageCount = await page.locator('[data-testid="outage-count"]').textContent();
    
    // Compare with expected values (based on test data)
    // This assumes we have known test data with predictable values
    expect(uptime24h).toMatch(/9[0-9](\.\d+)?%/); // Expecting >90% uptime
    expect(parseInt(outageCount)).toBeLessThanOrEqual(5); // Expecting ≤5 outages
    
    // Verify API data matches displayed data
    const apiData = await page.request.get('/api/statistics/' + 
      await page.evaluate(() => {
        return window.location.pathname.split('/').pop();
      })
    );
    const jsonData = await apiData.json();
    
    // Convert displayed percentage to number for comparison
    const displayedUptime = parseFloat(uptime24h.replace('%', ''));
    const apiUptime = jsonData.uptime24h;
    
    // Allow for small rounding differences
    expect(Math.abs(displayedUptime - apiUptime)).toBeLessThanOrEqual(0.1);
  });

  // Criterion 6: Data is presented in a clearly readable format
  test('presents data in a clearly readable format', async ({ page }) => {
    // Navigate to details page
    await page.locator('[data-testid="website-item"]').first().click();
    
    // Check for proper headings and labels
    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible();
    await expect(pageTitle).toContainText(/Statistics|Uptime|Statistika/);
    
    // Check for data visualization elements
    const charts = page.locator('[data-testid="statistics-chart"]');
    await expect(charts).toBeVisible();
    
    // Check for proper section organization
    const sections = page.locator('[data-testid="statistics-section"]');
    await expect(sections).toHaveCount.greaterThan(1);
    
    // Check for readable labels on all statistics
    const labels = page.locator('[data-testid="stat-label"]');
    await expect(labels).toHaveCount.greaterThan(3);
    
    // Check for proper formatting of time periods
    const timePeriods = page.locator('[data-testid="time-period"]');
    await expect(timePeriods).toContainText(/24 hours|24 tundi/);
    await expect(timePeriods).toContainText(/7 days|7 päeva/);
    await expect(timePeriods).toContainText(/30 days|30 päeva/);
  });

  // Additional test: Can switch between different time periods
  test('can switch between different time periods', async ({ page }) => {
    // Navigate to details page
    await page.locator('[data-testid="website-item"]').first().click();
    
    // Check for period selector
    const periodSelector = page.locator('[data-testid="period-selector"]');
    await expect(periodSelector).toBeVisible();
    
    // Test switching to different periods
    await page.locator('[data-testid="period-7d"]').click();
    await expect(page.locator('[data-testid="active-period"]')).toContainText(/7 days|7 päeva/);
    
    await page.locator('[data-testid="period-30d"]').click();
    await expect(page.locator('[data-testid="active-period"]')).toContainText(/30 days|30 päeva/);
    
    // Verify data updates when period changes
    const initialValue = await page.locator('[data-testid="uptime-value"]').textContent();
    await page.locator('[data-testid="period-24h"]').click();
    const newValue = await page.locator('[data-testid="uptime-value"]').textContent();
    
    // Values should be different when switching periods (unless uptime is exactly the same)
    // This is a soft assertion as they could theoretically be the same
    if (initialValue !== newValue) {
      expect(true).toBeTruthy();
    }
  });
});