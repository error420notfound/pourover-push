import { expect, test } from '@playwright/test';

test('loads the guide and updates brew state', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('PourOver');
  await expect(page.getByRole('link', { name: 'PourOver home' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Start Brew/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pour Timeline' })).toBeVisible();

  await page.getByRole('button', { name: /Start Brew/ }).click();
  await expect(page.getByRole('button', { name: /Restart Brew/ })).toBeVisible();
  await expect(page.getByText('Pause')).toBeVisible();

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByText('Resume')).toBeVisible();
});

test('expert controls update recipe and saved recipes', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('spinbutton', { name: 'Coffee' }).fill('24');
  await expect(page.getByText('24.0 g')).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Water' })).toHaveValue('384');

  await page.getByRole('button', { name: 'Save Recipe' }).click();
  await expect(page.getByText('1:16 · 24 g / 384 g')).toBeVisible();
});
