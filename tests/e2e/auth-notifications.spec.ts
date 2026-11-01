import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function login(page: Page) {
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('quanly');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('demo123');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
}
async function accountMenu(page: Page) {
  await page.getByRole('button', { name: /^Tài khoản:/ }).click();
}
async function axe(page: Page) {
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
}
test('incorrect/correct login preserves a guarded URL; logout removes the session', async ({
  page,
}) => {
  await page.goto('/plots/MP-0001?tab=overview#main-content');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('quanly');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Sai tên đăng nhập hoặc mật khẩu');
  await axe(page);
  await login(page);
  await expect(page).toHaveURL(/\/plots\/MP-0001\?tab=overview#main-content$/);
  await expect(page.locator('h1')).toBeVisible();
  await page.reload();
  await expect(page.locator('h1')).toBeVisible();
  await expect(page).not.toHaveURL(/\/login$/);
  await accountMenu(page);
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => sessionStorage.getItem('agritrace_session'))).toBeNull();
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/trace/plots/MP-0001/LO-2027-001');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('main')).not.toContainText('LO-2027-001');
  await expect(page).not.toHaveURL(/\/login$/);
  await page.goto('/role-selection');
  await expect(page).toHaveURL(/\/login$/);
  await login(page);
  await expect(page).toHaveURL(/\/role-selection$/);
  await page.getByRole('button', { name: 'Vào Dashboard', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
test('notification click marks it read, decreases the badge and persists through reload', async ({
  page,
}) => {
  await page.goto('/dashboard');
  await login(page);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByTestId('notification-badge')).toHaveText('3');
  await page.getByRole('button', { name: 'Thông báo: 3 chưa đọc' }).click();
  const popover = page.locator('#notifications-popover');
  await expect(popover.locator('li')).toHaveCount(5);
  await axe(page);
  await expect(popover.getByTestId('notification-notice-1').locator('span').first()).toHaveClass(
    /font-bold/,
  );
  await popover.getByTestId('notification-notice-1').click();
  await expect(page).toHaveURL(/\/plots$/);
  await expect(page.getByTestId('notification-badge')).toHaveText('2');
  await page.reload();
  await expect(page.getByTestId('notification-badge')).toHaveText('2');
  await page.getByRole('button', { name: 'Thông báo: 2 chưa đọc' }).click();
  await page.getByLabel('Lọc thông báo').selectOption('read');
  await expect(popover.getByTestId('notification-notice-1').locator('span').first()).toHaveClass(
    /font-normal/,
  );
  await page.getByRole('button', { name: 'Xem tất cả', exact: true }).click();
  await expect(page).toHaveURL(/\/notifications$/);
  await expect(page.locator('main li')).toHaveCount(12);
  await page.getByLabel('Lọc thông báo').selectOption('unread');
  await expect(page.locator('main li')).toHaveCount(2);
  await axe(page);
  await page.getByTestId('notification-notice-2').click();
  await expect(page).toHaveURL(/\/plots\/MP-0001$/);
  await expect(page.getByTestId('notification-badge')).toHaveText('1');
});
test('profile and password forms validate, update the account and accept the changed password', async ({
  page,
}) => {
  await page.goto('/account');
  await login(page);
  await expect(page).toHaveURL(/\/account$/);
  await page.getByLabel('Họ tên', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByRole('alert')).toContainText('2 đến 80');
  await page.getByLabel('Họ tên', { exact: true }).fill('Nguyễn Thanh Bình');
  await page.getByLabel('Ảnh đại diện', { exact: true }).setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await expect(page.getByRole('img', { name: 'Ảnh đại diện xem trước' })).toBeVisible();
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByRole('status')).toContainText('Đã cập nhật');
  await axe(page);
  await accountMenu(page);
  await page.getByRole('link', { name: 'Đổi mật khẩu', exact: true }).click();
  await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click();
  await expect(page.getByRole('alert')).toHaveCount(3);
  await axe(page);
  await page.getByLabel('Mật khẩu hiện tại', { exact: true }).fill('wrong');
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill('Newdemo456');
  await page.getByLabel('Xác nhận mật khẩu mới', { exact: true }).fill('Newdemo456');
  await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click();
  await expect(page.getByRole('alert')).toHaveText('Mật khẩu hiện tại không đúng.');
  await page.getByLabel('Mật khẩu hiện tại', { exact: true }).fill('demo123');
  await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click();
  await expect(page.getByRole('status')).toContainText('Đã đổi mật khẩu');
  await accountMenu(page);
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('quanly');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Newdemo456');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/account\/password$/);
  await expect(page.getByRole('button', { name: 'Tài khoản: Nguyễn Thanh Bình' })).toBeVisible();
});
test('idle warning at 29 minutes can renew; 30 minutes of inactivity signs out', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/notifications');
  await login(page);
  await expect(page.locator('h1')).toHaveText('Thông báo');
  await page.clock.fastForward(20 * 60 * 1000);
  await page.locator('main').dispatchEvent('wheel', { deltaY: 100 });
  await page.clock.fastForward(9 * 60 * 1000);
  await expect(page.getByRole('dialog', { name: 'Phiên đăng nhập sắp hết hạn' })).not.toBeVisible();
  await page.clock.fastForward(20 * 60 * 1000);
  const warning = page.getByRole('dialog', { name: 'Phiên đăng nhập sắp hết hạn' });
  await expect(warning).toBeVisible();
  await axe(page);
  await warning.getByRole('button', { name: 'Tiếp tục làm việc' }).click();
  await expect(warning).not.toBeVisible();
  await page.clock.fastForward(29 * 60 * 1000);
  await expect(warning).toBeVisible();
  await page.clock.fastForward(60 * 1000);
  await expect(page).toHaveURL(/\/login$/);
});
test('production login hides demo credentials by default', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('Tài khoản demo', { exact: true })).toHaveCount(0);
});
