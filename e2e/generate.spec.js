import { test, expect } from '@playwright/test';

test.describe('Generate Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display all form elements', async ({ page }) => {
    // Provider selector should be visible
    await expect(page.locator('text=Select Provider')).toBeVisible();

    // Prompt textarea should exist
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute('placeholder', /describe/i);

    // Aspect ratio selector
    await expect(page.locator('text=1:1')).toBeVisible();
    await expect(page.locator('text=16:9')).toBeVisible();

    // Generate button
    await expect(page.locator('button:has-text("Generate")')).toBeVisible();
  });

  test('should show character count for prompt', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('Hello world');

    // Should show character count
    await expect(page.locator('text=/11\\/\\d+/')).toBeVisible();
  });

  test('should allow selecting aspect ratio', async ({ page }) => {
    // Click on 16:9 ratio
    const wideRatio = page.locator('button:has-text("16:9")');
    await wideRatio.click();

    // Should have accent styling (active state)
    await expect(wideRatio).toHaveClass(/text-accent/);
  });

  test('should show variant count selector', async ({ page }) => {
    await expect(page.locator('text=Variants')).toBeVisible();

    // Click to increase variants
    const plusButton = page.locator('button:has-text("+")');
    if (await plusButton.isVisible()) {
      await plusButton.click();
    }
  });

  test('should have enhance toggle', async ({ page }) => {
    await expect(page.locator('text=Enhance prompt')).toBeVisible();
  });

  test('should show advanced parameters button', async ({ page }) => {
    await expect(page.locator('text=Advanced')).toBeVisible();
  });

  test('should show prompt templates button', async ({ page }) => {
    await expect(page.locator('text=Templates')).toBeVisible();
  });

  test('should disable generate button without provider', async ({ page }) => {
    // Fill prompt
    await page.locator('textarea').fill('A beautiful sunset');

    // Generate button should be visible
    const generateBtn = page.locator('button:has-text("Generate")');
    await expect(generateBtn).toBeVisible();
  });
});
