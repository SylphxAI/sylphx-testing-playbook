# NN — Method Name

> One-sentence description of what this method catches.

**Category:** Core / Critical / Situational / Frontier
**Effort:** Low / Medium / High
**ROI:** Low / Medium / High / Extreme
**Maturity level it unlocks:** 1 / 2 / 3 / 4

---

## What it is

2–3 sentence plain explanation. No jargon. What would a senior engineer tell
a junior in 30 seconds?

## Why it catches bugs nothing else does

The unique value proposition. What class of bug does only this method catch?
Be specific — if any other method on this list catches the same bugs, this
method is redundant.

## When to use

- Bullet list of use cases where ROI is high
- Specific code shapes that benefit most
- Project types where it's worth the effort

## When NOT to use

- Situations where the effort outweighs the ROI
- Alternative methods that catch the same bugs faster
- Red flags that you're adopting it for the wrong reason

## Tools

Ranked by production maturity in 2026–2027.

| Tool | Language | Status | Best for |
|---|---|---|---|
| Tool A | TS | 🟢 SOTA | Primary recommendation |
| Tool B | TS | 🟡 Mature | Alternative |
| Tool C | TS | 🔴 Legacy | Don't adopt new |

## Setup

```bash
bun add -d tool-a
```

Copy the template from [`templates/tool-a/`](../templates/tool-a/).

## Example

```typescript
// A complete working example — must actually run
import { ... } from 'tool-a'

// The example should demonstrate:
// 1. The bug class this method catches
// 2. A failing test case
// 3. The passing version after the fix
```

## Gotchas

Things that trip up first-time adopters. Each bullet should be specific
enough that someone hitting the problem can search for it.

- Gotcha 1 — explain
- Gotcha 2 — explain

## CI integration

```yaml
# .github/workflows/ci.yml snippet
- name: Run ${method}
  run: bun run test:${method}
```

Typical runtime: `XX seconds` for a `medium` project.

## Signal it produces

What metric / file / dashboard does this method produce? How do you know if
it's working?

## Graduation criteria

How do you know you've MASTERED this method and can move on?

- [ ] Criterion 1
- [ ] Criterion 2

## Further reading

- [Tool docs]()
- [Blog post from a company using it]()
- [Our case study](../case-studies/sylphx-managed-resource-controller.md#method-name)
