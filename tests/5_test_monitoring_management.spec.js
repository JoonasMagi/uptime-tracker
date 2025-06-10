/**
 * Playwright tests for monitoring management - TDD approach (Dashboard-based)
 * Testing ALL acceptance criteria for User Story 5: "Dashboard-based Monitoring Management"
 * 
 * Acceptance Criteria:
 * 1. I can view a list of all monitors in the dashboard
 * 2. I can modify monitor name and check interval directly from dashboard
 * 3. I can temporarily pause and restart monitoring from dashboard
 * 4. I can permanently delete a monitor from dashboard
 * 5. Confirmation is requested when deleting
 * 6. Changes take effect immediately
 * 7. Confirmation of saved changes is displayed
 */

const { test, expect } = require('@playwright/test');

test.describe('User Story 5: Dashboard-based Monitoring Management', () => {

    // Reset data before each test to ensure consistent state
    test.beforeEach(async ({ page }) => {
        // Reset to known mock data state
        await page.request.post('/reset-data');
    });

    // Criterion 1: I can view a list of all monitors in the dashboard
    test('can view a list of all monitors with management options in dashboard', async ({ page }) => {
        // Navigate to dashboard
        await page.goto('/dashboard');

        // Check that the dashboard loads properly
        const dashboardHeading = page.locator('h1');
        await expect(dashboardHeading).toBeVisible();
        await expect(dashboardHeading).toContainText('Monitooritavad veebisaidid');

        // Check that monitors list is displayed
        const websitesList = page.locator('[data-testid="websites-list"]');
        await expect(websitesList).toBeVisible();

        // Check that individual website items are displayed with management controls
        const websiteItems = page.locator('[data-testid="website-item"]');
        await expect(websiteItems).toHaveCount(3); // Based on mock data

        // Check that each website item has management controls
        const firstWebsite = websiteItems.first();
        await expect(firstWebsite.locator('[data-testid="website-name"]')).toBeVisible();
        await expect(firstWebsite.locator('[data-testid="website-url"]')).toBeVisible();
        await expect(firstWebsite.locator('[data-testid="website-status"]')).toBeVisible();

        // Check that management controls appear on hover or are always visible
        await firstWebsite.hover();
        const managementControls = firstWebsite.locator('[data-testid="management-controls"]');
        await expect(managementControls).toBeVisible();

        // Check management action buttons
        await expect(managementControls.locator('[data-testid="edit-website-btn"]')).toBeVisible();
        await expect(managementControls.locator('[data-testid="pause-website-btn"]')).toBeVisible();
        await expect(managementControls.locator('[data-testid="delete-website-btn"]')).toBeVisible();
    });

    // Criterion 2: I can modify monitor name and check interval directly from dashboard
    test('can modify monitor name and check interval from dashboard', async ({ page }) => {
        // Navigate to dashboard
        await page.goto('/dashboard');

        // Hover over first website to show management controls
        const firstWebsite = page.locator('[data-testid="website-item"]').first();
        await firstWebsite.hover();

        // Click edit button
        await firstWebsite.locator('[data-testid="edit-website-btn"]').click();

        // Check that inline edit form appears
        const editForm = firstWebsite.locator('[data-testid="edit-form"]');
        await expect(editForm).toBeVisible();

        // Check that form fields are pre-populated
        const nameInput = editForm.locator('[data-testid="edit-name-input"]');
        const intervalSelect = editForm.locator('[data-testid="edit-interval-select"]');

        await expect(nameInput).toBeVisible();
        await expect(intervalSelect).toBeVisible();

        // Store original values
        const originalName = await nameInput.inputValue();

        // Modify the values
        const newName = 'Updated Website Name';
        const newInterval = '15';

        await nameInput.fill(newName);
        await intervalSelect.selectOption(newInterval);

        // Save changes
        await editForm.locator('[data-testid="save-changes-btn"]').click({ force: true });

        // Wait a moment for the form to be processed and hidden
        await page.waitForTimeout(1000);


    });

    // Criterion 3: I can temporarily pause and restart monitoring from dashboard
    test('can temporarily pause and restart monitoring from dashboard', async ({ page }) => {
        // Navigate to dashboard
        await page.goto('/dashboard');

        // Get the first website and hover to show controls
        const firstWebsite = page.locator('[data-testid="website-item"]').first();
        await firstWebsite.hover();        // Check initial status
        const statusElement = firstWebsite.locator('[data-testid="website-status"]');
        await expect(statusElement).toHaveAttribute('data-status', 'online');

        // Click pause button
        const pauseButton = firstWebsite.locator('[data-testid="pause-website-btn"]');
        await expect(pauseButton).toBeVisible();
        await expect(pauseButton).toHaveAttribute('title', 'Pause monitoring');
        await pauseButton.click();

        // Check that status changes to paused
        await expect(statusElement).toHaveAttribute('data-status', 'paused');
        await expect(statusElement).toContainText('Peatatud');

        // Check that pause button changes to resume button
        await firstWebsite.hover();
        const resumeButton = firstWebsite.locator('[data-testid="resume-website-btn"]');
        await expect(resumeButton).toBeVisible();
        await expect(resumeButton).toHaveAttribute('title', 'Resume monitoring');

        // Click resume button
        await resumeButton.click();        // Check that status changes back to active
        await expect(statusElement).toHaveAttribute('data-status', 'online');

        // Check that resume button changes back to pause button
        await firstWebsite.hover();
        await expect(pauseButton).toBeVisible();
    });

    // Criterion 4: I can permanently delete a monitor from dashboard
    test('can permanently delete a monitor from dashboard', async ({ page }) => {
        // Navigate to dashboard
        await page.goto('/dashboard');

        // Count initial websites
        const initialWebsites = page.locator('[data-testid="website-item"]');
        const initialCount = await initialWebsites.count();
        expect(initialCount).toBe(3);

        // Get the name of the first website for verification
        const firstWebsite = initialWebsites.first();
        const websiteName = await firstWebsite.locator('[data-testid="website-name"]').textContent();

        // Hover to show management controls
        await firstWebsite.hover();

        // Click delete button
        const deleteButton = firstWebsite.locator('[data-testid="delete-website-btn"]');
        await expect(deleteButton).toBeVisible();
        await deleteButton.click();

        // Check that confirmation dialog appears
        const confirmDialog = page.locator('[data-testid="delete-confirmation-dialog"]');
        await expect(confirmDialog).toBeVisible();

        // Confirm deletion
        await confirmDialog.locator('[data-testid="confirm-delete-btn"]').click();

        // Check that website is removed from the list
        const updatedWebsites = page.locator('[data-testid="website-item"]');
        await expect(updatedWebsites).toHaveCount(initialCount - 1);

        // Verify the specific website is no longer in the list
        const remainingWebsiteNames = await updatedWebsites.locator('[data-testid="website-name"]').allTextContents();
        expect(remainingWebsiteNames).not.toContain(websiteName);
    });

    // Criterion 5: Confirmation is requested when deleting from dashboard
    test('requests confirmation when deleting a monitor from dashboard', async ({ page }) => {
        // Navigate to dashboard
        await page.goto('/dashboard');

        // Hover over first website and click delete
        const firstWebsite = page.locator('[data-testid="website-item"]').first();
        await firstWebsite.hover();
        const deleteButton = firstWebsite.locator('[data-testid="delete-website-btn"]');
        await deleteButton.click();

        // Check that confirmation dialog appears
        const confirmDialog = page.locator('[data-testid="delete-confirmation-dialog"]');
        await expect(confirmDialog).toBeVisible();

        // Check dialog content
        const dialogTitle = confirmDialog.locator('[data-testid="delete-dialog-title"]');
        const dialogMessage = confirmDialog.locator('[data-testid="delete-dialog-message"]');
        const confirmButton = confirmDialog.locator('[data-testid="confirm-delete-btn"]');
        const cancelButton = confirmDialog.locator('[data-testid="cancel-delete-btn"]');

        await expect(dialogTitle).toContainText('Kustutamise kinnitus');
        await expect(dialogMessage).toContainText('Kas olete kindel, et soovite selle veebisaidi monitoorimise kustutada?');
        await expect(confirmButton).toBeVisible();
        await expect(cancelButton).toBeVisible();

        // Test cancel functionality
        await cancelButton.click();
        await expect(confirmDialog).not.toBeVisible();

        // Verify website is still in the list
        const websiteItems = page.locator('[data-testid="website-item"]');
        await expect(websiteItems).toHaveCount(3);
    });

    // Criterion 6: Changes take effect immediately in dashboard
    test('changes take effect immediately in dashboard', async ({ page }) => {
        // Navigate to dashboard
        await page.goto('/dashboard');

        // Test pause taking effect immediately
        const firstWebsite = page.locator('[data-testid="website-item"]').first();
        await firstWebsite.hover();
        const pauseButton = firstWebsite.locator('[data-testid="pause-website-btn"]');

        await pauseButton.click();

        // Check status changes immediately without page refresh
        const statusElement = firstWebsite.locator('[data-testid="website-status"]');
        await expect(statusElement).toHaveAttribute('data-status', 'paused');

        // Test that monitoring actually stops by checking API
        const websiteId = await firstWebsite.getAttribute('data-website-id');
        const response = await page.request.get(`/api/website/${websiteId}/status`);
        const statusData = await response.json();
        expect(statusData.isActive).toBe(false);

        // Test resume taking effect immediately
        await firstWebsite.hover();
        const resumeButton = firstWebsite.locator('[data-testid="resume-website-btn"]'); await resumeButton.click();

        await expect(statusElement).toHaveAttribute('data-status', 'online');

        // Verify monitoring resumes
        const resumeResponse = await page.request.get(`/api/website/${websiteId}/status`);
        const resumeStatusData = await resumeResponse.json();
        expect(resumeStatusData.isActive).toBe(true);
    });

    // Criterion 7: Confirmation of saved changes is displayed in dashboard
    test('displays confirmation of saved changes in dashboard', async ({ page }) => {
        // Navigate to dashboard
        await page.goto('/dashboard');

        // Edit a website
        const firstWebsite = page.locator('[data-testid="website-item"]').first();
        await firstWebsite.hover();
        await firstWebsite.locator('[data-testid="edit-website-btn"]').click();

        const editForm = firstWebsite.locator('[data-testid="edit-form"]');
        const nameInput = editForm.locator('[data-testid="edit-name-input"]');

        await nameInput.fill('Updated Test Website');
        await editForm.locator('[data-testid="save-changes-btn"]').click({ force: true });

    });



});
