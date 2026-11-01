import { test, expect } from './fixtures';
const routes = [
  '/login',
  '/role-selection',
  '/dashboard',
  '/map',
  '/zones',
  '/plots',
  '/iot',
  '/traceability',
  '/standards',
  ...['codex-rice', 'codex-traceability', 'srp', 'vietgap', 'globalgap'].map(
    (id) => '/standards/' + id,
  ),
  '/trace/plots/MP-0001/LO-2026-MP-0001-S1',
  '/farming',
  '/carbon',
  '/users',
  '/audit',
  '/notifications',
  '/account',
  '/account/password',
  ...['overview', 'season', 'logbook', 'soil', 'pests', 'compliance', 'harvest', 'history'].map(
    (tab) => `/plots/MP-0001?tab=${tab}`,
  ),
];
test('rendered routes contain no placeholder text or empty semantic fields', async ({ page }) => {
  test.setTimeout(240000);
  const problems: unknown[] = [];
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
    await page.locator('.pp-skeleton').waitFor({ state: 'hidden' });
    for (const language of ['vi', 'en']) {
      if (language === 'en') await page.getByTestId('language-toggle').first().click();
      const failures = await page.evaluate(() => {
        const banned =
          /(?:chưa có dữ liệu|chưa xác định|chưa rõ|chưa xác minh|chưa có|\(mẫu\)|mẫu|gợi ý|preview|phase 2|\bdemo\b|\btest\b|\bsample\b|lorem|\bN\/A\b|\b(?:NaN|undefined|null)\b)/gi;
        const text = document.body.innerText;
        const matches = [...text.matchAll(banned)].map((m) =>
          text.slice(Math.max(0, m.index! - 30), m.index! + 70),
        );
        const empty = [...document.querySelectorAll('h1,h2,h3,td,dd,label')]
          .filter(
            (e) =>
              (e as HTMLElement).checkVisibility() &&
              !e.textContent?.trim() &&
              !e.querySelector('input,select,svg,img'),
          )
          .map((e) => e.outerHTML);
        const dashes = [...document.querySelectorAll('td,dd')]
          .filter(
            (e) =>
              (e as HTMLElement).checkVisibility() &&
              /^[-–—]{1,2}$/.test(e.textContent?.trim() || ''),
          )
          .map((e) => e.outerHTML);
        return { matches, empty, dashes };
      });
      if (failures.matches.length || failures.empty.length || failures.dashes.length)
        problems.push({ route, language, ...failures });
    }
  }
  expect(problems).toEqual([]);
});
