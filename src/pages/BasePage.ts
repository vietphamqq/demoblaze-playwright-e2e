import { Page } from '@playwright/test';
import { NavBar } from '@components/NavBar';

export abstract class BasePage {
  readonly nav: NavBar;
  protected abstract readonly path: string;

  constructor(readonly page: Page) {
    this.nav = new NavBar(page);
  }

  async open(): Promise<this> {
    await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
    await this.waitForLoad();
    return this;
  }

  abstract waitForLoad(): Promise<void>;
}
