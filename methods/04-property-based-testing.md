# 04 — Property-Based Testing

> Instead of asserting on specific input/output pairs, assert on INVARIANTS that must hold for ALL inputs. The framework generates hundreds of random inputs and tries to break your invariant.

**Category:** Core
**Effort:** Medium
**ROI:** **Extreme** (catches bugs example-based tests will NEVER find)
**Maturity level it unlocks:** 2

---

## What it is

A property test describes a **universal truth** about your function:

> "For any two integers a and b, `add(a, b) === add(b, a)`"
>
> "For any string s, `decode(encode(s)) === s`"
>
> "For any backoff spec and retry count, `computeBackoffMs(n+1) >= computeBackoffMs(n)`"

The framework (fast-check) generates 100–1000 random inputs, runs your
property on each, and if ANY input breaks the invariant it:

1. Reports the failing input
2. **Shrinks** it — repeatedly simplifies the input while the property
   still fails, until you have the **minimal counterexample**

That shrinking step is magic. You'll discover edge cases you'd never think
to test manually: empty strings, Unicode surrogates, Infinity, NaN, dates
at epoch boundaries, integer overflows.

## Why it catches bugs nothing else does

Example-based tests only cover the inputs YOU imagined. Property tests
cover inputs you NEVER imagined. Classic finds:

- Off-by-one errors at boundary conditions
- Unicode bugs (surrogate pairs, ZWJ, RTL)
- Integer overflow / underflow
- Empty collection handling
- `null` / `undefined` propagation through composed functions
- Sort stability issues
- Round-trip failures (encode → decode → ≠ original)
- Monotonicity violations
- Commutativity / associativity violations

