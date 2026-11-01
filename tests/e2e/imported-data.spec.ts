import tanAn from '../../src/data/tanAnParcels.json' with { type: 'json' };
import dataset from '../../src/data/generatedParcels.json' with { type: 'json' };
const parcelCount = dataset.records.length + tanAn.records.length;
const totalArea =
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(
    [...dataset.records, ...tanAn.records].reduce((sum, r) => sum + r.estimatedAreaM2 / 10000, 0),
  ) + ' ha';
import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
test('estimated workbook boundaries replace the dataset consistently', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tổng quan điều hành');
  await expect(page.getByRole('button', { name: /Tổng diện tích ước tính/ })).toContainText(
    totalArea,
  );
  await expect(page.getByRole('button', { name: /Số thửa ruộng/ })).toContainText(
    String(parcelCount),
  );
  await expect(page.locator('main')).toContainText('thuộc vùng Tân Hưng và Tân An, Vĩnh Long');
  for (const route of ['/plots', '/zones']) {
    await page.goto(route);
    await expect(page.locator('tbody tr')).toHaveCount(
      route === '/zones' ? dataset.records.length : parcelCount,
    );
    await expect(page.locator('main')).toContainText(totalArea);
    await expect(page.locator('main')).not.toContainText('(mẫu)');
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
  }
  await page.goto('/plots/MP-0001');
  await expect(page.locator('h1')).toHaveText('Thửa 17 · Tờ 2');
  await expect(page.locator('main')).toContainText('2,2929 ha');
  await expect(page.locator('main')).toContainText('Nguyễn Văn Hùng');
  await expect(page.locator('main')).toContainText('18 điểm góc');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'GeoJSON', exact: true }).click();
  const exported = await downloadPromise;
  const feature = JSON.parse(await readFile((await exported.path())!, 'utf8'));
  expect(feature.geometry.type).toBe('Polygon');
  expect(feature.geometry.coordinates[0]).toHaveLength(19);
  expect(feature.properties.boundaryEstimated).toBe(false);
  expect(feature.properties.sourceLocation[0]).toBeCloseTo(105.66005993357149, 9);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({ path: info.outputPath('estimated-profile.png'), fullPage: false });
  await page.goto('/map');
  await expect(page.locator('.gis-map')).toHaveAttribute('data-geometry-rendered', 'true', {
    timeout: 45000,
  });
  await expect(page.locator('main')).toContainText(
    new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(
      dataset.records.reduce((s, r) => s + r.estimatedAreaM2 / 10000, 0),
    ) + ' ha',
  );
  await expect(page.locator('main')).toContainText('Không phải ranh địa chính');
  await page.screenshot({ path: info.outputPath('estimated-map.png'), fullPage: false });
  for (const route of ['/traceability', '/iot', '/carbon']) {
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
  }
  expect(errors).toEqual([]);
});
