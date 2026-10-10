import http from 'k6/http';
import { check, sleep } from 'k6';
import { b64encode } from 'k6/encoding';

const API = __ENV.API_URL || 'https://api.demoblaze.com';
const params = { headers: { 'Content-Type': 'application/json' } };

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500'],
    checks: ['rate>0.99'],
  },
};

function post(path: string, body: object, name: string) {
  return http.post(`${API}${path}`, JSON.stringify(body), { ...params, tags: { name } });
}

export function setup() {
  const username = `k6_${Date.now()}`;
  const password = b64encode('Pass#123');
  post('/signup', { username, password }, 'signup');
  const token = (post('/login', { username, password }, 'login').json() as string).replace(
    'Auth_token: ',
    '',
  );
  return { username, token };
}

export default function ({ token }: { token: string }) {
  const entries = http.get(`${API}/entries`, { tags: { name: 'entries' } });
  check(entries, { 'products listed': (res) => (res.json('Items') as unknown[]).length > 0 });

  const productId = Math.floor(Math.random() * 9) + 1;
  const product = post('/view', { id: String(productId) }, 'view');
  check(product, { 'product returned': (res) => res.json('id') === productId });

  const added = post(
    '/addtocart',
    { id: `${__VU}-${__ITER}-${Date.now()}`, cookie: token, prod_id: productId, flag: true },
    'addtocart',
  );
  check(added, { 'added to cart': (res) => res.status === 200 });

  const cart = post('/viewcart', { cookie: token, flag: true }, 'viewcart');
  check(cart, { 'cart returned': (res) => Array.isArray(res.json('Items')) });

  sleep(1);
}

export function teardown({ username }: { username: string }) {
  post('/deletecart', { cookie: username }, 'deletecart');
}
