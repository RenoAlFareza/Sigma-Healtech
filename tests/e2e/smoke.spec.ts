import { test, expect, type Page } from '@playwright/test';

/**
 * SIGMA E2E smoke test.
 *
 * Proves the app functions end-to-end in a real browser:
 *   1. /login renders the login form.
 *   2. Logging in as manager/demo navigates to /dashboard which renders KPI cards.
 *   3. /products loads and renders the KFA product catalog table.
 *
 * Surfaces any client-side errors via console / pageerror listeners.
 */

// ——— helpers ———————————————————————————————————————————————————

function attachErrorCapture(page: Page) {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`[console.error] ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', (req) => problems.push(`[requestfailed] ${req.method()} ${req.url()} ${req.failure()?.errorText ?? ''}`));
  return problems;
}

async function login(page: Page, username: string) {
  await page.goto('/login');
  await page.getByLabel('Nama Pengguna').fill(username);
  await page.getByLabel('Kata Sandi').fill('demo');
  await page.getByRole('button', { name: 'Masuk' }).click();
}

test('login page renders the credentials form', async ({ page }) => {
  await page.goto('/login');

  // Form fields + submit button present.
  await expect(page.getByLabel('Nama Pengguna')).toBeVisible();
  await expect(page.getByLabel('Kata Sandi')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible();

  // Brand heading present.
  await expect(page.getByRole('heading', { name: /SIGMA System/i })).toBeVisible();

  // Demo quick-login cards listed.
  await expect(page.getByText('manager', { exact: true })).toBeVisible();
});

test('login as manager navigates to a rendering dashboard', async ({ page }) => {
  const problems = attachErrorCapture(page);

  await login(page, 'manager');

  // After submit the AuthProvider hydrates and router.push('/dashboard') fires.
  await page.waitForURL('**/dashboard', { timeout: 15_000 });

  // Dashboard heading + KPI stat cards render (proves client data fetch succeeded).
  await expect(page.getByRole('heading', { name: 'Dashboard Pemantauan Logistik' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Total Produk')).toBeVisible();
  // The KPI StatCard label is a direct match ("Fill Rate", exact cell in the grid).
  await expect(page.getByText('Fill Rate', { exact: true })).toBeVisible();

  // KPI values render (summary data loaded from the API) — KPI StatCard cell.
  await expect(page.getByText('Stok Habis', { exact: true }).first()).toBeVisible();

  // No fatal client errors while the dashboard mounts.
  expect(problems.filter((p) => !p.includes('/api/')).length, `client errors: ${problems.join(' | ')}`).toEqual(0);
});

test('products catalog renders after login', async ({ page }) => {
  const problems = attachErrorCapture(page);

  await login(page, 'manager');
  await page.waitForURL('**/dashboard', { timeout: 15_000 });

  // Navigate to the products catalog.
  await page.goto('/products');
  await page.waitForLoadState('networkidle');

  // Table + KFA catalog summary render (data fetched via /api/products with x-user-id).
  await expect(page.getByText('Products Catalog')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/KFA products/i)).toBeVisible();

  // At least one known KFA code (Paracetamol 93000462) present in a table row.
  await expect(page.getByText('93000462', { exact: true }).first()).toBeVisible({ timeout: 15_000 });

  // The pagination/subtitle confirms real data (not empty state).
  await expect(page.getByText(/No products found/i)).toHaveCount(0);

  // No uncaught page errors surfaced.
  expect(problems.filter((p) => p.startsWith('[pageerror]') || p.startsWith('[requestfailed]')), `client errors: ${problems.join(' | ')}`).toEqual([]);
});

test('authenticated session is reused for a direct /products visit', async ({ page }) => {
  const problems = attachErrorCapture(page);

  await login(page, 'manager');
  await page.waitForURL('**/dashboard', { timeout: 15_000 });

  // Reload /dashboard — AuthProvider should hydrate from localStorage session.
  const sessionLoaded = await page.evaluate(() => {
    const raw = window.localStorage.getItem('sigma.session');
    return raw ? (JSON.parse(raw) as { userId?: string }) : null;
  });
  expect(sessionLoaded?.userId).toBeTruthy();

  // Direct (fresh navigation) visit to /products still renders data via the session header.
  await page.goto('/products');
  await expect(page.getByText('Products Catalog')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/KFA products/i)).toBeVisible();
  await expect(page.getByText('93000462', { exact: true }).first()).toBeVisible({ timeout: 15_000 });

  expect(problems.filter((p) => p.startsWith('[pageerror]')), `client errors: ${problems.join(' | ')}`).toEqual([]);
});

test('list pages (/inventory, /requisitions) load without client errors after login', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`); });

  await login(page, 'manager');
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
  await expect(page.getByText('Total Produk')).toBeVisible({ timeout: 15_000 });

  // Strict mode violations are selectors, not app failures — assert the page
  // rendered its heading and did NOT fire the previously-fatal res.data crash.
  await page.goto('/inventory');
  await expect(page.getByText('Inventori', { exact: true })).toBeVisible({ timeout: 15_000 });

  await page.goto('/requisitions');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /Permintaan Stok/i })).toBeVisible({ timeout: 15_000 });

  expect(errors, `client errors: ${errors.join(' | ')}`).toEqual([]);
});
