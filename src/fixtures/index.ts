import { test as base, expect } from '@playwright/test';
import { DemoblazeApi } from '@api/DemoblazeApi';
import { HomePage } from '@pages/HomePage';
import { ProductPage } from '@pages/ProductPage';
import { CartPage } from '@pages/CartPage';
import { User, randomUser } from '@data/factories';
import { config } from '@config';

export interface TestUser extends User {
  token: string;
}

type Fixtures = {
  api: DemoblazeApi;
  homePage: HomePage;
  productPage: ProductPage;
  cartPage: CartPage;
  user: TestUser;
  loggedIn: TestUser;
};

export const test = base.extend<Fixtures>({
  api: async ({ request }, use) => use(new DemoblazeApi(request)),
  homePage: async ({ page }, use) => use(new HomePage(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),

  user: async ({ api }, use, testInfo) => {
    const { username, password } = config.demoUser;
    const useDemoUser = Boolean(username && password);
    const user = useDemoUser ? { username, password } : randomUser();
    if (!useDemoUser) await api.signup(user.username, user.password);
    const token = await api.login(user.username, user.password);
    await api.clearCart(user.username);
    testInfo.annotations.push({ type: 'user', description: user.username });

    await use({ ...user, token });

    await api.clearCart(user.username).catch(() => undefined);
  },

  loggedIn: async ({ context, user }, use) => {
    const domain = new URL(config.baseUrl).hostname;
    await context.addCookies([{ name: 'tokenp_', value: user.token, domain, path: '/' }]);
    await use(user);
  },
});

export const knownBug = (defect: string) => ({
  tag: '@known-bug',
  annotation: { type: 'issue', description: defect },
});

export { expect };
