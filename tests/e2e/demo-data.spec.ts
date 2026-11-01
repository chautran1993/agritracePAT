import { expect, test } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
test('new workbook does not expose old demo batches or invent QR journeys', async ({ page }) => {
  await page.goto('/traceability');
  await expect(page.locator('h1')).toHaveText('Hành trình truy xuất');
  await expect(page.locator('main')).toContainText('Chưa có dữ liệu truy xuất');
  await expect(page.getByRole('img', { name: /QR/ })).toHaveCount(0);
  await page.goto('/trace/plots/MP-0001/LO-2027-001');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('main')).not.toContainText('68,13');
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});
