import { Locator, Page, test } from '@playwright/test';
import { acceptAlert } from '@utils/alert';
import { waitForModal } from '@utils/modal';

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
    await waitForModal(this.root);
    await this.username.fill(username);
    await this.password.fill(password);
  }

  async submit(username: string, password: string): Promise<void> {
    await this.fill(username, password);
    await this.loginButton.click();
  }

  async loginAndGetAlert(username: string, password: string): Promise<string> {
    return test.step(`try to log in as "${username}"`, async () => {
      await this.fill(username, password);
      return acceptAlert(this.page, () => this.loginButton.click());
    });
  }
}
