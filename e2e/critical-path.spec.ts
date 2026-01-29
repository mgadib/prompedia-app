/**
 * E2E critical path: app loads and shows auth/landing for unauthenticated users.
 * Run with: npx playwright test
 * Requires dev server (playwright.config.ts starts it via webServer).
 */

import { test, expect } from '@playwright/test';

test.describe('Critical path', () => {
  test('loads app and shows auth or main shell', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/prompedia|Prompedia/i);
    // Either sign in / welcome (auth) or main app content
    const signIn = page.getByRole('button', { name: /sign in|login|masuk/i });
    const mainContent = page.getByRole('main').or(page.locator('[data-testid="prompt-list"], .min-h-screen'));
    await expect(signIn.or(mainContent)).toBeVisible({ timeout: 15_000 });
  });

  test('share route loads without crash', async ({ page }) => {
    await page.goto('/share/non-existent-id');
    await expect(page).toHaveTitle(/prompedia|Prompedia/i);
    // Should show error or not found, not blank crash
    await expect(page.locator('body')).toBeVisible();
  });
});
