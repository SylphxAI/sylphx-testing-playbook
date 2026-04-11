# 31 — Approval Testing

> Run your function, capture output, human approves once, subsequent runs compare.

**Category:** Situational
**Effort:** Low
**ROI:** High for complex human-reviewed output
**Maturity level:** 2

## What it catches

Drift in complex output (generated code, long JSON, visual diagrams, financial reports) where writing explicit assertions is tedious.

Similar to snapshot testing (method 16), but the emphasis is on HUMAN APPROVAL of the golden — not just auto-capture.

## Tools

- **approvaltests-node**
- **vitest snapshots** (with manual `-u` approval)
- **Jest inline snapshots**

## Example

```typescript
import { verify } from 'approvaltests-node'

test('generated invoice matches approved', () => {
  const invoice = generateInvoice({ items: [...] })
  verify(invoice)  // compares to `.approved.txt`
})
```

First run creates `.received.txt`. Human reviews, diffs against `.approved.txt`, approves → file is renamed. Subsequent runs compare byte-for-byte.

## When to use

- Generated code (transpiled output, compiler tests)
- Long formatted reports
- Email templates
- Generated YAML / JSON with complex structure

## Difference from snapshot testing

Approval testing emphasizes:
1. **Explicit human approval** — you never `-u` to auto-update
2. **Diff review workflow** — the diff is the PR comment
3. **Version control friendly** — `.approved.txt` is committed

## Further reading

- [ApprovalTests.com](https://approvaltests.com/)
- [Emily Bache — Approval Testing talks](https://www.youtube.com/@EmilyBache-tech-coach)
