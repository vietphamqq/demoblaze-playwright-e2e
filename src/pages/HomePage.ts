import { Locator, Page, test } from '@playwright/test';
import { BasePage } from './BasePage';
import { LoginModal } from './LoginModal';

export class HomePage extends BasePage {
  protected readonly path = '/index.html';
  readonly loginModal: LoginModal;
  readonly products: Locator;

  constructor(page: Page) {
    super(page);
    this.loginModal = new LoginModal(page);
    this.products = page.locator('#tbodyid .card');
  }

  async waitForLoad(): Promise<void> {
    await this.products.first().waitFor();
  }

  async login(username: string, password: string): Promise<void> {
    await test.step(`log in as ${username}`, async () => {
      await this.nav.openLogin();
      await this.loginModal.submit(username, password);
      await this.nav.welcome.waitFor();
    });
  }

  async filterByCategory(category: 'Phones' | 'Laptops' | 'Monitors'): Promise<void> {
    const loaded = this.page.waitForResponse((res) => res.url().endsWith('/bycat'));
    await this.page.getByRole('link', { name: category, exact: true }).click();
    await loaded;
  }

  async openProduct(title: string): Promise<void> {
    await test.step(`open product ${title}`, async () => {
      await this.page.locator('#tbodyid .card-title a', { hasText: title }).click();
      await this.page.waitForURL(/prod\.html\?idp_=/, { waitUntil: 'domcontentloaded' });
    });
  }
}
