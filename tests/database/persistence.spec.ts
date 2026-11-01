import { test, expect } from '@playwright/test';
const origin = 'http://127.0.0.1:8788';
test('protects writes, persists an inline edit, rejects stale writes and switches the market without reallocating', async ({
  page,
  request,
}) => {
  page.on('pageerror', (error) => console.error('Browser error:', error.message));
  const endpoint = '/api/plots/MP-0001';
  expect(
    (
      await request.patch(endpoint, {
        headers: { Origin: origin },
        data: { field: 'owner.name', value: 'Nguyễn Văn Hải', revision: 1 },
      })
    ).status(),
  ).toBe(401);
  const auth = await page.request.post('/api/session', {
    headers: { Origin: origin },
    data: { username: 'quanly', password: 'local-integration-only' },
  });
  expect(auth.status()).toBe(200);
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'agritrace_session',
      JSON.stringify({ username: 'quanly', role: 'quanly', lastActivityAt: Date.now() }),
    );
    sessionStorage.setItem('agritrace_api_authenticated', 'true');
  });
  await page.goto('/plots/MP-0001');
  await expect(page.locator('h1')).toHaveText('Thửa 17 · Tờ 2');
  const before = await (await page.request.get(endpoint)).json();
  await page.getByRole('button', { name: 'Chủ hộ: Nguyễn Văn Hùng', exact: true }).click();
  await page.getByRole('textbox', { name: 'Chủ hộ', exact: true }).fill('Nguyễn Văn Hải');
  await page.getByRole('textbox', { name: 'Chủ hộ', exact: true }).press('Enter');
  await expect(
    page.getByRole('button', { name: 'Chủ hộ: Nguyễn Văn Hải', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Chủ hộ: Nguyễn Văn Hải', exact: true }),
  ).toBeVisible();
  const stale = await page.request.patch(endpoint, {
    headers: { Origin: origin },
    data: { field: 'owner.name', value: 'Trần Văn An', revision: before.revision },
  });
  expect(stale.status()).toBe(409);
  const afterName = await (await page.request.get(endpoint)).json();
  const unknownIngredient = await page.request.patch(endpoint, {
    headers: { Origin: origin },
    data: {
      field: 'currentSeason.logs.6.inputs.0.activeIngredient',
      value: 'Paraquat',
      revision: afterName.revision,
    },
  });
  expect(unknownIngredient.status()).toBe(422);
  const productivity = await page.request.patch(endpoint, {
    headers: { Origin: origin },
    data: { field: 'currentSeason.yieldPerHaT', value: '6.4', revision: afterName.revision },
  });
  expect(productivity.status()).toBe(200);
  const quantities = await productivity.json();
  expect(quantities.plot.currentSeason.expectedYieldT).toBeCloseTo(
    quantities.plot.areaGisHa * 6.4,
    10,
  );
  await page
    .getByRole('combobox', { name: 'Thị trường xuất khẩu', exact: true })
    .selectOption('CHN');
  await expect(page.locator('.pp-pdi')).toHaveText('80-PUC-LUA001-000001-CHN');
  await page.reload();
  await expect(page.locator('.pp-pdi')).toHaveText('80-PUC-LUA001-000001-CHN');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.pp-print-content')).toContainText('Nguyễn Văn Hải');
  await expect(page.locator('.pp-print-content')).toContainText('80-PUC-LUA001-000001-CHN');
  await page.pdf({
    path: '.tmp-analysis/parcel-profile-db.pdf',
    format: 'A4',
    printBackground: true,
  });
  const current = await (await page.request.get(endpoint)).json();
  const badDate = await page.request.patch(endpoint, {
    headers: { Origin: origin },
    data: {
      field: 'currentSeason.expectedHarvestDate',
      value: '2026-01-01',
      revision: current.revision,
    },
  });
  expect(badDate.status()).toBe(400);
  const badOrigin = await page.request.patch(endpoint, {
    headers: { Origin: 'https://unrelated.example' },
    data: { field: 'owner.name', value: 'Trần Văn An', revision: current.revision },
  });
  expect(badOrigin.status()).toBe(403);
  const publicTrace = await request.get('/api/public-trace/MP-0001/LO-2026-MP-0001-S1');
  expect(publicTrace.status()).toBe(200);
  const publicData = await publicTrace.json();
  expect(publicData.plot.owner.name).toBe('Nguyễn Văn Hải');
  expect(publicData.plot.owner).not.toHaveProperty('phone');
  await page.emulateMedia({ media: 'screen' });
  await page.goto('/account/password');
  await page.getByLabel('Mật khẩu hiện tại', { exact: true }).fill('local-integration-only');
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill('LocalDatabase2026!');
  await page.getByLabel('Xác nhận mật khẩu mới', { exact: true }).fill('LocalDatabase2026!');
  await page.getByRole('button', { name: 'Cập nhật mật khẩu', exact: true }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await page.request.delete('/api/session', { headers: { Origin: origin } });
  expect((await page.request.get(endpoint)).status()).toBe(401);
  expect(
    (
      await page.request.post('/api/session', {
        headers: { Origin: origin },
        data: { username: 'quanly', password: 'local-integration-only' },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await page.request.post('/api/session', {
        headers: { Origin: origin },
        data: { username: 'quanly', password: 'LocalDatabase2026!' },
      })
    ).status(),
  ).toBe(200);
});
