import tanAn from '../../src/data/tanAnParcels.json' with { type: 'json' };
import { test, expect } from '../e2e/fixtures';
import dataset from '../../src/data/generatedParcels.json' with { type: 'json' };
test('public site serves the expanded parcel dataset and direct React routes', async ({ page }) => {
  const origin='https://agritrace-portal.ttmychau93.workers.dev';
  const auth=await page.request.post('/api/session',{headers:{Origin:origin},data:{username:'quanly',password:process.env.AGRITRACE_PASSWORD||'demo123'}});
  expect(auth.status()).toBe(200);
  const count = dataset.records.length + tanAn.records.length;
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tổng quan điều hành');
  await expect(page.getByRole('button', { name: /Số thửa ruộng/ })).toContainText(String(count));
  await page.goto('/plots');
  await expect(page.locator('tbody tr')).toHaveCount(count);
  const last = tanAn.records.at(-1)!;
  await page.goto('/plots/MP-' + String(last.sourceRow).padStart(4, '0'));
  await expect(page.locator('h1')).toHaveText(
    'Thửa ' + last.parcelNumber + ' · Tờ ' + last.sheetNumber,
  );
  for (const id of ['MP-0061', 'MP-0084']) {
    await page.goto('/plots/' + id);
    await expect(page.locator('h1')).toHaveText('Không tìm thấy thửa ruộng');
  }
  await page.goto('/zones?zone=VT002');
  await expect(page.locator('tbody tr')).toHaveCount(tanAn.records.length);
  await expect(page.locator('main')).toContainText('Vùng trồng lúa ST25 Tân An');
  await page.goto('/map?zone=VT002');
  await expect(page.locator('.gis-map')).toHaveAttribute('data-geometry-rendered', 'true', {
    timeout: 60000,
  });
  await expect(page.locator('main')).toContainText(
    new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(
      tanAn.records.reduce((sum, r) => sum + r.estimatedAreaM2 / 10000, 0),
    ) + ' ha',
  );
  await page.screenshot({
    path: '../agritrace-deploy/agritrace-public-database-2026-10-27.png',
    fullPage: false,
  });
});
