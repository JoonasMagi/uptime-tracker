/**
 * Playwright test for website monitoring functionality - TDD approach
 * Testing the first acceptance criterion: User can input website URL
 */

const { test, expect } = require('@playwright/test');

test.describe('Add Website Monitoring', () => {
  
  test('URL input field exists and is visible', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Check that URL input field exists
    const urlInput = page.locator('input[data-testid="url-input"]');
    await expect(urlInput).toBeVisible();
    
    // Check that input has appropriate placeholder
    await expect(urlInput).toHaveAttribute('placeholder', 'Enter website URL (e.g., https://example.com)');
    
    // Check that input has correct type
    await expect(urlInput).toHaveAttribute('type', 'url');
  });

  test('can input website URL', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Find the URL input field
    const urlInput = page.locator('input[data-testid="url-input"]');
    
    // Input a test URL
    const testUrl = 'https://example.com';
    await urlInput.fill(testUrl);
    
    // Verify the URL was entered correctly
    await expect(urlInput).toHaveValue(testUrl);
  });

  test('form has submit button', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Check that submit button exists
    const submitButton = page.locator('button[data-testid="add-website-btn"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveText('Lisa monitooringusse');
  });

});
