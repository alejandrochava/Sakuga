import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to all main pages', async ({ page }) => {
    await page.goto('/');

    // Verify we're on the Generate page
    await expect(page).toHaveTitle(/Sakuga/);
    await expect(page.locator('h1')).toContainText('Sakuga');

    // Navigate to History
    await page.click('text=History');
    await expect(page.locator('h2')).toContainText('History');

    // Navigate to Collections
    await page.click('text=Collections');
    await expect(page.locator('h2')).toContainText('Collections');

    // Navigate to Queue
    await page.click('text=Queue');
    await expect(page.locator('h2')).toContainText('Queue');

    // Navigate to Stats
    await page.click('text=Stats');
    await expect(page.locator('h2')).toContainText('Statistics');

    // Navigate to Settings
    await page.click('text=Settings');
    await expect(page.locator('h2')).toContainText('Settings');

    // Navigate to Help
    await page.click('text=Help');
    await expect(page.locator('h2')).toContainText('Help');

    // Navigate back to Generate
    await page.click('text=Generate');
    await expect(page.locator('h2')).toContainText('Generate Image');
  });

  test('should have working mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Desktop nav should be hidden
    await expect(page.locator('nav.hidden.md\\:flex')).toBeHidden();

    // Mobile menu button should be visible
    const menuButton = page.locator('button.md\\:hidden');
    await expect(menuButton).toBeVisible();

    // Click to open menu
    await menuButton.click();

    // Menu drawer should be visible
    await expect(page.locator('nav.md\\:hidden.fixed')).toBeVisible();

    // Navigate via mobile menu
    await page.click('nav.fixed >> text=History');
    await expect(page.locator('h2')).toContainText('History');
  });
});
