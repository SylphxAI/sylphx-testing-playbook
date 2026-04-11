# 22 — Differential Testing

> Run two implementations (old vs new, version A vs B) against the SAME inputs. Any output difference is a bug.

**Category:** Situational (refactor safety)
**Effort:** Medium
**ROI:** Extreme during big refactors
**Maturity level:** 3

## What it catches

Silent behaviour drift during refactors. When you're rewriting a function
for performance or clarity, differential testing PROVES the new version
is semantically identical to the old.

## How it works

```typescript
import * as fc from 'fast-check'
import { parseConnectionStringOld } from './legacy'
import { parseConnectionStringNew } from './refactored'

test('property: new parser matches old', () => {
  fc.assert(
    fc.property(fc.string(), (input) => {
      const a = safeParse(parseConnectionStringOld, input)
      const b = safeParse(parseConnectionStringNew, input)
      return JSON.stringify(a) === JSON.stringify(b)
    }),
    { numRuns: 10000 }
  )
})
```

If the two implementations agree on 10,000 random inputs, you can refactor
confidently.

## When to use

- **Big refactors** where you can't hand-write equivalence tests
- **Version upgrades** (library v1 vs v2)
- **Language/runtime migrations** (old Python impl vs new Rust impl)
- **Compiler optimizations** — compare `-O0` and `-O2` outputs

## Tools

- **fast-check** — generate inputs, write custom differential properties
- **Diffy** (Twitter OSS) — differential testing for HTTP services
- **Manual** — you write the comparison harness yourself

## Further reading

- [fast-check differential testing](https://fast-check.dev/docs/tutorials/detect-race-conditions/)
- [Twitter's Diffy](https://blog.x.com/engineering/en_us/a/2015/diffy-testing-services-without-writing-tests)
