import { test, expect, knownBug } from '@fixtures';
import { Messages } from '@data/messages';
import { Products } from '@data/products';
import { HomePage } from '@pages/HomePage';
import { CartPage } from '@pages/CartPage';
import { sum } from '@utils/price';
import { openProductFromHome } from '@flows/cart';

test.describe('Cart', { tag: ['@cart', '@regression'] }, () => {
  test(
    'CART-01: add a product to the cart',
    { tag: '@smoke' },
    async ({ productPage, cartPage, loggedIn, api }) => {
      await productPage.openById(Products.samsungGalaxyS6.id);
      const price = await productPage.getPrice();

      expect(await productPage.addToCart()).toBe(Messages.cart.productAdded);

      await cartPage.open();
      expect(await cartPage.getRows()).toEqual([{ title: Products.samsungGalaxyS6.title, price }]);
      await expect(cartPage.total).toHaveText(String(price));
      expect(await api.getCart(loggedIn.token)).toHaveLength(1);
    },
  );

  test('CART-02: total is the sum of all items', async ({ cartPage, loggedIn, api }) => {
    const items = [Products.samsungGalaxyS6, Products.sonyVaioI5, Products.appleMonitor24];
    for (const item of items) await api.addToCart(loggedIn.token, item.id);
    const prices = await Promise.all(items.map(async (item) => (await api.getProduct(item.id)).price));

    await cartPage.open();

    await expect(cartPage.rows).toHaveCount(items.length);
    await expect(cartPage.total).toHaveText(String(sum(prices)));
  });

  test('CART-03: same product added twice shows two rows', async ({
    productPage,
    cartPage,
    loggedIn,
    api,
  }) => {
    await productPage.openById(Products.nexus6.id);
    const price = await productPage.getPrice();
    await productPage.addToCart();
    await productPage.addToCart();

    await cartPage.open();

    await expect(cartPage.rows).toHaveCount(2);
    await expect(cartPage.total).toHaveText(String(price * 2));
    expect(await api.getCart(loggedIn.token)).toHaveLength(2);
  });

  test('CART-04: delete an item', async ({ cartPage, loggedIn, api }) => {
    await api.addToCart(loggedIn.token, Products.samsungGalaxyS6.id);
    await api.addToCart(loggedIn.token, Products.nokiaLumia1520.id);
    const { price } = await api.getProduct(Products.nokiaLumia1520.id);

    await cartPage.open();
    await cartPage.deleteItem(Products.samsungGalaxyS6.title);

    await expect(cartPage.rows).toHaveCount(1);
    await expect(cartPage.rows.first()).toContainText(Products.nokiaLumia1520.title);
    await expect(cartPage.total).toHaveText(String(price));
  });

  test('CART-05: delete the last item', async ({ cartPage, loggedIn, api }) => {
    await api.addToCart(loggedIn.token, Products.samsungGalaxyS6.id);

    await cartPage.open();
    await cartPage.deleteItem(Products.samsungGalaxyS6.title);

    await expect(cartPage.rows).toHaveCount(0);
    await expect(cartPage.total).toBeEmpty();
  });

  test('CART-06: cart is kept for the next session', async ({ browser, productPage, loggedIn }) => {
    await productPage.openById(Products.sonyVaioI5.id);
    await productPage.addToCart();

    const context = await browser.newContext();
    const page = await context.newPage();
    const homePage = await new HomePage(page).open();
    await homePage.login(loggedIn.username, loggedIn.password);
    const cartPage = await new CartPage(page).open();

    await expect(cartPage.rows).toHaveCount(1);
    await expect(cartPage.rows.first()).toContainText(Products.sonyVaioI5.title);
    await context.close();
  });

  test('CART-07: guest can add to cart', async ({ homePage, productPage, cartPage }) => {
    await openProductFromHome(homePage, productPage, Products.nokiaLumia1520.title);

    expect(await productPage.addToCart()).toMatch(/^Product added\.?$/);

    await cartPage.open();
    await expect(cartPage.rows).toHaveCount(1);
  });

  test('CART-08: add one product from each category', async ({
    homePage,
    productPage,
    cartPage,
    loggedIn,
  }) => {
    const picks = [
      { category: 'Phones', product: Products.nexus6 },
      { category: 'Laptops', product: Products.sonyVaioI5 },
      { category: 'Monitors', product: Products.appleMonitor24 },
    ] as const;
    for (const { category, product } of picks) {
      await homePage.open();
      await homePage.filterByCategory(category);
      await homePage.openProduct(product.title);
      await productPage.waitForLoad();
      await productPage.addToCart();
    }

    await cartPage.open();

    const titles = (await cartPage.getRows()).map((row) => row.title).sort();
    expect(titles).toEqual(picks.map(({ product }) => product.title).sort());
    await expect(cartPage.nav.welcome).toHaveText(Messages.login.welcome(loggedIn.username));
  });

  test.fail(
    'CART-09: guest opening a product link directly gets an own cart',
    knownBug('BUG-04'),
    async ({ productPage, api }) => {
      await productPage.openById(Products.nokiaLumia1520.id);
      await productPage.addToCart();

      const guestCookie = await productPage.page.evaluate(() => document.cookie);
      expect(await api.getGuestCart(guestCookie)).toHaveLength(1);
    },
  );

  test.describe('mobile', { tag: '@mobile' }, () => {
    test.fail(
      'CART-10: mobile menu works on the product page',
      knownBug('BUG-08'),
      async ({ productPage }) => {
        await productPage.openById(Products.samsungGalaxyS6.id);

        await expect(productPage.nav.cart).toBeHidden({ timeout: 3_000 });
        await productPage.nav.menuButton.click({ trial: true, timeout: 3_000 });
      },
    );
  });
});
