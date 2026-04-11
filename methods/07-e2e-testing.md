# 07 — E2E Browser Testing

> Drive a real browser through your UI the way a user would. Catch integration bugs between frontend, backend, DB, and everything in between.

**Category:** Critical (for user-facing products)
**Effort:** Medium
**ROI:** High for the critical happy path; diminishing for exhaustive coverage
**Maturity level it unlocks:** 2→3

---

## What it is

E2E tests spawn a real browser (Chromium / Firefox / WebKit), navigate to
your app, and perform real user actions: click, type, wait for responses,
assert on visible text.

Unlike unit / integration tests, E2E exercises the **entire stack**:
- Frontend routing + rendering
- Real HTTP requests to your backend
- Real DB reads + writes (usually against a test DB)
- Real session / auth flow

## Why it catches bugs nothing else does

E2E catches **full-stack integration bugs**:
- Frontend sends data in shape A, backend expects shape B
- CORS / cookie / CSRF bugs
- Session expiry handling
- Cross-browser rendering differences
- Race conditions in the UI (button disabled after click, etc)
- Navigation bugs (back button, deep links, refresh state)

None of these show up in unit or integration tests that stub the HTTP layer.

## When to use

**Must**:
- The critical happy path for paying users (signup → pay → receive product)
- Authentication flows
- Data entry that affects money or legally-binding state

**Should**:
- Top 5 user journeys by traffic
- Any flow where a bug == customer support ticket

**Don't**:
- Every possible UI state (too slow, too brittle)
- Logic that can be tested at a lower layer

## Tools

| Tool | Status | Best for |
|---|---|---|
| **Playwright** | 🟢 **SOTA 2025-2027** | Default choice. Auto-wait, trace viewer, all browsers |
| **Cypress** | 🟡 Mature | Good dev experience, weaker cross-browser story |
| **Puppeteer** | 🟡 Low-level | When you need exact Chrome control |
| **Selenium** | 🔴 Legacy | Don't adopt new |

## Setup

```bash
bun add -d @playwright/test
bunx playwright install chromium
```

Copy [`templates/playwright/playwright.config.ts`](../templates/playwright/playwright.config.ts).

## Example

```typescript
import { test, expect } from '@playwright/test'

test.describe('critical flows', () => {
  test('signup → first managed database → credentials shown', async ({ page }) => {
    // 1. Signup
    await page.goto('/signup')
    await page.fill('[name=email]', `test-${Date.now()}@example.com`)
    await page.fill('[name=password]', 'StrongPassword123!')
    await page.click('button[type=submit]')

    // Playwright auto-waits for navigation
    await expect(page).toHaveURL('/console')

    // 2. Create a managed database
    await page.click('text=Databases')
    await page.click('text=New Database')
    await page.fill('[name=name]', 'test-db')
    await page.click('text=Create')

    // 3. Wait for provisioning (auto-wait on element)
    await expect(page.locator('text=Synced')).toBeVisible({ timeout: 120000 })

    // 4. Assert credentials are shown
    await expect(page.locator('[data-testid=connection-string]')).toContainText('postgresql://')
  })
})
```

## Gotchas

### 1. Don't use `setTimeout` or `page.waitForTimeout`
Playwright has AUTO-WAIT on every action. Hard sleeps make tests flaky:
```typescript
// ❌ Flaky
await page.click('button')
await page.waitForTimeout(2000)  // hope it's done
await expect(page.locator('.result')).toBeVisible()

// ✅ Auto-wait
await page.click('button')
await expect(page.locator('.result')).toBeVisible()  // waits up to timeout
```

### 2. Selectors tied to CSS
```typescript
// ❌ Breaks when CSS changes
await page.click('.btn.btn-primary.btn-large')

// ✅ Use test IDs or roles
await page.click('[data-testid=submit-button]')
await page.getByRole('button', { name: 'Submit' }).click()
```

### 3. Running E2E on every PR
Playwright tests take 30s–5min each. Running 20 of them per commit is
painful. Strategies:
- Run on push to main + nightly
- Shard across CI runners (`--shard 1/4`)
- Only run `@critical`-tagged tests on PR; full suite on main

### 4. Tests that depend on data from previous tests
```typescript
// ❌ Test 2 depends on test 1
test('create order', async ({ page }) => { /* creates orderId */ })
test('view order', async ({ page }) => { /* assumes orderId exists */ })

// ✅ Each test is hermetic — creates its own fixtures
```

### 5. Flaky network-dependent tests
Mock external APIs at the network layer:
```typescript
await page.route('**/api.stripe.com/**', (route) => {
  route.fulfill({ body: JSON.stringify({ id: 'ch_test' }) })
})
```

## CI integration

```yaml
- name: E2E tests (Chromium)
  run: bunx playwright test --shard=1/4
  timeout-minutes: 15

- name: Upload trace on failure
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-trace
    path: test-results/
```

**Playwright trace viewer** is magic: on failure, you get a time-travel
debugger showing every DOM snapshot, network request, and console log.

## Signal it produces

- **Test pass/fail** per browser
- **Screenshots + videos** on failure
- **Trace files** (interactive debugging)
- **Report HTML** with timing breakdown

## Graduation criteria

- [ ] Playwright config with Chromium + Firefox + WebKit
- [ ] Critical happy path covered
- [ ] Auth flow covered
- [ ] Tests use test IDs, not CSS selectors
- [ ] Zero flakes (< 1% retry rate)
- [ ] Trace uploaded on failure for debugging
- [ ] Sharded CI runs (parallel execution)

## Further reading

- [Playwright docs](https://playwright.dev)
- [Playwright best practices](https://playwright.dev/docs/best-practices)
- [Kent C. Dodds — Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
