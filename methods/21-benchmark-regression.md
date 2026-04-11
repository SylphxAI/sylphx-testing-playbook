# 21 — Benchmark Regression Testing

> Micro-benchmark hot paths; fail CI if performance drops by X%.

**Category:** Situational
**Effort:** Medium
**ROI:** High for libraries + latency-critical paths
**Maturity level:** 3

## What it is

Measure execution time of specific functions with sub-microsecond precision. Compare vs a baseline; fail if a regression exceeds threshold.

## Tools

| Tool | Language | Status |
|---|---|---|
| **mitata** | JS/TS | 🟢 SOTA (sub-ns precision) |
| **tinybench** | JS/TS | 🟢 Vitest integration |
| **benchmark.js** | JS | 🟡 Legacy |
| **hyperfine** | CLI | 🟢 Shell command benchmarks |
| **Bencher.dev** | SaaS | 🟢 Tracks over time |

## Example (mitata)

```typescript
import { bench, run } from 'mitata'
import { computeBackoffMs } from './backoff'

bench('computeBackoffMs', () => {
  computeBackoffMs(5, { baseMs: 30000, maxMs: 1800000 })
})

bench('JSON.stringify small object', () => {
  JSON.stringify({ a: 1, b: 'hello', c: [1, 2, 3] })
})

await run({
  avg: true,
  json: false,
  colors: true,
})
```

Output:
```
benchmark              time (avg)     (min … max)
-------------------------------------------------
computeBackoffMs       12.3 ns/iter  (11.8 … 14.2)
JSON.stringify small   185 ns/iter   (178 … 210)
```

## Regression gate

```bash
# Run, save baseline
bun run bench --json > baseline.json

# On next commit, compare
bun run bench --json > current.json
bun run compare-bench baseline.json current.json --threshold=10%
```

## Tools for CI integration

- **github-action-benchmark** — auto-comments PR with diff
- **Bencher.dev** — SaaS dashboard tracking across commits

## Graduation criteria

- [ ] Critical hot paths have benchmarks
- [ ] Baseline stored in repo
- [ ] 10% regression fails CI
- [ ] Benchmark history visible (Bencher.dev or custom dashboard)

## Further reading

- [mitata](https://github.com/evanwashere/mitata)
- [Bencher.dev](https://bencher.dev)
