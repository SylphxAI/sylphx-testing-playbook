/**
 * Playwright config — SOTA 2027 setup.
 *
 *   - Auto-wait everywhere (no hard sleeps)
 *   - Trace on failure for time-travel debugging
 *   - Multiple browsers (Chromium, Firefox, WebKit)
 *   - Mobile viewport coverage
 *   - CI sharding for parallel execution
 *
 * Copy into your project root. Adapt `baseURL`, `webServer`, and browser
 * list to your needs.
 */

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './tests/e2e',
	/* Fail fast in CI, more retries in dev */
	retries: process.env.CI ? 2 : 0,
	/* Parallelize: 4 workers locally, shard in CI */
	workers: process.env.CI ? 4 : undefined,

	/* Reporters: trace viewer HTML + terminal dots */
	reporter: [
		['html', { outputFolder: 'playwright-report' }],
		['list'],
		['github'],  // GitHub Actions annotations
	],

	use: {
		baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
		/* Trace on first retry — fast on main run, debuggable on flake */
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		/* Auto-wait up to 10s for elements */
		actionTimeout: 10_000,
		navigationTimeout: 30_000,
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},
		/* Mobile viewports */
		{
			name: 'mobile-chrome',
			use: { ...devices['Pixel 7'] },
		},
		{
			name: 'mobile-safari',
			use: { ...devices['iPhone 15'] },
		},
	],

	/* Start the dev server before tests (optional — remove if running externally) */
	webServer: process.env.CI
		? undefined
		: {
				command: 'bun run dev',
				url: 'http://localhost:3000',
				reuseExistingServer: !process.env.CI,
				timeout: 120_000,
			},
})
