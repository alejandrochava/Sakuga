import { test, expect } from '@playwright/test';

test.describe('Stats Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stats');
  });

  test('should display statistics heading', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Statistics');
  });

  test('should show key metrics', async ({ page }) => {
    // Total images
    await expect(page.locator('text=Total Images')).toBeVisible();

    // Total cost
    await expect(page.locator('text=Total Cost')).toBeVisible();
  });

  test('should have cost summary section', async ({ page }) => {
    await expect(page.locator('text=Cost Summary')).toBeVisible();
    await expect(page.locator('text=Today')).toBeVisible();
    await expect(page.locator('text=This Week')).toBeVisible();
    await expect(page.locator('text=This Month')).toBeVisible();
  });

  test('should have chart period selector', async ({ page }) => {
    await expect(page.locator('text=7 Days')).toBeVisible();
    await expect(page.locator('text=30 Days')).toBeVisible();
    await expect(page.locator('text=All')).toBeVisible();
  });

  test('should have provider breakdown', async ({ page }) => {
    await expect(page.locator('text=By Provider')).toBeVisible();
  });
});
