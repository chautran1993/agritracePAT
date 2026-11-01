import { expect, test } from './fixtures';
import { audit, structure } from './a11y-helpers';
test.beforeEach(({ page }) => {
  test.skip(![390, 1440].includes(page.viewportSize()!.width));
});
test('sourced standards search, detail deep-links and localized accordions pass axe', async ({
  page,
}, testInfo) => {
  await page.goto('/standards');
  await expect(page.locator('h1')).toHaveText('Thư viện tiêu chuẩn');
  await expect(page.locator('main article')).toHaveCount(3);
  await expect(page.getByText('Preview', { exact: true })).toHaveCount(0);
  await audit(page, testInfo, 'standards-vi');
  await structure(page);
  await page.getByLabel('Tìm theo mã, tên hoặc cơ quan').fill('NGUYEN TAC TRUY XUAT');
  await expect(page.locator('main article')).toHaveCount(1);
  await expect(page.locator('main article')).toContainText('CXG 60-2006');
  await page.getByLabel('Tìm theo mã, tên hoặc cơ quan').fill('');
  await page.getByRole('link', { name: 'Xem chi tiết: SRP Standard v2.2', exact: true }).click();
  await expect(page).toHaveURL(/\/standards\/srp$/);
  await expect(page.locator('h1')).toHaveText('Tiêu chuẩn SRP về canh tác lúa bền vững');
  await expect(page.locator('main')).toContainText('132');
  await expect(page.locator('main')).toContainText('01/2028');
  await expect(page.locator('main details')).toHaveCount(8);
  await page.locator('summary').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('details').first()).toHaveAttribute('open', '');
  await audit(page, testInfo, 'srp-vi');
  await structure(page);
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    offenders: [...document.querySelectorAll('body *')]
      .filter(
        (e) =>
          !e.closest('.table-scroll,[role=tablist]') &&
          e.getBoundingClientRect().right > innerWidth,
      )
      .map((e) => ({
        tag: e.tagName,
        cls: e.className,
        right: e.getBoundingClientRect().right,
        position: getComputedStyle(e).position,
      })),
  }));
  expect(dimensions.scroll, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.width);
  for (const anchor of await page.locator('main a[target="_blank"]').all()) {
    await expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(anchor).toHaveAttribute('href', /^https:\/\//);
  }
  await page.reload();
  await expect(page.locator('h1')).toHaveText('Tiêu chuẩn SRP về canh tác lúa bền vững');
  await page.getByTestId('language-toggle').first().click();
  await expect(page.locator('h1')).toHaveText('SRP Standard for Sustainable Rice Cultivation');
  await audit(page, testInfo, 'srp-en');
  await structure(page);
  await page.getByRole('link', { name: 'Back to standards library', exact: true }).click();
  await audit(page, testInfo, 'standards-en');
  await page.goto('/standards/does-not-exist');
  await expect(page.locator('h1')).toHaveText('Không tìm thấy tiêu chuẩn');
  await expect(
    page.getByRole('link', { name: 'Quay lại thư viện tiêu chuẩn', exact: true }),
  ).toBeVisible();
});
test('good practices omit unsupported fields; the matrix contains exactly three legal cells', async ({
  page,
}, testInfo) => {
  await page.goto('/standards?tab=good');
  await expect(page.locator('main article')).toHaveCount(2);
  await page.getByLabel('Tìm theo mã, tên hoặc cơ quan').fill('cuc trong trot');
  await expect(page.locator('main article')).toHaveCount(1);
  await page.getByRole('link', { name: 'Xem chi tiết: TCVN 11892-1:2017', exact: true }).click();
  await expect(page.locator('h1')).toContainText('VietGAP');
  await expect(page.getByRole('heading', { name: 'Cấu trúc', exact: true })).toHaveCount(0);
  await expect(page.getByText('Trạng thái', { exact: true })).toHaveCount(0);
  await expect(page.locator('main')).toContainText('Thẩm định');
  await audit(page, testInfo, 'vietgap');
  await page.goto('/standards');
  await page.getByRole('tab', { name: 'Ma trận thị trường', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await expect(page.locator('tbody td a')).toHaveCount(3);
  for (const cell of await page.locator('td[data-market="CN"],td[data-market="HALAL"]').all())
    await expect(cell).toBeEmpty();
  await expect(page.locator('main')).not.toContainText('EUDR');
  await expect(page.locator('main')).not.toContainText('FSMA');
  await expect(page.locator('main')).toContainText('40 CFR Part 180');
  await expect(page.locator('main')).toContainText(
    'Chỉ hiển thị yêu cầu có căn cứ pháp lý đã xác minh.',
  );
  await audit(page, testInfo, 'market-vi');
  await structure(page);
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    offenders: [...document.querySelectorAll('body *')]
      .filter(
        (e) =>
          !e.closest('.table-scroll,[role=tablist]') &&
          e.getBoundingClientRect().right > innerWidth,
      )
      .map((e) => ({
        tag: e.tagName,
        cls: e.className,
        right: e.getBoundingClientRect().right,
        position: getComputedStyle(e).position,
      })),
  }));
  expect(dimensions.scroll, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.width);
  const scroller = page.locator('.table-scroll');
  await scroller.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await page.getByTestId('language-toggle').first().click();
  await audit(page, testInfo, 'market-en');
  await structure(page);
  await page.getByRole('tab', { name: 'Good practices', exact: true }).click();
  await audit(page, testInfo, 'practices-en');
  await page.getByTestId('language-toggle').first().click();
  await audit(page, testInfo, 'practices-vi');
});
