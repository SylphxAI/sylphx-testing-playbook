# 18 — Accessibility (a11y) Testing

> Automated WCAG compliance scanning. Catches 30% of accessibility bugs; humans catch the other 70%.

**Category:** Critical for public-facing products
**Effort:** Low (automated) / High (manual)
**ROI:** High for public products + compliance
**Maturity level:** 3

## What it is

`axe-core` scans your rendered DOM for WCAG 2.1 / 2.2 violations:
- Missing alt text
- Insufficient color contrast
- Missing form labels
- Missing ARIA roles
- Keyboard focus traps
- Incorrect heading hierarchy

Automated scans catch ~30% of a11y issues. Manual audit (screen reader walkthrough, keyboard-only navigation) catches the rest.

## Tools

| Tool | Status | Best for |
|---|---|---|
| **axe-core** + `@axe-core/playwright` | 🟢 SOTA | Industry standard scanner |
| **Pa11y** | 🟢 CLI-friendly | Simple command-line |
| **Lighthouse CI** | 🟢 Mature | Google's tool, broader metrics |
| **Storybook a11y addon** | 🟢 Dev UX | Per-component inline checks |
| **Deque axe DevTools** | 🟢 Commercial | Deeper scans, manual audit aids |

## Setup

```bash
bun add -d @axe-core/playwright
```

## Example

```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('landing page has zero a11y violations', async ({ page }) => {
  await page.goto('/')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(results.violations).toEqual([])
})
```

## Gotchas

### 1. axe only catches 30%
Test with actual screen readers (NVDA on Windows, VoiceOver on macOS/iOS) for the remaining 70%.

### 2. Contrast failures on gradients
axe can't analyze text on gradient backgrounds accurately. Manual review required.

### 3. Dynamic content
Content loaded after JS execution may not be scanned. Wait for it:
```typescript
await page.waitForLoadState('networkidle')
const results = await new AxeBuilder({ page }).analyze()
```

## CI integration

```yaml
- name: A11y tests
  run: bunx playwright test tests/a11y.spec.ts
```

## Graduation criteria

- [ ] Every public page in E2E suite runs through axe
- [ ] Zero WCAG AA violations in CI
- [ ] Manual screen reader walkthrough quarterly
- [ ] Accessibility champion on the team

## Further reading

- [axe-core docs](https://github.com/dequelabs/axe-core)
- [WCAG 2.2 standard](https://www.w3.org/WAI/WCAG22/quickref/)
- [Deque University](https://dequeuniversity.com/)
