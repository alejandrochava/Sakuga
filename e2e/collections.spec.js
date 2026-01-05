import { test, expect } from '@playwright/test';

test.describe('Collections Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/collections');
  });

  test('should display collections heading', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Collections');
  });

  test('should have create collection button', async ({ page }) => {
    await expect(page.locator('button:has-text("New Collection")')).toBeVisible();
  });

  test('should open create collection modal', async ({ page }) => {
    await page.click('button:has-text("New Collection")');

    // Modal should appear
    await expect(page.locator('text=Create Collection')).toBeVisible();
    await expect(page.locator('input[placeholder*="name"]')).toBeVisible();
  });

  test('should show empty state or collections list', async ({ page }) => {
    const isEmpty = await page.locator('text=/no collections/i').isVisible();
    const hasItems = await page.locator('[class*="grid"]').isVisible();

    expect(isEmpty || hasItems).toBe(true);
  });
});
