/**
 * Playwright tests for website monitoring functionality - TDD approach
 * Testing ALL acceptance criteria for User Story 1: "Veebisaidi monitooringu lisamine"
 *
 * Acceptance Criteria:
 * 1. Saan sisestada veebisaidi URL-i (nt. https://example.com)
 * 2. Saan määrata kontrolli intervalli (1 min, 5 min, 15 min, 30 min, 1 tund)
 * 3. Saan anda saidile nime/kirjelduse
 * 4. Süsteem valideerib URL-i formaadi õigsust
 * 5. Saan salvestada monitooringu konfiguratsiooni
 * 6. Kuvatakse kinnitus monitooringu edukast lisamisest
 */

const { test, expect } = require('@playwright/test');

test.describe('User Story 1: Add Website Monitoring', () => {

  // Criterion 1: Saan sisestada veebisaidi URL-i (nt. https://example.com)
  test('can input website URL', async ({ page }) => {
    await page.goto('/');

    const urlInput = page.locator('input[data-testid="url-input"]');
    await expect(urlInput).toBeVisible();
    await expect(urlInput).toHaveAttribute('type', 'url');
    await expect(urlInput).toHaveAttribute('placeholder', 'Enter website URL (e.g., https://example.com)');

    const testUrl = 'https://example.com';
    await urlInput.fill(testUrl);
    await expect(urlInput).toHaveValue(testUrl);
  });

  // Criterion 2: Saan määrata kontrolli intervalli (1 min, 5 min, 15 min, 30 min, 1 tund)
  test('can select monitoring interval', async ({ page }) => {
    await page.goto('/');

    const intervalSelect = page.locator('select[data-testid="interval-select"]');
    await expect(intervalSelect).toBeVisible();

    // Check all required interval options exist
    await expect(intervalSelect.locator('option[value="1"]')).toHaveText('1 minut');
    await expect(intervalSelect.locator('option[value="5"]')).toHaveText('5 minutit');
    await expect(intervalSelect.locator('option[value="15"]')).toHaveText('15 minutit');
    await expect(intervalSelect.locator('option[value="30"]')).toHaveText('30 minutit');
    await expect(intervalSelect.locator('option[value="60"]')).toHaveText('1 tund');

    // Test selecting an interval
    await intervalSelect.selectOption('5');
    await expect(intervalSelect).toHaveValue('5');
  });

  // Criterion 3: Saan anda saidile nime/kirjelduse
  test('can input website name and description', async ({ page }) => {
    await page.goto('/');

    const nameInput = page.locator('input[data-testid="website-name"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveAttribute('placeholder', 'Website name (e.g., My Blog)');

    const descriptionInput = page.locator('textarea[data-testid="website-description"]');
    await expect(descriptionInput).toBeVisible();
    await expect(descriptionInput).toHaveAttribute('placeholder', 'Optional description');

    // Test inputting name and description
    await nameInput.fill('Test Website');
    await descriptionInput.fill('This is a test website for monitoring');

    await expect(nameInput).toHaveValue('Test Website');
    await expect(descriptionInput).toHaveValue('This is a test website for monitoring');
  });

  // Criterion 4: Süsteem valideerib URL-i formaadi õigsust
  test('validates URL format', async ({ page }) => {
    await page.goto('/');

    const urlInput = page.locator('input[data-testid="url-input"]');
    const submitButton = page.locator('button[data-testid="add-website-btn"]');
    const errorMessage = page.locator('[data-testid="url-error"]');

    // Test invalid URL
    await urlInput.fill('invalid-url');
    await submitButton.click();

    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText('Palun sisestage kehtiv URL (nt. https://example.com)');

    // Test valid URL should not show error
    await urlInput.fill('https://example.com');
    await expect(errorMessage).not.toBeVisible();
  });

  // Criterion 5: Saan salvestada monitooringu konfiguratsiooni
  test('can save monitoring configuration', async ({ page }) => {
    await page.goto('/');

    const form = page.locator('form[data-testid="add-website-form"]');
    const submitButton = page.locator('button[data-testid="add-website-btn"]');

    await expect(form).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveText('Lisa monitooringusse');

    // Fill out the form
    await page.locator('input[data-testid="url-input"]').fill('https://example.com');
    await page.locator('input[data-testid="website-name"]').fill('Example Site');
    await page.locator('select[data-testid="interval-select"]').selectOption('5');

    // Submit the form
    await submitButton.click();

    // Should redirect or show success (will fail in RED phase)
    await expect(page).toHaveURL(/.*\/success|.*\/dashboard/);
  });

  // Criterion 6: Kuvatakse kinnitus monitooringu edukast lisamisest
  test('shows confirmation after successful monitoring setup', async ({ page }) => {
    await page.goto('/');

    // Fill and submit form
    await page.locator('input[data-testid="url-input"]').fill('https://example.com');
    await page.locator('input[data-testid="website-name"]').fill('Example Site');
    await page.locator('select[data-testid="interval-select"]').selectOption('5');
    await page.locator('button[data-testid="add-website-btn"]').click();

    // Check for success message
    const successMessage = page.locator('[data-testid="success-message"]');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText('Monitooring edukalt lisatud');
    await expect(successMessage).toContainText('Example Site');
    await expect(successMessage).toContainText('https://example.com');
  });

  // Additional test: Complete form validation
  test('form requires all mandatory fields', async ({ page }) => {
    await page.goto('/');

    const submitButton = page.locator('button[data-testid="add-website-btn"]');

    // Try to submit empty form
    await submitButton.click();

    // Should show validation errors
    const urlError = page.locator('[data-testid="url-required-error"]');
    const nameError = page.locator('[data-testid="name-required-error"]');

    await expect(urlError).toBeVisible();
    await expect(urlError).toHaveText('URL on kohustuslik');
    await expect(nameError).toBeVisible();
    await expect(nameError).toHaveText('Veebisaidi nimi on kohustuslik');
  });

});
