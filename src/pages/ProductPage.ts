import { Locator, Page, test } from '@playwright/test';
import { BasePage } from './BasePage';
import { acceptAlert } from '@utils/alert';
import { parsePrice } from '@utils/price';

export class ProductPage extends BasePage {
  protected path = '/prod.html';
  readonly name: Locator;
  readonly price: Locator;
  readonly addToCartButton: Locator;

  constructor(page: Page) {
    super(page);
    this.name = page.locator('#tbodyid h2.name');
    this.price = page.locator('#tbodyid h3.price-container');
    this.addToCartButton = page.getByRole('link', { name: 'Add to cart' });
  }

  async openById(id: number): Promise<this> {
    this.path = `/prod.html?idp_=${id}`;
    return this.open();
  }

  async waitForLoad(): Promise<void> {
    await this.name.waitFor();
  }

  async getPrice(): Promise<number> {
    return parsePrice(await this.price.innerText());
  }

  async addToCart(): Promise<string> {
    return test.step('add to cart', async () => {
      const added = this.page.waitForResponse((res) => res.url().endsWith('/addtocart') && res.ok());
      const message = await acceptAlert(this.page, () => this.addToCartButton.click());
      await added;
      return message;
    });
  }
}