Real case from our codebase: our
[`maskConnectionString` function](../case-studies/sylphx-managed-resource-controller.md#connection-string-property-test)
passed every example test we wrote. Then fast-check generated a password
that happened to be "po" — and the masked URL `postgres://...` still
contained "po" (because "postgres" starts with "po"). We'd have never
thought of that.

## When to use

**High ROI** for:
- Pure functions with clear invariants (parsers, formatters, encoders)
- Algorithmic code (sorting, searching, graph algorithms)
- State machines with precondition/postcondition relationships
- Anywhere you have a round-trip (serialize / deserialize)
- Anywhere you have a known mathematical property (associativity,
  commutativity, idempotence, monotonicity)

**Medium ROI** for:
- Business logic with implicit invariants ("total is never negative",
  "retry count never decreases")

**Low ROI** for:
- Pure I/O code (integration tests are better)
- Code with no clear invariants

## When NOT to use

- **When you don't know what the invariant is** — don't force it. Write
  example tests until you spot the pattern.
- **When input generation is expensive** — if generating a valid input
  requires 500ms, your property test will be slow
- **When the function is non-deterministic** (uses Date.now, Math.random
  without injection) — fix the function first

## Tools

| Tool | Language | Status | Best for |
|---|---|---|---|
| **fast-check** | TS/JS | 🟢 SOTA | The universal choice for TS |
| **Hypothesis** | Python | 🟢 SOTA | Python's version of fast-check |
| **ScalaCheck** | Scala | 🟢 SOTA | The original QuickCheck descendant |
| **Proptest** | Rust | 🟢 SOTA | Rust equivalent |
| **jsverify** | JS | 🔴 Unmaintained | Don't adopt new |

## Setup

```bash
bun add -d fast-check
```

Copy the template from
[`templates/fast-check/example.test.ts`](../templates/fast-check/example.test.ts).

## Example

A simple invariant — sort is idempotent:

```typescript
import { test } from 'vitest'
import * as fc from 'fast-check'

test('property: sort is idempotent', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (arr) => {
      const once = [...arr].sort()
      const twice = [...once].sort()
      return JSON.stringify(once) === JSON.stringify(twice)
    }),
    { numRuns: 500 }  // 500 random arrays
  )
})
```

A harder invariant from our real code — exponential backoff is monotonic:

```typescript
test('property: backoff is monotonic non-decreasing', () => {
  fc.assert(
    fc.property(
      reasonableSpec,
      fc.integer({ min: 0, max: 50 }),
      (spec, n) => {
        const a = computeBackoffMs(n, spec)
        const b = computeBackoffMs(n + 1, spec)
        return b >= a  // next retry wait >= previous
      }
    ),
    { numRuns: 200 }
  )
})
```

Round-trip invariant — parse(build(x)) === x:

```typescript
test('property: buildPgUrl → parseConnectionString roundtrip', () => {
  fc.assert(
    fc.property(
      identifier, password, hostname, port, database,
      (user, pass, host, p, db) => {
        const url = buildPgUrl({ user, password: pass }, { host, port: p, database: db })
        const parsed = parseConnectionString(url)
        if (!parsed) return false
        return (
          parsed.user === user &&
          parsed.host === host &&
          parsed.port === p &&
          parsed.database === db
        )
      }
    ),
    { numRuns: 300 }
  )
})
```

## Gotchas

### 1. Biased arbitraries
```typescript
// ❌ Only tests small strings
fc.string({ minLength: 1, maxLength: 10 })

// ✅ Covers empty, short, long, Unicode
fc.string()
```

Default fast-check arbitraries cover good distributions. Don't constrain
unless you have a reason.

### 2. Non-deterministic properties
```typescript
// ❌ Uses wall clock — flaky
fc.property(spec, (spec) => {
  return computeBackoffMs(spec) <= Date.now() + 30000
})

// ✅ Inject the clock
fc.property(spec, clockValue, (spec, now) => {
  return computeBackoffMs(spec, { now: () => now }) <= now + 30000
})
```

### 3. Property too permissive
```typescript
// ❌ Always true, catches nothing
fc.property(fc.integer(), (n) => {
  return typeof add(n, 1) === 'number'
})

// ✅ Asserts actual behaviour
fc.property(fc.integer(), (n) => {
  return add(n, 1) === n + 1
})
```

### 4. Not using shrinking output
When a property fails, fast-check prints the SHRUNK counterexample:
```
Counterexample: [42, "hello"]
Shrunk 17 times
```
Look at those 17 shrink steps in verbose mode — they teach you the
minimal failure case, which often reveals the bug class immediately.

### 5. Forgetting edge cases outside the arbitrary
fast-check generates `Infinity`, `NaN`, `-0`, and empty arrays by default.
If your property assumes non-empty arrays, use `fc.array({ minLength: 1 })`.

## CI integration

```yaml
- name: Property tests
  run: bun test src/**/*.property.test.ts
  timeout-minutes: 2
```

Typical runtime: 100 test cases runs 500 properties in 1–2 seconds. Don't
set `numRuns` above 1000 unless you're chasing a specific edge case — the
return on each additional run decays fast.

## Signal it produces

- **Counterexample + shrink count** on failure
- **Seed** for reproducible replay: `{ seed: 1234567 }` — save failing
  seeds in a regression test

```typescript
// Reproduce a specific failure deterministically
fc.assert(fc.property(...), { seed: 1234567, path: '42:3:0', endOnFailure: true })
```

## Graduation criteria

- [ ] Every pure function with a clear invariant has at least one property test
- [ ] Failing properties are converted to example tests (regression
  prevention) AND kept as property tests
- [ ] Property tests run as part of the regular test command (not a separate
  "slow" tier)
- [ ] You've shipped a fix to at least one real bug that ONLY the property
  test could find

## Further reading

- [fast-check docs](https://fast-check.dev)
- [John Hughes — "Testing the Hard Stuff and Staying Sane"](https://www.youtube.com/watch?v=zi0rHwfiX1Q)
- [Scott Wlaschin — Property-Based Testing (F# examples, universal lessons)](https://fsharpforfunandprofit.com/series/property-based-testing/)
- [Our case study — 28 properties across 3 files](../case-studies/sylphx-managed-resource-controller.md#property-tests)
