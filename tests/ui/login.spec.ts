import { test, expect } from '@fixtures';
import { Messages } from '@data/messages';
import { invalidLogins, fillPlaceholders } from '@data/login.data';

test.describe('Login', { tag: ['@login', '@regression'] }, () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
  });

  test('LOGIN-01: login with valid credentials', { tag: '@smoke' }, async ({ homePage, user }) => {
    await homePage.login(user.username, user.password);

    await expect(homePage.nav.welcome).toHaveText(Messages.login.welcome(user.username));
    await expect(homePage.nav.login).toBeHidden();
    await expect(homePage.nav.signup).toBeHidden();
  });

  test('LOGIN-02: session is kept after reload', async ({ homePage, user }) => {
    await homePage.login(user.username, user.password);
    await homePage.page.reload({ waitUntil: 'domcontentloaded' });

    await expect(homePage.nav.welcome).toHaveText(Messages.login.welcome(user.username));
  });

  test('LOGIN-03: logout', async ({ homePage, loggedIn }) => {
    await homePage.open();
    await expect(homePage.nav.welcome).toHaveText(Messages.login.welcome(loggedIn.username));

    await homePage.nav.logOut();

    await expect(homePage.nav.login).toBeVisible();
    await expect(homePage.nav.welcome).toBeHidden();
  });

  test('LOGIN-04: closing the login form does not log in', async ({ homePage, user }) => {
    await homePage.nav.openLogin();
    await homePage.loginModal.fill(user.username, user.password);
    await homePage.loginModal.closeButton.click();

    await expect(homePage.loginModal.root).toBeHidden();
    await expect(homePage.nav.welcome).toBeHidden();
  });

  for (const data of invalidLogins) {
    test(`${data.id}: login fails with ${data.title}`, async ({ homePage, user }) => {
      await homePage.nav.openLogin();
      const alert = await homePage.loginModal.loginAndGetAlert(
        fillPlaceholders(data.username, user),
        fillPlaceholders(data.password, user),
      );

      expect(alert).toBe(data.expected);
      await expect(homePage.nav.welcome).toBeHidden();
    });
  }

  test('LOGIN-10: script in username is shown as text', async ({ homePage, api }) => {
    const user = { username: `<img src=x onerror=window.xss=1>${Date.now()}`, password: 'Pass#123' };
    await api.signup(user.username, user.password);

    await homePage.login(user.username, user.password);

    await expect(homePage.nav.welcome).toHaveText(Messages.login.welcome(user.username));
    expect(await homePage.page.evaluate(() => 'xss' in window)).toBe(false);
  });
});
