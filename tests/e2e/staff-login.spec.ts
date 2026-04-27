import { expect, test } from '@playwright/test'

test('staff can login in e2e bypass mode', async ({ page }) => {
  await page.goto('/login')

  await page.locator('#email').fill('e2e@crisis-sync.local')
  await page.locator('#password').fill('E2Epass123!')
  await page.getByRole('button', { name: /^authorize access$/i }).click()

  await page.waitForURL('**/dashboard')
  await expect(page.getByText('LIVE OPERATIONS').first()).toBeVisible()
})
