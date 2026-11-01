import { test as base } from '@playwright/test';
export { expect } from '@playwright/test';
// These suites audit authenticated screens. Authentication itself is exercised
// through the real login form in auth-notifications.spec.ts.
export const test = base.extend<{ signedIn: void }>({
  signedIn: [
    async ({ page }, use) => {
      await page.addInitScript(() => {
        if (!sessionStorage.getItem('agritrace_test_initialized')) {
          sessionStorage.setItem(
            'agritrace_session',
            JSON.stringify({ username: 'quanly', role: 'quanly', lastActivityAt: Date.now() }),
          );
          sessionStorage.setItem('agritrace_test_initialized', 'true');
        }
      });
      await use();
    },
    { auto: true },
  ],
});
