import path from 'node:path';
import dotenv from 'dotenv';

const testEnv = process.env.TEST_ENV ?? 'qa';
const envDir = path.resolve(__dirname, '../../config/env');
dotenv.config({ path: path.join(envDir, '.env.local'), quiet: true });
dotenv.config({ path: path.join(envDir, `.env.${testEnv}`), quiet: true });

function getString(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback;
}

function getNumber(name: string, fallback: number): number {
  const value = getString(name);
  if (!value) return fallback;
  const number = Number(value);
  if (Number.isNaN(number)) throw new Error(`${name} must be a number, got "${value}"`);
  return number;
}

function getBoolean(name: string, fallback: boolean): boolean {
  const value = getString(name).toLowerCase();
  return value ? ['1', 'true', 'yes'].includes(value) : fallback;
}

const isCI = getBoolean('CI', false);

export const config = {
  testEnv,
  isCI,
  baseUrl: getString('BASE_URL', 'https://www.demoblaze.com'),
  apiUrl: getString('API_URL', 'https://api.demoblaze.com'),
  headless: getBoolean('HEADLESS', true),
  workers: getString('WORKERS') ? getNumber('WORKERS', 4) : undefined,
  retries: getNumber('RETRIES', isCI ? 2 : 0),
  video: getString('VIDEO', 'retain-on-failure') as 'off' | 'on' | 'retain-on-failure' | 'on-first-retry',
  chromiumPath: getString('CHROMIUM_PATH') || undefined,
  demoUser: {
    username: getString('DEMO_USERNAME'),
    password: getString('DEMO_PASSWORD'),
  },
  lighthouse: {
    performance: getNumber('LH_PERFORMANCE', 80),
    accessibility: getNumber('LH_ACCESSIBILITY', 70),
    'best-practices': getNumber('LH_BEST_PRACTICES', 80),
    seo: getNumber('LH_SEO', 75),
  },
};
