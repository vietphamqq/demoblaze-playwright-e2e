import { chromium } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { test, expect } from '@fixtures';
import { config } from '@config';

const run = promisify(execFile);
const REPORT_DIR = path.resolve('reports/lighthouse');
const RUNNER = path.resolve(__dirname, '../../src/perf/lighthouse-runner.mjs');

test('PERF-01: home page meets the Lighthouse budgets', { tag: '@perf' }, async () => {
  const port = 9222 + test.info().workerIndex;
  const browser = await chromium.launch({
    args: [`--remote-debugging-port=${port}`],
    executablePath: config.chromiumPath,
  });
  const args = JSON.stringify({
    url: `${config.baseUrl}/index.html`,
    port,
    outDir: REPORT_DIR,
    name: 'home',
  });
  const { stdout } = await run(process.execPath, [RUNNER, args], { timeout: 150_000 }).finally(() =>
    browser.close(),
  );
  const scores: Record<string, number> = JSON.parse(stdout.trim().split('\n').pop() ?? '{}');

  await test
    .info()
    .attach('lighthouse-home.html', { path: path.join(REPORT_DIR, 'home.html'), contentType: 'text/html' });
  test.info().annotations.push({ type: 'scores', description: JSON.stringify(scores) });
  for (const [category, budget] of Object.entries(config.lighthouse)) {
    expect.soft(scores[category], category).toBeGreaterThanOrEqual(budget);
  }
});
