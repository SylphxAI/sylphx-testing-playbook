# 35 — Manual Accessibility Audit

> Screen reader walkthrough, keyboard-only navigation, real assistive tech users. Catches what axe-core can't.

**Category:** Situational (beyond automated a11y)
**Effort:** High
**ROI:** Complements automated a11y testing
**Maturity level:** 3

## Why manual is needed

Automated a11y tools (axe-core, Pa11y) catch ~30% of accessibility issues. The remaining 70% require human judgment:

- Whether an alt text is MEANINGFUL (not just present)
- Logical reading order in screen readers
- Whether focus management is intuitive
- Whether color conveys information (fails for color-blind users)
- Whether animations trigger vestibular disorders
- Whether dynamic content announces properly to screen readers

## How to do it

### 1. Keyboard-only navigation

Close your mouse. Try to complete every critical flow using only:
- `Tab` / `Shift+Tab` for focus
- `Enter` / `Space` for activation
- Arrow keys for menus / sliders

Notes any focus traps, missing focus indicators, or unreachable controls.

### 2. Screen reader walkthrough

- **macOS / iOS**: VoiceOver (Cmd+F5)
- **Windows**: NVDA (free) or JAWS (paid)
- **Android**: TalkBack
- **Linux**: Orca

Walk through the product with your eyes CLOSED. Note any place the narration is unclear or misleading.

### 3. Real user testing

The gold standard: hire accessibility consultants who are blind, low-vision, or motor-impaired to test your product. Their feedback catches issues no simulation matches.

## Cadence

- **Pre-launch**: full audit
- **Quarterly**: regression audit of critical flows
- **On major UI changes**: targeted re-audit

## Further reading

- [WebAIM — Screen Reader User Survey](https://webaim.org/projects/screenreadersurvey10/)
- [Smashing Magazine — Accessible UX](https://www.smashingmagazine.com/category/accessibility/)
