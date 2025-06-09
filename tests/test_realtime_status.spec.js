/**
 * Playwright tests for realtime status monitoring - TDD approach
 * Testing ALL acceptance criteria for User Story 2: "Reaalajas staatuse vaatamine"
 * 
 * Acceptance Criteria:
 * 1. Kuvatakse kõik monitooritavad saidid loendina
 * 2. Iga saidi juures on nähtav praegune staatus (ONLINE/OFFLINE/UNKNOWN)
 * 3. Kuvatakse viimase kontrolli aeg
 * 4. Kuvatakse vastuse aeg millisekundites
 * 5. Online saidid on roheliselt märgitud
 * 6. Offline saidid on punaselt märgitud
 * 7. Leht uueneb automaatselt iga 30 sekundi järel
 */

const { test, expect } = require('@playwright/test');

test.describe('User Story 2: Realtime Status Monitoring', () => {
  
  // Reset data before each test to ensure consistent state
  test.beforeEach(async ({ page }) => {
    // Reset to known mock data state
    await page.request.post('/reset-data');
  });
  
  // Criterion 1: Kuvatakse kõik monitooritavad saidid loendina
  test('displays all monitored websites in a list', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that the websites list container exists
    const websitesList = page.locator('[data-testid="websites-list"]');
    await expect(websitesList).toBeVisible();
    
    // Check that individual website items are displayed
    const websiteItems = page.locator('[data-testid="website-item"]');
    await expect(websiteItems).toHaveCount(3); // Assuming 3 test websites
    
    // Check that each website item contains required information
    const firstWebsite = websiteItems.first();
    await expect(firstWebsite).toBeVisible();
    await expect(firstWebsite.locator('[data-testid="website-name"]')).toBeVisible();
    await expect(firstWebsite.locator('[data-testid="website-url"]')).toBeVisible();
  });

  // Criterion 2: Iga saidi juures on nähtav praegune staatus (ONLINE/OFFLINE/UNKNOWN)
  test('shows current status for each website', async ({ page }) => {
    await page.goto('/dashboard');
    
    const websiteItems = page.locator('[data-testid="website-item"]');
    
    // Check first website has status
    const firstWebsite = websiteItems.first();
    const statusElement = firstWebsite.locator('[data-testid="website-status"]');
    await expect(statusElement).toBeVisible();
    
    // Status should be one of the valid values
    const statusText = await statusElement.textContent();
    expect(['ONLINE', 'OFFLINE', 'UNKNOWN']).toContain(statusText);
    
    // Check that status has appropriate data attribute for styling
    await expect(statusElement).toHaveAttribute('data-status', /^(online|offline|unknown)$/);
  });

  // Criterion 3: Kuvatakse viimase kontrolli aeg
  test('displays last check time for each website', async ({ page }) => {
    await page.goto('/dashboard');
    
    const websiteItems = page.locator('[data-testid="website-item"]');
    const firstWebsite = websiteItems.first();
    
    const lastCheckElement = firstWebsite.locator('[data-testid="last-check-time"]');
    await expect(lastCheckElement).toBeVisible();
    
    // Should display time in readable format
    const timeText = await lastCheckElement.textContent();
    expect(timeText).toMatch(/\d{2}:\d{2}:\d{2}|\d+ minutit tagasi|Mitte kunagi/);
    
    // Should have proper label
    await expect(lastCheckElement).toContainText('Viimane kontroll:');
  });

  // Criterion 4: Kuvatakse vastuse aeg millisekundites
  test('displays response time in milliseconds', async ({ page }) => {
    await page.goto('/dashboard');
    
    const websiteItems = page.locator('[data-testid="website-item"]');
    const firstWebsite = websiteItems.first();
    
    const responseTimeElement = firstWebsite.locator('[data-testid="response-time"]');
    await expect(responseTimeElement).toBeVisible();
    
    // Should display response time with ms unit
    const responseText = await responseTimeElement.textContent();
    expect(responseText).toMatch(/\d+\s*ms|N\/A/);
    
    // Should have proper label
    await expect(responseTimeElement).toContainText('Vastuse aeg:');
  });

  // Criterion 5: Online saidid on roheliselt märgitud
  test('online websites are marked in green', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find an online website (assuming test data exists)
    const onlineWebsite = page.locator('[data-testid="website-item"][data-status="online"]').first();
    await expect(onlineWebsite).toBeVisible();
    
    // Check that the status element has green styling
    const statusElement = onlineWebsite.locator('[data-testid="website-status"]');
    await expect(statusElement).toHaveClass(/.*green.*|.*online.*|.*success.*/);
    
    // Check computed style (green color)
    const statusColor = await statusElement.evaluate(el => getComputedStyle(el).color);
    expect(statusColor).toMatch(/rgb\(.*0.*255.*0.*\)|green|#.*0.*f.*0.*/i);
  });

  // Criterion 6: Offline saidid on punaselt märgitud
  test('offline websites are marked in red', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find an offline website (assuming test data exists)
    const offlineWebsite = page.locator('[data-testid="website-item"][data-status="offline"]').first();
    await expect(offlineWebsite).toBeVisible();
    
    // Check that the status element has red styling
    const statusElement = offlineWebsite.locator('[data-testid="website-status"]');
    await expect(statusElement).toHaveClass(/.*red.*|.*offline.*|.*error.*|.*danger.*/);
    
    // Check computed style (red color)
    const statusColor = await statusElement.evaluate(el => getComputedStyle(el).color);
    expect(statusColor).toMatch(/rgb\(255.*0.*0.*\)|red|#.*f.*0.*0.*/i);
  });

  // Criterion 7: Leht uueneb automaatselt iga 30 sekundi järel
  test('page auto-refreshes every 30 seconds', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that auto-refresh is enabled
    const autoRefreshIndicator = page.locator('[data-testid="auto-refresh-indicator"]');
    await expect(autoRefreshIndicator).toBeVisible();
    await expect(autoRefreshIndicator).toContainText('Automaatne uuendamine: 30s');
    
    // Check for refresh timer countdown
    const refreshTimer = page.locator('[data-testid="refresh-timer"]');
    await expect(refreshTimer).toBeVisible();
    
    // Wait a bit and check that timer is counting down
    const initialTime = await refreshTimer.textContent();
    await page.waitForTimeout(2000); // Wait 2 seconds
    const laterTime = await refreshTimer.textContent();
    
    expect(parseInt(laterTime)).toBeLessThan(parseInt(initialTime));
  });

  // Additional test: Dashboard navigation and layout
  test('dashboard has proper navigation and layout', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check page title
    await expect(page).toHaveTitle(/.*Dashboard.*|.*Monitooring.*/);
    
    // Check main heading
    const heading = page.locator('h1, h2').first();
    await expect(heading).toContainText('Monitooritavad veebisaidid');
    
    // Check navigation back to add website
    const addWebsiteLink = page.locator('[data-testid="add-website-link"]');
    await expect(addWebsiteLink).toBeVisible();
    await expect(addWebsiteLink).toHaveText('Lisa uus veebisait');
  });

  // Additional test: Empty state when no websites
  test('shows empty state when no websites are monitored', async ({ page }) => {
    // Navigate to dashboard with no websites (assuming clean state)
    await page.goto('/dashboard?empty=true');
    
    const emptyState = page.locator('[data-testid="empty-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('Pole veel ühtegi veebisaiti lisatud');
    
    const addFirstWebsiteButton = page.locator('[data-testid="add-first-website-btn"]');
    await expect(addFirstWebsiteButton).toBeVisible();
    await expect(addFirstWebsiteButton).toHaveText('Lisa esimene veebisait');
  });

});
