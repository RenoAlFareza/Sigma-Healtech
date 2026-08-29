import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Nama Pengguna').fill('manager');
  await page.getByLabel('Kata Sandi').fill('demo');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible({ timeout: 15_000 });
}

test('dashboard matches the 1440x900 Curelo composition', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);

  const sidebar = page.getByRole('complementary', { name: 'Navigasi pintas' });
  await expect(sidebar).toBeVisible();
  expect((await sidebar.boundingBox())?.width).toBe(80);

  const metrics = page.locator('section[aria-label="Ringkasan inventori"] article');
  await expect(metrics).toHaveCount(4);
  const firstMetric = await metrics.nth(0).boundingBox();
  const secondMetric = await metrics.nth(1).boundingBox();
  expect(firstMetric?.y).toBe(secondMetric?.y);
  expect(secondMetric?.x).toBeGreaterThan(firstMetric?.x ?? 0);

  const main = page.locator('main');
  expect((await main.boundingBox())?.width).toBeLessThanOrEqual(1400);
  const overflow = await page.locator('body').evaluate((body) => body.scrollWidth - body.clientWidth);
  expect(overflow).toBe(0);
});

test('dashboard collapses the sidebar into a mobile drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);

  await expect(page.getByRole('complementary', { name: 'Navigasi pintas' })).toBeHidden();
  await page.getByRole('button', { name: 'Buka menu navigasi' }).click();
  await expect(page.getByRole('complementary', { name: 'Menu mobile' })).toBeVisible();
  const overflow = await page.locator('body').evaluate((body) => body.scrollWidth - body.clientWidth);
  expect(overflow).toBe(0);
});
