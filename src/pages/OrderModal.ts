import { Dialog, Locator, Page, test } from '@playwright/test';
import type { Order } from '@data/factories';

export interface Confirmation {
  title: string;
  id: string;
  amount: number;
  card: string;
  name: string;
  date: string;
}

export type OrderResult =
  { kind: 'confirmation'; confirmation: Confirmation } | { kind: 'alert'; message: string };

export class OrderModal {
  readonly root: Locator;
  readonly fields: Record<keyof Order, Locator>;
  readonly total: Locator;
  readonly purchaseButton: Locator;
  readonly confirmation: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('#orderModal');
    this.fields = {
      name: page.locator('#name'),
      country: page.locator('#country'),
      city: page.locator('#city'),
      card: page.locator('#card'),
      month: page.locator('#month'),
      year: page.locator('#year'),
    };
    this.total = page.locator('#totalm');
    this.purchaseButton = this.root.getByRole('button', { name: 'Purchase' });
    this.confirmation = page.locator('.sweet-alert.visible');
  }

  async fill(order: Partial<Order>): Promise<void> {
    await this.root.waitFor();
    for (const [field, value] of Object.entries(order) as [keyof Order, string][]) {
      await this.fields[field].fill(value);
    }
  }

  async submit(order: Partial<Order>, timeout = 15_000): Promise<OrderResult> {
    return test.step('submit order', async () => {
      await this.fill(order);

      let onDialog: ((dialog: Dialog) => void) | undefined;
      const alert = new Promise<OrderResult>((resolve) => {
        onDialog = (dialog) => {
          void dialog.accept().catch(() => undefined);
          resolve({ kind: 'alert', message: dialog.message() });
        };
        this.page.once('dialog', onDialog);
      });
      const cartCleared = this.page
        .waitForRequest((req) => req.url().endsWith('/deletecart'), { timeout })
        .then((req) => req.response())
        .catch(() => null);
      const confirmed = this.confirmation.waitFor({ timeout }).then(async (): Promise<OrderResult> => {
        await cartCleared;
        return { kind: 'confirmation', confirmation: await this.getConfirmation() };
      });

      await this.purchaseButton.click();
      try {
        return await Promise.race([alert, confirmed]);
      } finally {
        if (onDialog) this.page.off('dialog', onDialog);
        confirmed.catch(() => undefined);
      }
    });
  }

  async purchase(order: Partial<Order>): Promise<Confirmation> {
    const result = await this.submit(order);
    if (result.kind === 'alert')
      throw new Error(`Expected an order confirmation but got alert "${result.message}"`);
    return result.confirmation;
  }

  async getConfirmation(): Promise<Confirmation> {
    const text = await this.confirmation.locator('p.lead').innerText();
    const field = (label: string) => text.match(new RegExp(`${label}:\\s*(.*)`))?.[1]?.trim() ?? '';
    return {
      title: (await this.confirmation.locator('h2').innerText()).trim(),
      id: field('Id'),
      amount: Number(field('Amount').replace('USD', '')),
      card: field('Card Number'),
      name: field('Name'),
      date: field('Date'),
    };
  }

  async closeConfirmation(): Promise<void> {
    await this.confirmation.getByRole('button', { name: 'OK' }).click();
    await this.page.waitForURL(/index\.html/, { waitUntil: 'domcontentloaded' });
  }
}
