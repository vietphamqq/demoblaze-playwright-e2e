import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { config } from '@config';

export interface Product {
  id: number;
  title: string;
  price: number;
  cat: string;
  desc: string;
  img: string;
}

export interface CartItem {
  id: string;
  cookie: string;
  prod_id: number;
}

const NETWORK_RETRIES = 2;

export const encodePassword = (password: string): string => Buffer.from(password, 'utf8').toString('base64');

export class DemoblazeApi {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string = config.apiUrl,
  ) {}

  private post(path: string, data: unknown): Promise<APIResponse> {
    return this.request.post(`${this.baseUrl}${path}`, { data, maxRetries: NETWORK_RETRIES });
  }

  async signup(username: string, password: string): Promise<void> {
    const res = await this.post('/signup', { username, password: encodePassword(password) });
    expect(res.status()).toBe(200);
    expect(await res.json()).not.toHaveProperty('errorMessage');
  }

  loginRaw(username: string, password: string): Promise<APIResponse> {
    return this.post('/login', { username, password: encodePassword(password) });
  }

  async login(username: string, password: string): Promise<string> {
    const body: unknown = await (await this.loginRaw(username, password)).json();
    if (typeof body !== 'string' || !body.startsWith('Auth_token: ')) {
      throw new Error(`Login failed for "${username}": ${JSON.stringify(body)}`);
    }
    return body.replace('Auth_token: ', '');
  }

  async check(token: string): Promise<{ Item?: { username: string }; errorMessage?: string }> {
    return (await this.post('/check', { token })).json();
  }

  async getProducts(): Promise<Product[]> {
    const res = await this.request.get(`${this.baseUrl}/entries`, { maxRetries: NETWORK_RETRIES });
    expect(res.status()).toBe(200);
    return (await res.json()).Items;
  }

  async getProduct(id: number): Promise<Product> {
    const res = await this.post('/view', { id: String(id) });
    expect(res.status()).toBe(200);
    return res.json();
  }

  addToCartRaw(token: string, productId: number): Promise<APIResponse> {
    return this.post('/addtocart', { id: randomUUID(), cookie: token, prod_id: productId, flag: true });
  }

  async addToCart(token: string, productId: number): Promise<void> {
    expect((await this.addToCartRaw(token, productId)).status()).toBe(200);
  }

  getCartRaw(token: string): Promise<APIResponse> {
    return this.post('/viewcart', { cookie: token, flag: true });
  }

  async getCart(token: string): Promise<CartItem[]> {
    const body = await (await this.getCartRaw(token)).json();
    if (body.errorMessage) throw new Error(`viewcart failed: ${body.errorMessage}`);
    return body.Items;
  }

  async getGuestCart(cookie: string): Promise<CartItem[]> {
    return (await (await this.post('/viewcart', { cookie, flag: false })).json()).Items;
  }

  async deleteCartItem(itemId: string): Promise<void> {
    expect((await this.post('/deleteitem', { id: itemId })).status()).toBe(200);
  }

  async clearCart(username: string): Promise<void> {
    expect((await this.post('/deletecart', { cookie: username })).status()).toBe(200);
  }
}
