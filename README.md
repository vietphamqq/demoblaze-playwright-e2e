# DemoBlaze E2E Tests

Automated tests for the Login and Cart features of [demoblaze.com](https://www.demoblaze.com/), written with Playwright and TypeScript.

- Latest test report: [vietphamqq.github.io/demoblaze-playwright-e2e](https://vietphamqq.github.io/demoblaze-playwright-e2e/)
- Test cases and bugs: [Google Sheet](https://docs.google.com/spreadsheets/d/1Po4H9u4_cFwjMFUTjdUKemLtL19jO8LmpKfadKfAXwE/edit?usp=sharing)
- CI: [GitHub Actions](.github/workflows/e2e.yml)

## Setup

You need Node.js 20 or newer (I used 22, see `.nvmrc`).

```bash
npm ci
npx playwright install --with-deps
```

For the load test you also need k6 (`brew install k6` on Mac).

## Running the tests

```bash
npm test                  # everything
npm run test:smoke        # only @smoke tests
npm run test:ui           # Chromium, Firefox, WebKit and Pixel 7
npm run test:api          # API tests
npm run test:perf         # Lighthouse
npm run test:load         # k6 load test
npm run report            # open the last HTML report
```

The scenario asked for in the assignment (login, add to cart, place order) is `ORDER-01` in the checkout spec:

```bash
npx playwright test tests/ui/checkout.spec.ts --project=chromium
```

A few other commands I use:

```bash
npx playwright test --grep @cart --project=webkit     # run one tag on one browser
npx playwright test --headed --workers=1              # watch the browser
TEST_ENV=staging npx playwright test                  # load config/env/.env.staging
```

Note: every run overwrites `reports/html`. If you want several projects in one report, run them in the same command.

## Structure

```
src/
  api/           API client (signup, login, products, cart)
  components/    NavBar
  pages/         HomePage, ProductPage, CartPage, LoginModal, OrderModal
  fixtures/      page objects, api client, test users
  data/          messages, products, test data
  utils/         alert and price helpers
  perf/          Lighthouse runner
  config/        env config
tests/
  ui/            login, cart and checkout (30 tests)
  api/           API tests (5)
  perf/          Lighthouse (1)
perf/k6/         k6 load test
```

Playwright projects: `chromium`, `firefox`, `webkit`, `mobile-chrome` (Pixel 7), `api` (no browser) and `perf`.

Tags: `@smoke`, `@regression`, `@login`, `@cart`, `@checkout`, `@api`, `@perf`, `@known-bug`.

## Notes on the approach

I kept selectors inside the page objects only, so the tests read close to the test cases in the sheet.

Each test gets its own user. The `user` fixture signs up a new account through the API and empties the cart before and after the test, so tests can run in parallel without stepping on each other. Most cart and order tests use `loggedIn`, which just sets the session cookie, so only the login tests actually go through the login form. If you'd rather use a fixed account, set `DEMO_USERNAME` and `DEMO_PASSWORD`. (Creating accounts like this is fine on a demo site, I wouldn't do it on a shared environment.)

There are no fixed waits. DemoBlaze loads almost everything with AJAX, so I wait for the real signals instead:

- Alerts: the handler is registered before the click. Some alerts block the page immediately, and waiting for them after the click just hangs.
- Cart: the page waits until the number of rows matches what `/viewcart` returned. Without this, an "empty cart" check can pass before the rows are drawn.
- Navigation waits for `domcontentloaded` rather than `load`. Product pages load a video player and in Firefox `load` sometimes took over 30 seconds.
- Purchase: after clicking it, the order form waits for either the confirmation popup or an alert, so a negative test can't pass by checking too early.

Bugs I found have a test that expects the correct behaviour, tagged `@known-bug` and marked with `test.fail()`. That way the suite stays green but the bug is visible in the report, and once it gets fixed the test fails and reminds me to remove the marker. UI tests for known bugs also attach a screenshot of the page, so you can see the bug straight from the report.

Config (URLs, retries, video, credentials, performance budgets) lives in `config/env/.env.<TEST_ENV>`. Local overrides go in `config/env/.env.local`, which is git-ignored.

Reports: locally you get the console output and the Playwright HTML report (with trace, screenshot and video on failure). Lighthouse writes to `reports/lighthouse/home.html` and k6 to `reports/k6/index.html`. In CI everything ends up on GitHub Pages, see below.

### Performance

I split it into two checks:

- **Lighthouse** on the home page, checked against the budgets in the env file. It runs in its own Node process because it kept crashing inside the Playwright worker on Node 23.
- **k6** for the API: 5 virtual users for 30 seconds, each one lists products, opens one, adds it to the cart and loads the cart. It fails if p95 goes over 1500 ms, more than 1% of requests fail or a check fails. I kept the load small on purpose since this is a public demo site. You can raise it with `VUS=10 DURATION=1m npm run test:load`.

## CI

- On pull requests: lint, then the `@smoke` tests on every browser and the API.
- On main and nightly: the full `@regression` set, plus Lighthouse and k6.
- It can also be started manually with a tag.

Failed tests are retried twice in CI.

On main and nightly runs the last job merges the Playwright results from all jobs into one report and publishes it to [GitHub Pages](https://vietphamqq.github.io/demoblaze-playwright-e2e/), together with the Lighthouse report and the k6 dashboard. Traces can be opened straight from there. If you fork this, turn it on under Settings → Pages → Source: GitHub Actions.

## Bugs found

The site has no written requirements, so in a couple of cases the expected behaviour is my own assumption. Those are marked in the sheet.

| ID     | Severity | Bug                                                                                              | Test     |
| ------ | -------- | ------------------------------------------------------------------------------------------------ | -------- |
| BUG-01 | High     | You can place an order with an empty cart (Amount: 0 USD)                                        | ORDER-06 |
| BUG-02 | Medium   | The order date shows last month (`getMonth()` starts at 0)                                       | ORDER-07 |
| BUG-03 | High     | Card number, month and year aren't validated (assumed requirement)                               | ORDER-08 |
| BUG-04 | High     | Guests who open a product link directly all share one cart                                       | CART-09  |
| BUG-05 | High     | Orders are never sent to the server, the order id is just a random number from the browser       | ORDER-10 |
| BUG-06 | Low      | The confirmation shows the full card number                                                      | ORDER-09 |
| BUG-07 | Medium   | The API accepts a product id that doesn't exist                                                  | API-05   |
| BUG-08 | Medium   | On mobile the menu on the product and cart pages doesn't collapse and the menu button is covered | CART-10  |

Steps to reproduce are in the Bugs tab of the sheet.

## What I'd add with more time

- Accessibility checks with `@axe-core/playwright`
- Visual comparison with `toHaveScreenshot`
