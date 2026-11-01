import { audit, structure } from './a11y-helpers';
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
  '/trace/plots/MP-0001/LO-2026-T001-1',
  '/not-found',
];

for (const route of routes) {
  test(`WCAG AA: ${route}`, async ({ page }, testInfo) => {
    test.skip(![390, 1440].includes(page.viewportSize()!.width));
    await page.goto(route);
    await expect(page.locator(route === '/map' ? '.gis-map' : 'h1').first()).toBeVisible();
    await audit(page, testInfo, 'vi');
    await structure(page);
    if (route === '/plots')
      await page.screenshot({
        path: testInfo.outputPath(`plots-${page.viewportSize()!.width}.png`),
      });
    {
      await page.getByTestId('language-toggle').first().click();
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await audit(page, testInfo, 'en');
      await structure(page);
    }
  });
}
