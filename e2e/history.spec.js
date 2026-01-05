import { test, expect } from '@playwright/test';

test.describe('History Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/history');
  });

  test('should display history heading', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('History');
  });

  test('should have filter controls', async ({ page }) => {
    // Search input
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();

    // Filter dropdowns
    await expect(page.locator('text=All Types')).toBeVisible();
    await expect(page.locator('text=All Providers')).toBeVisible();
  });

  test('should have compare button', async ({ page }) => {
    await expect(page.locator('button:has-text("Compare")')).toBeVisible();
  });

  test('should show empty state or history grid', async ({ page }) => {
    // Either shows empty message or history items
    const isEmpty = await page.locator('text=/no (images|history)/i').isVisible();
    const hasItems = await page.locator('[class*="grid"]').isVisible();

    expect(isEmpty || hasItems).toBe(true);
  });
});
