import { test, expect, knownBug } from '@fixtures';
import { randomUser } from '@data/factories';
import { Messages } from '@data/messages';
import { Products } from '@data/products';

test.describe('API', { tag: ['@api', '@regression'] }, () => {
  test('API-01: sign up and log in returns a token for the user', { tag: '@smoke' }, async ({ api }) => {
    const { username, password } = randomUser('api');
    await api.signup(username, password);

    const token = await api.login(username, password);

    expect((await api.check(token)).Item?.username).toBe(username);
  });

  test('API-02: login with wrong password fails', async ({ api, user }) => {
    const res = await api.loginRaw(user.username, 'wrong-password');
    expect(await res.json()).toEqual({ errorMessage: Messages.login.wrongPassword });
  });

  test('API-03: invalid token is rejected', async ({ api }) => {
    const res = await api.getCartRaw('not-a-real-token');
    expect(await res.json()).toEqual({ errorMessage: Messages.api.badToken });
  });

  test('API-04: add, view and delete cart items', { tag: '@smoke' }, async ({ api, user }) => {
    await api.addToCart(user.token, Products.nexus6.id);
    await api.addToCart(user.token, Products.sonyVaioI5.id);

    const cart = await api.getCart(user.token);
    expect(cart.map((item) => item.prod_id).sort()).toEqual(
      [Products.nexus6.id, Products.sonyVaioI5.id].sort(),
    );

    await api.deleteCartItem(cart[0].id);
    expect(await api.getCart(user.token)).toHaveLength(1);
  });

  test.fail('API-05: adding an unknown product is rejected', knownBug('BUG-07'), async ({ api, user }) => {
    await api.addToCart(user.token, 99999);
    expect(await api.getCart(user.token)).toEqual([]);
  });
});
