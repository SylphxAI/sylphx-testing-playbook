# 33 — Smoke Testing

> The smallest possible "does the system start?" test. Hit the root URL, check for 200.

**Category:** Situational (minimum bar)
**Effort:** Very low
**ROI:** Catches catastrophic deploy failures
**Maturity level:** 1

## What it catches

Complete deploy failures — the app doesn't start, DB isn't reachable, config is broken. Smoke tests answer one question: "Is ANYTHING working at all?"

## Example

```bash
# Shell smoke test
curl -fsS https://app.example.com/health || exit 1
```

```typescript
// Smoke test in Playwright
test('app boots', async ({ page }) => {
  const res = await page.goto('/')
  expect(res?.status()).toBe(200)
})
```

## When to use

- **After every deploy** — before traffic is routed
- **Minimum bar** for any system — "is it up?"
- **Last-resort canary** when you don't have SLO gates yet

## Difference from synthetic monitoring

- **Smoke** = binary (up/down), runs once after deploy
- **Synthetic monitoring** (method 19) = continuous, multiple geos, SLO tracking

Smoke is a prerequisite for synthetic. If your smoke test fails, no amount of sophisticated monitoring helps.

## Graduation criteria

- [ ] /health endpoint returns 200 if app boots
- [ ] Deploy pipeline runs smoke test before promoting
- [ ] Failed smoke = auto-rollback
