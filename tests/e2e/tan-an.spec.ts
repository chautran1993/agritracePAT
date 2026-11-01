import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import tanAn from '../../src/data/tanAnParcels.json' with { type: 'json' };
const area =
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(
    tanAn.records.reduce((s, r) => s + r.estimatedAreaM2 / 10000, 0),
  ) + ' ha';
test('switches to Tan An, shows its own parcels and retains the supplied sample', async ({
  page,
}, info) => {
  await page.goto('/map');
  await expect(page.locator('.gis-map')).toHaveAttribute('data-geometry-rendered', 'true', {
    timeout: 60000,
  });
  if (page.viewportSize()!.width < 1024)
    await page.getByRole('button', { name: 'Mở điều hướng', exact: true }).click();
  await page.getByRole('combobox', { name: 'Vùng trồng', exact: true }).selectOption('VT002');
  await expect(page).toHaveURL(/\/map\?zone=VT002$/);
  await expect(page.locator('.gis-map')).toHaveAttribute('data-geometry-rendered', 'true', {
    timeout: 60000,
  });
  await expect(page.locator('main')).toContainText(area);
  await expect(page.locator('main')).toContainText(String(tanAn.records.length));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({ path: info.outputPath('tan-an-map.png'), fullPage: false });
  await page.goto('/zones?zone=VT002');
  await expect(page.locator('tbody tr')).toHaveCount(tanAn.records.length);
  await expect(page.locator('main')).toContainText('Vùng trồng lúa ST25 Tân An');
  await page.goto('/plots/MP-1001');
  await expect(page.locator('h1')).toHaveText('Thửa 2380 · Tờ 55');
  await expect(page.locator('main')).toContainText('0,375');
  if (page.viewportSize()!.width >= 1024)
    await expect(page.getByRole('combobox', { name: 'Vùng trồng', exact: true })).toHaveValue(
      'VT002',
    );
});
