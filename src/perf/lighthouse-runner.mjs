import lighthouse from 'lighthouse';
import fs from 'node:fs';
import path from 'node:path';

const { url, port, outDir, name } = JSON.parse(process.argv[2]);

const result = await lighthouse(url, {
  port,
  output: ['html', 'json'],
  logLevel: 'error',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  formFactor: 'desktop',
  screenEmulation: { disabled: true },
  throttlingMethod: 'provided',
});
if (!result) throw new Error(`No Lighthouse result for ${url}`);

const [html, json] = result.report;
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${name}.html`), html);
fs.writeFileSync(path.join(outDir, `${name}.json`), json);

const scores = Object.fromEntries(
  Object.entries(result.lhr.categories).map(([key, value]) => [key, Math.round((value.score ?? 0) * 100)]),
);
console.log(JSON.stringify(scores));
