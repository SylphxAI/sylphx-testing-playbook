# 16 — Snapshot / Golden Testing

> Freeze a known-good output to disk; compare future runs byte-for-byte.

**Category:** Situational
**Effort:** Low
**ROI:** High for generated output (manifests, API responses, rendered templates)
**Maturity level:** 2

## What it is

Run your function, capture the output, save it to a `*.snap` file ("golden"). Next run, compare against the golden. Any drift requires explicit approval.

## When to use

- **K8s manifest generators** (did my change affect the rendered YAML?)
- **API response schemas** (did I accidentally add a field?)
- **Code generators** / CLI output
- **Error message formatting**
- **Configuration file generators**

## When NOT to use

- Dynamic output (timestamps, IDs) — use property tests instead
- Huge outputs that you'll never read — use hash-only snapshots
- Inputs that change frequently — snapshots become maintenance burden

## Tools

| Tool | Status |
|---|---|
| **vitest snapshot** | 🟢 Built-in |
| **bun:test toMatchSnapshot** | 🟢 Built-in |
| **Jest snapshot** | 🟡 Mature |
| **approvaltests-node** | 🟢 For human-approved goldens |
| **jest-image-snapshot** | 🟢 For image diffs |

## Example

```typescript
import { test, expect } from 'vitest'
import { renderCnpgCluster } from './cnpg-template'

test('CNPG cluster manifest', () => {
  const manifest = renderCnpgCluster({
    name: 'pg-test',
    namespace: 'pg-test',
    instances: 3,
    storageGb: 50,
    // ... all other params
  })

  expect(manifest).toMatchSnapshot()
})
```

First run creates `__snapshots__/cnpg-template.test.ts.snap`. Subsequent runs compare.

On intentional change: `bun test --update-snapshots` regenerates.

## Gotchas

### 1. Snapshot reviewers vs rubber-stampers
If everyone just runs `--update` on every diff, snapshots become noise. Make snapshot diffs visible in PR review.

### 2. Huge snapshots
A 10,000-line YAML snapshot is unreviewable. Split into smaller focused snapshots.

### 3. Dynamic values in snapshots
```typescript
// ❌ Breaks every run
expect({ id: generateId(), timestamp: Date.now() }).toMatchSnapshot()

// ✅ Use serializers to replace dynamic values
expect.addSnapshotSerializer({
  test: (v) => typeof v === 'string' && v.startsWith('id-'),
  print: () => '"<redacted-id>"',
})
```

## CI integration

Snapshots run as part of normal test suite. On CI, a snapshot mismatch
fails the test (you must NEVER update snapshots in CI).

## Graduation criteria

- [ ] Generated output (manifests, templates) has snapshot coverage
- [ ] Snapshots reviewed in PR diffs
- [ ] Dynamic values replaced with serializers
- [ ] No "update snapshots" in CI — only local developer approval

## Further reading

- [vitest snapshot docs](https://vitest.dev/guide/snapshot.html)
- [Approval testing](https://approvaltests.com/)
