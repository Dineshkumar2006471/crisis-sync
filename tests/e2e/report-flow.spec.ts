import { expect, test } from '@playwright/test'

test('guest can send a report and see confirmation', async ({ page }) => {
  await page.route('**/api/classify', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        incident_id: 'incident_e2e_001',
        classification: {
          crisis_type: 'fire',
          severity: 'critical',
          confidence: 0.96,
          summary_english: 'Smoke detected near room 312.',
          guest_instruction: 'Stay calm and move away from smoke. Staff are responding.',
          staff_instructions: {
            front_desk: 'Trigger evacuation protocol.',
            security: 'Proceed to floor 3 and secure exits.',
            housekeeping: 'Guide nearby guests toward staircase.',
            management: 'Coordinate external responders.',
          },
          call_emergency_services: true,
          emergency_number: '101',
        },
      }),
    })
  })

  await page.goto('/report')
  await page.getByRole('button', { name: 'Fire' }).click()
  await page.getByPlaceholder('Smoke coming from the third floor near the elevator...').fill('Heavy smoke in hallway')
  await page.getByPlaceholder('412').fill('312')
  await page.getByRole('button', { name: 'Report Emergency' }).click()

  await expect(page.getByText('Alert Sent')).toBeVisible()
  await expect(page.getByText('CALL EMERGENCY SERVICES: 101')).toBeVisible()
})
