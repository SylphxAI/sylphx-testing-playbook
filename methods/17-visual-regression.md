# 17 — Visual Regression Testing

> Pixel-level comparison of UI screenshots across commits. Catches CSS drift that TypeScript can't.

**Category:** Critical for UI products
**Effort:** Medium
**ROI:** High for consumer-facing products
**Maturity level:** 3

## What it is

Every CI run takes screenshots of your UI components / pages. The service (Chromatic / Percy) compares against baseline. Any pixel difference is flagged for human review.

## Why it catches bugs nothing else does

Your tests pass. TypeScript compiles. Then a designer notices the primary button is now pink instead of blue — because some unrelated CSS change cascaded. Visual regression catches this before the designer does.

## Tools

| Tool | Status | Best for |
|---|---|---|
| **Chromatic** | 🟢 SOTA | Storybook-native, component-level |
| **Percy** (BrowserStack) | 🟢 Mature | Playwright/Cypress integration |
| **Playwright screenshot + pixelmatch** | 🟢 Self-hosted | Free, more setup |
| **Argos CI** | 🟢 SaaS alternative | Open source, simpler |
| **BackstopJS** | 🟡 Legacy | Don't adopt new |

## Setup (Chromatic + Storybook)

```bash
bun add -d @storybook/nextjs chromatic
```

```bash
bunx chromatic --project-token=$CHROMATIC_PROJECT_TOKEN
```

## Example

```typescript
// Button.stories.tsx
export const Primary = {
  args: { variant: 'primary', children: 'Click me' }
}
// Chromatic takes a screenshot of this story, compares across commits
```

## Gotchas

### 1. Flaky screenshots due to fonts / animations
Disable animations + web fonts in Chromatic mode:
```css
* { animation: none !important; }
```

### 2. Unreviewed snapshots
Someone must actually look at the diffs. Make Chromatic a required PR check.

### 3. Cross-browser differences
Chromatic only captures Chromium by default. Percy does multi-browser.

## Graduation criteria

- [ ] Storybook with all components as stories
- [ ] Chromatic/Percy integrated into CI
- [ ] Diffs are required reviews on PR
- [ ] Intentional UI changes are approved, not auto-accepted

## Further reading

- [Chromatic docs](https://www.chromatic.com/docs/)
- [Percy docs](https://www.browserstack.com/docs/percy)
