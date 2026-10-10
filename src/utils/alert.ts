import { Page } from '@playwright/test';

export async function acceptAlert(
  page: Page,
  action: () => Promise<unknown>,
  timeout = 15_000,
): Promise<string> {
  let timer: NodeJS.Timeout | undefined;
  const message = new Promise<string>((resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`No alert within ${timeout}ms`)), timeout);
    page.once('dialog', async (dialog) => {
      const text = dialog.message();
      await dialog.accept().catch(() => undefined);
      resolve(text);
    });
  });
  try {
    await action();
    return await message;
  } finally {
    clearTimeout(timer);
  }
}
