import { Locator, Page, Response, expect, test } from '@playwright/test';
import { BasePage } from './BasePage';
import { OrderModal } from './OrderModal';
import { parsePrice } from '@utils/price';

export interface CartRow {
  title: string;
  price: number;
}

const isViewCart = (res: Response) => res.url().endsWith('/viewcart') && res.request().method() === 'POST';

export class CartPage extends BasePage {
  protected readonly path = '/cart.html';
  readonly rows: Locator;
  readonly total: Locator;
  readonly placeOrderButton: Locator;
  readonly orderModal: OrderModal;

  constructor(page: Page) {
    super(page);
    this.rows = page.locator('#tbodyid tr');
    this.total = page.locator('#totalp');
    this.placeOrderButton = page.getByRole('button', { name: 'Place Order' });
    this.orderModal = new OrderModal(page);
  }

  async waitForLoad(): Promise<void> {
    await this.placeOrderButton.waitFor();
  }

  override async open(): Promise<this> {
    await this.loadAfter(() => this.page.goto(this.path, { waitUntil: 'domcontentloaded' }));
    return this;
  }

  async loadAfter(action: () => Promise<unknown>): Promise<void> {
    await test.step('load cart', async () => {
      const viewCart = this.page.waitForResponse(isViewCart);
      await action();
      await this.waitForLoad();
      await this.waitForItems(viewCart);
    });
  }

  private async waitForItems(viewCart: Promise<Response>): Promise<void> {
    const { Items = [] } = await (await viewCart).json();
    await expect(this.rows).toHaveCount(Items.length);
  }

  async getRows(): Promise<CartRow[]> {
    const rows: CartRow[] = [];
    for (const row of await this.rows.all()) {
      const cells = row.locator('td');
      rows.push({
        title: (await cells.nth(1).innerText()).trim(),
        price: parsePrice(await cells.nth(2).innerText()),
      });
    }
    return rows;
  }

  async deleteItem(title: string): Promise<void> {
    await test.step(`delete ${title}`, async () => {
      const deleted = this.page.waitForResponse((res) => res.url().endsWith('/deleteitem'));
      await this.loadAfter(async () => {
        await this.rows.filter({ hasText: title }).first().getByRole('link', { name: 'Delete' }).click();
        await deleted;
      });
    });
  }

  async openPlaceOrder(): Promise<OrderModal> {
    await this.placeOrderButton.click();
    await this.orderModal.root.waitFor();
    return this.orderModal;
  }
}
