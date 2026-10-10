import { Locator, Page, test } from '@playwright/test';
import { acceptAlert } from '@utils/alert';

export class LoginModal {
  readonly root: Locator;
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly closeButton: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('#logInModal');
    this.username = page.locator('#loginusername');
    this.password = page.locator('#loginpassword');
    this.loginButton = this.root.getByRole('button', { name: 'Log in' });
    this.closeButton = this.root.locator('.modal-footer').getByRole('button', { name: 'Close' });
  }

  async fill(username: string, password: string): Promise<void> {
    await this.root.waitFor();
    await this.username.fill(username);
    await this.password.fill(password);
  }

  async login(username: string, password: string): Promise<void> {
    await test.step(`log in as ${username}`, async () => {
      await this.fill(username, password);
      const reloaded = this.page.waitForEvent('domcontentloaded');
      await this.loginButton.click();
      await reloaded;
    });
  }

  async loginAndGetAlert(username: string, password: string): Promise<string> {
    return test.step(`try to log in as "${username}"`, async () => {
      await this.fill(username, password);
      return acceptAlert(this.page, () => this.loginButton.click());
    });
  }
}
