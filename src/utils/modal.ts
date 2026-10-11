import { expect, Locator } from '@playwright/test';

// Bootstrap moves focus to the modal when the fade-in ends, so text typed before that can get lost.
export async function waitForModal(modal: Locator): Promise<void> {
  await expect(modal.and(modal.page().locator(':focus-within'))).toBeVisible();
}
