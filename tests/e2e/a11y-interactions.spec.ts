import { expect, test } from './fixtures';
import { audit, structure } from './a11y-helpers';

test.beforeEach(({ page }) => {
  test.skip(![390, 1440].includes(page.viewportSize()!.width));
});

test('plot tabs use roving focus and all eight panels pass axe', async ({ page }, testInfo) => {
  await page.goto('/plots/MP-0001');
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(8);
  await tabs.first().focus();
  for (let index = 0; index < 8; index++) {
    if (index) await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(index)).toBeFocused();
    await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    await audit(page, testInfo, `plot-tab-${index}`);
    await structure(page);
  }
  await page.keyboard.press('Home');
  await expect(tabs.first()).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.last()).toBeFocused();
  await page.keyboard.press('Home');
  await page.keyboard.press('End');
  await expect(tabs.last()).toBeFocused();
});

test('admin tabs use arrow keys and all panels pass axe', async ({ page }, testInfo) => {
  await page.goto('/users');
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  await tabs.first().focus();
  for (let index = 0; index < 4; index++) {
    if (index) await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(index)).toBeFocused();
    await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
    await audit(page, testInfo, `admin-tab-${index}`);
    await structure(page);
  }
});

test('login reports invalid fields and links them to the live alert', async ({
  page,
}, testInfo) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('Sai tên đăng nhập');
  for (const name of ['Tên đăng nhập', 'Mật khẩu']) {
    const input = page.getByRole('textbox', { name, exact: true });
    const field = name === 'Mật khẩu' ? page.getByLabel(name, { exact: true }) : input;
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAttribute('aria-describedby', 'login-error');
  }
  await audit(page, testInfo, 'invalid-login');
  await page.getByTestId('language-toggle').click();
  await expect(page.getByRole('button', { name: 'Show password' })).toBeVisible();
});

test('skip link moves focus to the single main landmark', async ({ page }) => {
  await page.goto('/zones');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Bỏ qua tới nội dung' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('keyboard focus ring overrides weak per-control focus colors', async ({ page }) => {
  await page.goto('/login');
  await page.keyboard.press('Tab');
  const username = page.getByRole('textbox', { name: 'Tên đăng nhập', exact: true });
  await username.focus();
  const focus = await username.evaluate((element) => ({
    visible: element.matches(':focus-visible'),
    shadow: getComputedStyle(element).boxShadow,
  }));
  expect(focus.visible).toBe(true);
  expect(focus.shadow).toContain('29, 78, 216');
});

test('mobile navigation and map sheet pass axe when open', async ({ page }, testInfo) => {
  test.skip(page.viewportSize()!.width >= 1024);
  await page.goto('/map');
  await page.getByRole('button', { name: 'Mở điều hướng' }).click();
  await audit(page, testInfo, 'navigation-drawer');
  await page.keyboard.press('Escape');
  await page.locator('.gis-sheet-buttons').getByRole('button', { name: 'Lớp dữ liệu' }).click();
  await audit(page, testInfo, 'map-layer-sheet');
  await page.keyboard.press('Escape');
  await page.locator('.gis-sheet-buttons').getByRole('button', { name: 'Chú giải' }).click();
  await audit(page, testInfo, 'map-legend-sheet');
});
