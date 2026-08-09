import { test, expect } from '@playwright/test'

test('User can book a ticket', async ({ page }) => {
  // Connexion
  await page.goto('/login')

  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password123')

  await page.click('button[type="submit"]')

  await expect(page).toHaveURL(/booking/)

  // Sélection du train
  await expect(page.locator('.train-option-compact')).toBeVisible()
  await page.locator('.train-option-compact').first().click()

  // Formulaire
  await page.fill('input[name="nom_voyageur"]', 'Rabe Hery')
  await page.selectOption('select[name="depart"]', 'Antananarivo')
  await page.selectOption('select[name="arrivee"]', 'Tamatave')

  await page.getByRole('button', { name: '2ème classe' }).click()

  // Validation
  await page.click('button[type="submit"]')

  await expect(page.locator('.toast-notification'))
    .toContainText('enregistré')
})