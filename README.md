# DemoBlaze E2E Tests

[![E2E](https://github.com/vietphamqq/demoblaze-playwright-e2e/actions/workflows/e2e.yml/badge.svg?branch=main)](https://github.com/vietphamqq/demoblaze-playwright-e2e/actions/workflows/e2e.yml)

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
  api/           API client and response schemas
  components/    NavBar
  pages/         HomePage, ProductPage, CartPage, LoginModal, OrderModal
  fixtures/      page objects, api client, test users
  data/          messages, products, test data
  utils/         alert and price helpers
  flows/         steps that span more than one page
  perf/          Lighthouse runner
  config/        env config
tests/
  ui/            login, cart and checkout (31 tests)
  api/           API tests (6)
  perf/          Lighthouse (1)
perf/k6/         k6 load test
```

Playwright projects: `chromium`, `firefox`, `webkit`, `mobile-chrome` (Pixel 7), `api` (no browser) and `perf`.

Tags: `@smoke`, `@regression`, `@login`, `@cart`, `@checkout`, `@api`, `@perf`, `@known-bug`, `@mobile`. Tests tagged `@mobile` only run on the Pixel 7 project.

## Notes on the approach

- Selectors live only in the page objects, so the tests read like the test cases in the sheet.
- Each test signs up its own user through the API and empties the cart before and after, so tests can run in parallel. Cart and order tests log in by setting the session cookie; only the login tests use the form. Set `DEMO_USERNAME` and `DEMO_PASSWORD` to use a fixed account instead.
- No fixed waits. Alert handlers are registered before the click, the cart waits for the rows returned by `/viewcart`, and navigation waits for `domcontentloaded` (in Firefox `load` sometimes took over 30 seconds on product pages).
- API responses are checked against zod schemas (`src/api/schemas.ts`), so if the API changes shape the test fails with a clear message instead of somewhere later.
- Each bug has a test that expects the correct behaviour, tagged `@known-bug` and marked with `test.fail()`. The suite stays green, the bug shows in the report (with a screenshot for UI tests), and once it's fixed the test fails so I know to remove the marker.
- Config lives in `config/env/.env.<TEST_ENV>`. Local overrides go in `config/env/.env.local`, which is git-ignored.
- Reports: the Playwright HTML report locally (trace, screenshot and video on failure), Lighthouse in `reports/lighthouse/home.html` and k6 in `reports/k6/index.html`. In CI everything is published to GitHub Pages.

### Performance

- **Lighthouse** on the home page, checked against the budgets in the env file. It runs in its own Node process because it crashed inside the Playwright worker on Node 23.
- **k6** for the API: 5 virtual users for 30 seconds browsing products, adding to cart and loading the cart. It fails if p95 is over 1500 ms, more than 1% of requests fail or a check fails. The load is small on purpose since this is a public demo site; raise it with `VUS=10 DURATION=1m npm run test:load`.

## CI

- On pull requests: lint, then the `@smoke` tests on every browser and the API.
- On main and nightly: the full `@regression` set, plus Lighthouse and k6.
- It can also be started manually with a tag.

Failed tests are retried twice in CI, and a new push cancels the older run on the same branch.

On main and nightly runs the last job merges the Playwright results from all jobs into one report and publishes it to [GitHub Pages](https://vietphamqq.github.io/demoblaze-playwright-e2e/), together with the Lighthouse report and the k6 dashboard. Traces can be opened straight from there. If you fork this, turn it on under Settings → Pages → Source: GitHub Actions.

## Bugs found

I found 10 bugs. The main ones:

| ID     | Severity | Bug                                                                                        | Test     |
| ------ | -------- | ------------------------------------------------------------------------------------------ | -------- |
| BUG-01 | High     | You can place an order with an empty cart (Amount: 0 USD)                                  | ORDER-06 |
| BUG-04 | High     | Guests who open a product link directly all share one cart                                 | CART-09  |
| BUG-05 | High     | Orders are never sent to the server, the order id is just a random number from the browser | ORDER-10 |
| BUG-02 | Medium   | The order date shows last month (`getMonth()` starts at 0)                                 | ORDER-07 |

The full list with steps to reproduce is in the [Bugs tab of the sheet](https://docs.google.com/spreadsheets/d/1Po4H9u4_cFwjMFUTjdUKemLtL19jO8LmpKfadKfAXwE/edit#gid=12). The site has no written requirements, so for a couple of them the expected behaviour is my own assumption; those are marked there.

## What I'd add with more time

- Accessibility checks with `@axe-core/playwright`
- Visual comparison with `toHaveScreenshot`
