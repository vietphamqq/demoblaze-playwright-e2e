import { test, expect, knownBug } from '@fixtures';
import { Messages } from '@data/messages';
import { Products } from '@data/products';
import { randomOrder } from '@data/factories';
import { openProductFromHome } from '@flows/cart';
import { sum } from '@utils/price';

test.describe('Place order', { tag: ['@checkout', '@regression'] }, () => {
  test(
    'ORDER-01: login, add to cart and place an order',
    { tag: ['@smoke', '@e2e'] },
    async ({ homePage, productPage, cartPage, user, api }) => {
      const products = [Products.samsungGalaxyS6, Products.sonyVaioI5];

      await homePage.open();
      await homePage.login(user.username, user.password);
      await expect(homePage.nav.welcome).toHaveText(Messages.login.welcome(user.username));

      const prices: number[] = [];
      for (const product of products) {
        await openProductFromHome(homePage, productPage, product.title);
        await expect(productPage.name).toHaveText(product.title);
        prices.push(await productPage.getPrice());
        expect(await productPage.addToCart()).toBe(Messages.cart.productAdded);
      }
      const total = sum(prices);

      await test.step('check the cart', async () => {
        await cartPage.loadAfter(() => homePage.nav.openCart());
        const titles = (await cartPage.getRows()).map((row) => row.title);
        expect(titles.sort()).toEqual(products.map((p) => p.title).sort());
        await expect(cartPage.total).toHaveText(String(total));
      });

      const order = randomOrder();
      const orderModal = await cartPage.openPlaceOrder();
      await expect(orderModal.total).toHaveText(`Total: ${total}`);
      const confirmation = await orderModal.purchase(order);

      await test.step('check the confirmation', async () => {
        expect(confirmation.title).toBe(Messages.order.thankYou);
        expect(confirmation.id).toMatch(/^\d+$/);
        expect(confirmation.amount).toBe(total);
        expect(confirmation.name).toBe(order.name);
      });

      await test.step('cart is empty after the order', async () => {
        await orderModal.closeConfirmation();
        await cartPage.open();
        await expect(cartPage.rows).toHaveCount(0);
        expect(await api.getCart(user.token)).toHaveLength(0);
      });
    },
  );

  test.fail(
    'ORDER-06: order is blocked when the cart is empty',
    knownBug('BUG-01'),
    async ({ cartPage, loggedIn }) => {
      await cartPage.open();
      const orderModal = await cartPage.openPlaceOrder();

      const result = await orderModal.submit({ name: loggedIn.username, card: '4111111111111111' });

      expect(result.kind).toBe('alert');
    },
  );

  test.describe('with one item in the cart', () => {
    test.beforeEach(async ({ api, loggedIn, cartPage }) => {
      await api.addToCart(loggedIn.token, Products.nexus6.id);
      await cartPage.open();
    });

    const missingFields = [
      { id: 'ORDER-02', title: 'all fields are empty', order: {} },
      { id: 'ORDER-03', title: 'name is empty', order: randomOrder({ name: '' }) },
      { id: 'ORDER-04', title: 'card is empty', order: randomOrder({ card: '' }) },
    ];
    for (const data of missingFields) {
      test(`${data.id}: order is blocked when ${data.title}`, async ({ cartPage, api, loggedIn }) => {
        const orderModal = await cartPage.openPlaceOrder();

        const result = await orderModal.submit(data.order);

        expect(result).toEqual({ kind: 'alert', message: Messages.order.missingFields });
        expect(await api.getCart(loggedIn.token)).toHaveLength(1);
      });
    }

    test('ORDER-05: only name and card are required', async ({ cartPage }) => {
      const orderModal = await cartPage.openPlaceOrder();

      const confirmation = await orderModal.purchase({ name: 'Only Required', card: '4111111111111111' });

      expect(confirmation.title).toBe(Messages.order.thankYou);
      expect(confirmation.name).toBe('Only Required');
    });

    test.fail("ORDER-07: confirmation shows today's date", knownBug('BUG-02'), async ({ cartPage }) => {
      const orderModal = await cartPage.openPlaceOrder();

      const confirmation = await orderModal.purchase(randomOrder());

      const today = new Date();
      expect(confirmation.date).toBe(`${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`);
    });

    test.fail('ORDER-08: invalid card data is rejected', knownBug('BUG-03'), async ({ cartPage }) => {
      const orderModal = await cartPage.openPlaceOrder();

      const result = await orderModal.submit(randomOrder({ card: 'abcd', month: '13', year: '1999' }));

      expect(result.kind).toBe('alert');
    });

    test.fail(
      'ORDER-09: card number is masked on the confirmation',
      knownBug('BUG-06'),
      async ({ cartPage }) => {
        const order = randomOrder();
        const orderModal = await cartPage.openPlaceOrder();

        const confirmation = await orderModal.purchase(order);

        expect(confirmation.card).not.toContain(order.card);
      },
    );

    test.fail('ORDER-10: order is sent to the server', knownBug('BUG-05'), async ({ cartPage }) => {
      const requests: string[] = [];
      cartPage.page.on('request', (req) => requests.push(new URL(req.url()).pathname));
      const orderModal = await cartPage.openPlaceOrder();

      await orderModal.purchase(randomOrder());

      expect(requests.some((path) => /order|purchase|checkout/i.test(path))).toBe(true);
    });

    test.fail(
      'ORDER-11: no confirmation when the order request fails',
      knownBug('BUG-10'),
      async ({ cartPage }) => {
        await cartPage.page.route('**/deletecart', (route) => route.abort());
        const orderModal = await cartPage.openPlaceOrder();

        const result = await orderModal.submit(randomOrder());

        expect(result.kind).toBe('alert');
      },
    );
  });
});
