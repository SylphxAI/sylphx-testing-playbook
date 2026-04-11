/**
 * Template critical flow E2E test.
 *
 * Demonstrates SOTA patterns:
 *   - Auto-wait on assertions (no setTimeout)
 *   - Test IDs (not CSS selectors)
 *   - Network interception for external API stubbing
 *   - Page Object Model (minimal version)
 *   - @axe-core/playwright accessibility check
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('signup → first resource provisioned', () => {
	test.beforeEach(async ({ page }) => {
		// Stub external APIs — never hit real services in E2E
		await page.route('**/api.external.com/**', (route) => {
			route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) })
		})
	})

	test('@critical new user signs up and creates a resource', async ({ page }) => {
		// 1. Signup
		await page.goto('/signup')
		await page
			.getByRole('textbox', { name: 'Email' })
			.fill(`test-${Date.now()}@example.com`)
		await page
			.getByRole('textbox', { name: 'Password' })
			.fill('StrongPassword123!')
		await page.getByRole('button', { name: 'Create account' }).click()

		// Auto-wait for navigation
		await expect(page).toHaveURL(/\/console/)

		// 2. Create a resource
		await page.getByRole('link', { name: 'Databases' }).click()
		await page.getByRole('button', { name: 'New Database' }).click()
		await page.getByTestId('resource-name-input').fill('test-db')
		await page.getByRole('button', { name: 'Create' }).click()

		// 3. Wait for provisioning (long timeout for async infra)
		await expect(page.getByText('Synced')).toBeVisible({ timeout: 120_000 })

		// 4. Credentials shown
		const connectionString = page.getByTestId('connection-string')
		await expect(connectionString).toContainText('postgresql://')
	})

	test('@critical landing page is accessible', async ({ page }) => {
		await page.goto('/')
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze()
		expect(results.violations).toEqual([])
	})
})
