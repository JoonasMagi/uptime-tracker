/**
 * Playwright tests for site down notifications - TDD approach
 * Testing ALL acceptance criteria for User Story 4: "Site Down Notifications"
 * 
 * Acceptance Criteria:
 * 1. The system detects when a site doesn't respond for 3 consecutive checks
 * 2. I can configure an email address for receiving notifications
 * 3. I can choose which sites I want to receive notifications for
 * 4. Notification is sent within 5 minutes after problem detection
 * 5. The notification includes site name, URL, and the problem
 * 6. I receive a notification later when the site is available again
 */

const { test, expect } = require('@playwright/test');

test.describe('User Story 4: Site Down Notifications', () => {

  // Reset data before each test to ensure consistent state
  test.beforeEach(async ({ page }) => {
    // Reset to known mock data state
    await page.request.post('/reset-data');
    await page.goto('/dashboard');
  });

  // Criterion 1: The system detects when a site doesn't respond for 3 consecutive checks
  test('system detects site unavailability after 3 consecutive failed checks', async ({ page }) => {
    // Navigate to notification settings
    await page.goto('/settings/notifications');

    // Check that the system is configured to detect after 3 consecutive failures
    const consecutiveFailsInput = page.locator('[data-testid="consecutive-fails-input"]');
    await expect(consecutiveFailsInput).toBeVisible();
    await expect(consecutiveFailsInput).toHaveValue('3');

    // Simulate site going down with API call
    const response = await page.request.post('/api/test/simulate-downtime', {
      data: {
        siteId: 'test-site-1',
        consecutiveFailures: 3
      }
    });
    expect(response.ok()).toBeTruthy();

    // Check notification log to verify detection
    await page.goto('/notifications/log');
    const notificationLog = page.locator('[data-testid="notification-log-item"]').first();
    await expect(notificationLog).toBeVisible();
    await expect(notificationLog).toContainText('Problem detected after 3 consecutive failures');
  });

  // Criterion 2: I can configure an email address for receiving notifications
  test('can configure email address for notifications', async ({ page }) => {
    // Navigate to notification settings
    await page.goto('/settings/notifications');

    // Check that email input exists
    const emailInput = page.locator('[data-testid="notification-email-input"]');
    await expect(emailInput).toBeVisible();

    // Enter and save email
    await emailInput.fill('test@example.com');
    await page.locator('[data-testid="save-notification-settings"]').click();

    // Verify success message
    const successMessage = page.locator('[data-testid="settings-success-message"]');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText('Notification settings saved');

    // Reload page and verify email persisted
    await page.reload();
    await expect(emailInput).toHaveValue('test@example.com');
  });

  // Criterion 3: I can choose which sites I want to receive notifications for
  test('can select specific sites for notifications', async ({ page }) => {
    // Navigate to notification settings
    await page.goto('/settings/notifications');

    // Check that site selection exists
    const siteSelectionSection = page.locator('[data-testid="notification-sites-selection"]');
    await expect(siteSelectionSection).toBeVisible();

    // Get all site checkboxes
    const siteCheckboxes = page.locator('[data-testid="site-notification-checkbox"]');
    const checkboxCount = await siteCheckboxes.count();
    expect(checkboxCount).toBeGreaterThan(0);

    // Select first and third sites (if available)
    await siteCheckboxes.first().check();
    if (await siteCheckboxes.count() >= 3) {
      await siteCheckboxes.nth(2).check();
    }

    // Save settings
    await page.locator('[data-testid="save-notification-settings"]').click();

    // Wait for redirect and success message
    await page.waitForURL(/\/settings\/notifications\?success=true/);
    const successMessage = page.locator('[data-testid="settings-success-message"]');
    await expect(successMessage).toBeVisible();

    // Verify selections persisted after the redirect
    const siteCheckboxesAfterSave = page.locator('[data-testid="site-notification-checkbox"]');
    await expect(siteCheckboxesAfterSave.first()).toBeChecked();
    if (await siteCheckboxesAfterSave.count() >= 3) {
      await expect(siteCheckboxesAfterSave.nth(2)).toBeChecked();
    }
  });

  // Criterion 4: Notification is sent within 5 minutes after problem detection
  test('sends notification within 5 minutes of problem detection', async ({ page }) => {
    // This test uses a mock to simulate time and verify notification timing

    // Configure notifications first
    await page.goto('/settings/notifications');
    await page.locator('[data-testid="notification-email-input"]').fill('test@example.com');
    await page.locator('[data-testid="site-notification-checkbox"]').first().check();
    await page.locator('[data-testid="save-notification-settings"]').click();

    // Simulate site going down
    const downTime = new Date().toISOString();
    const response = await page.request.post('/api/test/simulate-downtime', {
      data: {
        siteId: 'test-site-1',
        timestamp: downTime
      }
    });
    expect(response.ok()).toBeTruthy();

    // Check notification log with timing information
    await page.goto('/notifications/log');

    // Use polling to wait for notification to appear (may take some time)
    await expect.poll(async () => {
      await page.reload();
      const logItem = page.locator('[data-testid="notification-log-item"]').first();
      return await logItem.isVisible();
    }, {
      timeout: 30000, // 30 second timeout for test
      intervals: [1000, 2000, 5000] // Check at increasing intervals
    }).toBeTruthy();

    // Get detection and notification timestamps
    const logItem = page.locator('[data-testid="notification-log-item"]').first();
    const detectionTime = await logItem.getAttribute('data-detection-time');
    const notificationTime = await logItem.getAttribute('data-notification-time');

    // Calculate time difference in minutes
    const detectionDate = new Date(detectionTime);
    const notificationDate = new Date(notificationTime);
    const timeDiffMinutes = (notificationDate - detectionDate) / (1000 * 60);

    // Verify notification was sent within 5 minutes
    expect(timeDiffMinutes).toBeLessThanOrEqual(5);
  });

  // Criterion 5: The notification includes site name, URL, and the problem
  test('notification includes site details and problem description', async ({ page }) => {
    // Configure notifications
    await page.goto('/settings/notifications');
    await page.locator('[data-testid="notification-email-input"]').fill('test@example.com');
    await page.locator('[data-testid="site-notification-checkbox"]').first().check();
    await page.locator('[data-testid="save-notification-settings"]').click();

    // Get site details for later verification
    await page.goto('/dashboard');
    const siteName = await page.locator('[data-testid="website-item"]').first().locator('[data-testid="website-name"]').textContent();
    const siteUrl = await page.locator('[data-testid="website-item"]').first().locator('[data-testid="website-url"]').textContent();

    // Simulate site going down
    await page.request.post('/api/test/simulate-downtime', {
      data: { siteId: 'test-site-1' }
    });

    // Check notification content in the notification preview or log
    await page.goto('/notifications/log');

    // Use polling to wait for notification to appear
    await expect.poll(async () => {
      await page.reload();
      const notificationContent = page.locator('[data-testid="notification-content"]').first();
      return await notificationContent.isVisible();
    }, {
      timeout: 30000
    }).toBeTruthy();

    const notificationContent = page.locator('[data-testid="notification-content"]').first();

    // Verify notification contains required information
    await expect(notificationContent).toContainText(siteName);
    await expect(notificationContent).toContainText(siteUrl);
    await expect(notificationContent).toContainText(/down|unavailable|offline/i);
    await expect(notificationContent).toContainText(/error|problem|issue/i);
  });

  // Criterion 6: I receive a notification later when the site is available again
  test('sends recovery notification when site becomes available again', async ({ page }) => {
    // Configure notifications
    await page.goto('/settings/notifications');
    await page.locator('[data-testid="notification-email-input"]').fill('test@example.com');
    await page.locator('[data-testid="site-notification-checkbox"]').first().check();
    await page.locator('[data-testid="save-notification-settings"]').click();

    // Simulate site going down and then up
    await page.request.post('/api/test/simulate-downtime', {
      data: { siteId: 'test-site-1' }
    });

    // Wait briefly to simulate time passing
    await page.waitForTimeout(1000);

    // Simulate site recovery
    await page.request.post('/api/test/simulate-recovery', {
      data: { siteId: 'test-site-1' }
    });

    // Check notification log for both down and recovery notifications
    await page.goto('/notifications/log');

    // Use polling to wait for recovery notification to appear
    await expect.poll(async () => {
      await page.reload();
      const recoveryNotifications = page.locator('[data-testid="notification-content"]:has-text("recovered")');
      return await recoveryNotifications.count() > 0;
    }, {
      timeout: 30000
    }).toBeTruthy();

    // Verify we have both down and recovery notifications
    const downNotifications = page.locator('[data-testid="notification-content"]:has-text("down")');
    const recoveryNotifications = page.locator('[data-testid="notification-content"]:has-text("recovered")');

    expect(await downNotifications.count()).toBeGreaterThan(0);
    expect(await recoveryNotifications.count()).toBeGreaterThan(0);

    // Verify recovery notification contains site information
    const recoveryNotification = recoveryNotifications.first();

    // Check that recovery notification contains site name and recovery terms
    await expect(recoveryNotification).toContainText('Google'); // Site name
    await expect(recoveryNotification).toContainText(/recovered|available|online|up/i);
  });

  // Additional test: Notification preferences are respected
  test('respects notification preferences for different sites', async ({ page }) => {
    // Configure notifications for only the first site
    await page.goto('/settings/notifications');
    await page.locator('[data-testid="notification-email-input"]').fill('test@example.com');

    // Uncheck all sites first
    const allCheckboxes = page.locator('[data-testid="site-notification-checkbox"]');
    for (let i = 0; i < await allCheckboxes.count(); i++) {
      await allCheckboxes.nth(i).uncheck();
    }

    // Check only the first site
    await allCheckboxes.first().check();
    await page.locator('[data-testid="save-notification-settings"]').click();

    // Simulate both first and second sites going down
    await page.request.post('/api/test/simulate-downtime', {
      data: {
        siteId: 'test-site-1',
        consecutiveFailures: 3
      }
    });

    await page.request.post('/api/test/simulate-downtime', {
      data: {
        siteId: 'test-site-2',
        consecutiveFailures: 3
      }
    });

    // Check notification log
    await page.goto('/notifications/log');

    // Use polling to wait for notifications to be processed
    await expect.poll(async () => {
      await page.reload();
      const notificationItems = page.locator('[data-testid="notification-log-item"]');
      return await notificationItems.count() > 0;
    }, {
      timeout: 30000
    }).toBeTruthy();

    // Get site names
    await page.goto('/dashboard');
    const firstSiteName = await page.locator('[data-testid="website-item"]').first().locator('[data-testid="website-name"]').textContent();
    const secondSiteName = await page.locator('[data-testid="website-item"]').nth(1).locator('[data-testid="website-name"]').textContent();

    // Go back to notification log
    await page.goto('/notifications/log');

    // Verify we have notification for first site but not second site
    const firstSiteNotifications = page.locator(`[data-testid="notification-content"]:has-text("${firstSiteName}")`);
    const secondSiteNotifications = page.locator(`[data-testid="notification-content"]:has-text("${secondSiteName}")`);

    expect(await firstSiteNotifications.count()).toBeGreaterThan(0);
    await expect(secondSiteNotifications).toHaveCount(0);
  });
});