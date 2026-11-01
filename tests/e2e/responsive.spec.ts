import { expect, test } from './fixtures';

const routes = [
  '/login',
  '/role-selection',
  '/dashboard',
  '/map',
  '/zones',
  '/plots',
  '/plots/MP-0001',
  '/iot',
  '/traceability',
  '/standards',
  '/standards/srp',
  '/farming',
  '/carbon',
  '/users',
  '/audit',
  '/account',
  '/account/password',
  '/notifications',
];

test('all routes fit the viewport without hiding document overflow', async ({ page }, testInfo) => {
  const audit: { route: string; scrollWidth: number; clientWidth: number }[] = [];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of routes) {
    await test.step(route, async () => {
      await page.goto(route);
      await expect(
        page.locator(route === '/map' ? '.gis-map' : route === '/login' ? 'form' : 'h1').first(),
      ).toBeVisible();
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        overflowX: getComputedStyle(document.documentElement).overflowX,
        bodyOverflowX: getComputedStyle(document.body).overflowX,
        offenders: [...document.querySelectorAll('main *')]
          .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 8)
          .map((element) => `${element.tagName}.${element.className}`),
      }));
      audit.push({
        route,
        scrollWidth: dimensions.scrollWidth,
        clientWidth: dimensions.clientWidth,
      });
      if (page.viewportSize()?.width === 390 && ['/dashboard', '/traceability'].includes(route)) {
        await page.screenshot({
          path: testInfo.outputPath(route.slice(1) + '-mobile.png'),
          fullPage: true,
        });
      }
      expect(dimensions.scrollWidth, `${route}: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(
        dimensions.clientWidth,
      );
      expect(dimensions.overflowX).not.toMatch(/hidden|clip/);
      expect(dimensions.bodyOverflowX).not.toMatch(/hidden|clip/);
    });
  }
  await testInfo.attach('width-audit', {
    body: JSON.stringify(audit, null, 2),
    contentType: 'application/json',
  });
  expect(errors).toEqual([]);
});

test('mobile navigation traps focus, restores it and closes by all supported actions', async ({
  page,
}, testInfo) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 1024);
  await page.goto('/zones');
  const trigger = page.getByRole('button', { name: 'Mở điều hướng' });
  const drawer = page.getByRole('dialog', { name: 'AgriTrace', exact: true });
  await trigger.click();
  await expect(drawer).toBeVisible();
  if (page.viewportSize()?.width === 390)
    await page.screenshot({ path: testInfo.outputPath('navigation-mobile.png') });
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  const close = drawer.getByRole('button', { name: 'Đóng', exact: true });
  await close.focus();
  await page.keyboard.press('Shift+Tab');
  const last = drawer.locator('a').last();
  await expect(last).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(drawer).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  await trigger.click();
  await page.mouse.click(page.viewportSize()!.width - 5, 300);
  await expect(drawer).not.toBeVisible();
  await trigger.click();
  await drawer.getByRole('link', { name: 'Hồ sơ thửa ruộng', exact: true }).click();
  await expect(page).toHaveURL(/\/plots$/);
  await expect(drawer).not.toBeVisible();
});

test('zone table keeps every column reachable and shows scroll edges', async ({ page }) => {
  await page.goto('/zones');
  const frame = page.locator('.table-scroll-frame').first();
  const scroll = frame.locator('.table-scroll');
  await expect(scroll.locator('table')).toBeVisible();
  const hasOverflow = await scroll.evaluate((element) => element.scrollWidth > element.clientWidth);
  if (hasOverflow) {
    await expect(frame).toHaveAttribute('data-right', 'true');
    await scroll.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });
    await expect(frame).toHaveAttribute('data-left', 'true');
    await expect(frame).toHaveAttribute('data-right', 'false');
  }
});

test('mobile map layers and legend open as dismissible bottom sheets', async ({
  page,
}, testInfo) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 1024);
  await page.goto('/map');
  const buttons = page.locator('.gis-sheet-buttons');
  await buttons.getByRole('button', { name: 'Lớp dữ liệu', exact: true }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('checkbox')).toHaveCount(5);
  if (page.viewportSize()?.width === 390)
    await page.screenshot({ path: testInfo.outputPath('map-layers-mobile.png') });
  await sheet.getByRole('button', { name: 'Đóng', exact: true }).click();
  await expect(sheet).not.toBeVisible();
  await buttons.getByRole('button', { name: 'Chú giải', exact: true }).click();
  await expect(sheet).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).not.toBeVisible();
});

test('desktop sidebar still collapses and expands', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1024);
  await page.goto('/zones');
  const positions = await page
    .locator('aside nav a')
    .evaluateAll((links) => links.map((link) => link.getBoundingClientRect().top));
  for (let index = 1; index < positions.length; index++) {
    expect(positions[index]).toBeGreaterThan(positions[index - 1]);
  }
  await page.getByRole('button', { name: 'Thu gọn điều hướng', exact: true }).click();
  await expect
    .poll(() =>
      page.locator('.app-shell').evaluate((element) => getComputedStyle(element).marginLeft),
    )
    .toBe('76px');
  await page.getByRole('button', { name: 'Mở rộng điều hướng', exact: true }).click();
  await expect
    .poll(() =>
      page.locator('.app-shell').evaluate((element) => getComputedStyle(element).marginLeft),
    )
    .toBe('260px');
});
