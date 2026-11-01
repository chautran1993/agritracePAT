import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

export async function audit(page: Page, testInfo: TestInfo, state: string) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  const resultPath = testInfo.outputPath(`axe-${state}.json`);
  await writeFile(resultPath, JSON.stringify(results, null, 2));
  await testInfo.attach(`axe-${state}`, { path: resultPath, contentType: 'application/json' });
  expect(
    results.violations.map(({ id, nodes }) => ({
      id,
      nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
    })),
    state,
  ).toEqual([]);
}

export async function structure(page: Page) {
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  const levels = await page
    .getByRole('heading')
    .evaluateAll((elements) =>
      elements.map((element) =>
        Number(element.getAttribute('aria-level') || element.tagName.slice(1)),
      ),
    );
  for (let index = 1; index < levels.length; index++) {
    expect(levels[index], `heading sequence ${levels.join(',')}`).toBeLessThanOrEqual(
      levels[index - 1] + 1,
    );
  }
  const smallText = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const failures: string[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const element = node.parentElement;
      if (!node.textContent?.trim() || !element || !element.getClientRects().length) continue;
      if (element.closest('script, style, [hidden], .sr-only')) continue;
      if (Number.parseFloat(getComputedStyle(element).fontSize) < 12)
        failures.push(node.textContent.slice(0, 70));
    }
    return failures;
  });
  expect(smallText).toEqual([]);
  const targets = await page
    .locator('button, select, input:not([type="checkbox"]):not([type="radio"]):not([type="range"])')
    .evaluateAll(
      (elements, minimum) =>
        elements
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.width && rect.height && (rect.width < minimum || rect.height < minimum);
          })
          .map(
            (element) =>
              `${element.tagName}: ${element.getAttribute('aria-label') || element.textContent?.trim()}`,
          ),
      page.viewportSize()!.width < 640 ? 44 : 24,
    );
  expect(targets).toEqual([]);
}
