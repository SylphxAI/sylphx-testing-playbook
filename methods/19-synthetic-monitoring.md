# 19 — Synthetic Monitoring

> Periodic health checks from external vantage points that verify your system works END-TO-END in production.

**Category:** Critical for production
**Effort:** Low
**ROI:** High — catches outages before customers do
**Maturity level:** 3

## What it is

Automated scripts running every N minutes from external locations (not inside your network) that:
- Visit your public URLs
- Run critical user flows (signup, login, purchase)
- Probe your API endpoints
- Check DNS + TLS + HTTP response

Fails → page on-call.

## Tools

| Tool | Status | Best for |
|---|---|---|
| **Checkly** | 🟢 SOTA | TS-first, Playwright-based synthetics |
| **Datadog Synthetics** | 🟢 Enterprise | Part of DD stack |
| **Grafana k6 Cloud** | 🟢 Mature | k6-based |
| **Uptime Kuma** | 🟢 OSS | Self-hosted, simple |
| **New Relic Synthetics** | 🟢 Mature | NR ecosystem |
| **Pingdom** | 🟡 Legacy | Basic HTTP checks |

## Example (Checkly)

```typescript
// checkly/critical-flow.spec.ts
import { test, expect } from '@playwright/test'

test('critical: homepage loads and has signup button', async ({ page }) => {
  const response = await page.goto('https://app.example.com')
  expect(response?.status()).toBe(200)

  await expect(page.getByRole('button', { name: 'Sign up' })).toBeVisible()
})

// Checkly runs this every 5 min from US-East, EU-West, Asia-Pacific
```

## CI integration

Not CI — synthetic monitoring runs in PRODUCTION on a schedule:

```yaml
# checkly.config.ts
checks:
  - critical-flow:
      frequency: 5  # minutes
      locations: [us-east-1, eu-west-1, ap-southeast-1]
      alertChannels: [pagerduty-oncall]
```

## Graduation criteria

- [ ] At least 1 synthetic check per critical user flow
- [ ] Multiple geographic vantage points
- [ ] Failures page on-call within 10 min
- [ ] Results visible in a status page / dashboard

## Further reading

- [Checkly docs](https://www.checklyhq.com/docs/)
