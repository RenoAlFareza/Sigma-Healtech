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

test('inventory uses the 1440x900 bento dashboard composition', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await page.goto('/inventory/overview');
  await expect(page.getByRole('heading', { name: 'Inventory Management' })).toBeVisible({ timeout: 15_000 });

  const metrics = page.locator('section[aria-label="Indikator inventory"] article');
  await expect(metrics).toHaveCount(4);
  const firstMetric = await metrics.nth(0).boundingBox();
  const secondMetric = await metrics.nth(1).boundingBox();
  expect(firstMetric?.y).toBe(secondMetric?.y);

  await expect(page.getByRole('img', { name: /grouped bar chart/i })).toBeVisible();
  await expect(page.getByRole('img', { name: /donut chart distribusi/i })).toBeVisible();
  await expect(page.getByRole('img', { name: /area chart permintaan/i })).toBeVisible();

  const inflow = await page.getByRole('img', { name: /grouped bar chart/i }).boundingBox();
  const distribution = await page.getByRole('img', { name: /donut chart distribusi/i }).boundingBox();
  expect(inflow?.x).toBeLessThan(distribution?.x ?? 0);
  expect(inflow?.width).toBeGreaterThan(distribution?.width ?? 0);
  expect(await page.locator('body').evaluate((body) => body.scrollWidth - body.clientWidth)).toBe(0);
});

test('inventory bento cards stack without overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.goto('/inventory/overview');
  await expect(page.getByRole('heading', { name: 'Inventory Management' })).toBeVisible({ timeout: 15_000 });

  const metrics = page.locator('section[aria-label="Indikator inventory"] article');
  const firstMetric = await metrics.nth(0).boundingBox();
  const secondMetric = await metrics.nth(1).boundingBox();
  expect(secondMetric?.y).toBeGreaterThan((firstMetric?.y ?? 0) + (firstMetric?.height ?? 0) - 1);
  expect(await page.locator('body').evaluate((body) => body.scrollWidth - body.clientWidth)).toBe(0);
});

test('transaction management uses the reference bento composition', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await page.goto('/transactions');
  await expect(page.getByRole('heading', { name: 'Transaction Management' })).toBeVisible({ timeout: 15_000 });

  const metrics = page.locator('section[aria-label="KPI transaksi"] article');
  await expect(metrics).toHaveCount(4);
  const firstMetric = await metrics.nth(0).boundingBox();
  const secondMetric = await metrics.nth(1).boundingBox();
  expect(firstMetric?.y).toBe(secondMetric?.y);

  await expect(page.getByRole('img', { name: /grouped bar chart arus/i })).toBeVisible();
  await expect(page.getByRole('img', { name: /donut chart distribusi jenis/i })).toBeVisible();
  await expect(page.getByRole('img', { name: /mixed chart throughput/i })).toBeVisible();
  const flow = await page.getByRole('img', { name: /grouped bar chart arus/i }).boundingBox();
  const distribution = await page.getByRole('img', { name: /donut chart distribusi jenis/i }).boundingBox();
  expect(flow?.width).toBeGreaterThan(distribution?.width ?? 0);
  expect(await page.locator('body').evaluate((body) => body.scrollWidth - body.clientWidth)).toBe(0);
});

test('transaction management stacks without body overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.goto('/transactions');
  await expect(page.getByRole('heading', { name: 'Transaction Management' })).toBeVisible({ timeout: 15_000 });

  const metrics = page.locator('section[aria-label="KPI transaksi"] article');
  const firstMetric = await metrics.nth(0).boundingBox();
  const secondMetric = await metrics.nth(1).boundingBox();
  expect(secondMetric?.y).toBeGreaterThan((firstMetric?.y ?? 0) + (firstMetric?.height ?? 0) - 1);
  expect(await page.locator('body').evaluate((body) => body.scrollWidth - body.clientWidth)).toBe(0);
});
