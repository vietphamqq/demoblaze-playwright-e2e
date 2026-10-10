import { Locator, Page } from '@playwright/test';

export class NavBar {
  readonly cart: Locator;
  readonly login: Locator;
  readonly logout: Locator;
  readonly signup: Locator;
  readonly welcome: Locator;
  readonly menuButton: Locator;

  constructor(private readonly page: Page) {
    this.cart = page.locator('#cartur');
    this.login = page.locator('#login2');
    this.logout = page.locator('#logout2');
    this.signup = page.locator('#signin2');
    this.welcome = page.locator('#nameofuser');
    this.menuButton = page.locator('.navbar-toggler');
  }

  private async click(link: Locator): Promise<void> {
    if (!(await link.isVisible())) {
      await this.menuButton.click();
      await link.waitFor();
    }
    await link.click();
  }

  async openLogin(): Promise<void> {
    await this.click(this.login);
  }

  async openCart(): Promise<void> {
    await this.click(this.cart);
    await this.page.waitForURL(/cart\.html/, { waitUntil: 'domcontentloaded' });
  }

  async logOut(): Promise<void> {
    await this.click(this.logout);
    await this.page.waitForURL(/index\.html/, { waitUntil: 'domcontentloaded' });
  }
}
