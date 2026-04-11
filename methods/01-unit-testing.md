# 01 — Unit Testing

> Test a function in isolation by calling it with known inputs and asserting on outputs.

**Category:** Core
**Effort:** Low
**ROI:** Medium (high floor, diminishing returns)
**Maturity level it unlocks:** 1

---

## What it is

A unit test calls ONE function (or ONE class method) with fixed inputs and
asserts the output matches expected values. No network, no DB, no file
system — just the function under test and its dependencies injected as
stubs or mocks.

## Why it catches bugs nothing else does

Unit tests are the FASTEST feedback loop. A good unit test suite runs in
< 5 seconds and catches logic errors the instant you type them. No other
method is that fast.

They also produce the most **localised** error messages — when a unit test
fails, you know exactly which function is broken. Integration tests can
fail for many reasons; unit tests only fail for one.

## When to use

- Pure functions (math, parsers, formatters, string manipulation)
- State reducers (Redux-style, signal computations)
- Domain logic that doesn't depend on I/O
- Anywhere you can isolate a function without extensive setup

## When NOT to use

- **Thin wrappers around I/O** — use integration tests instead
- **Pure glue code** (e.g. a function that just calls 3 other functions
  in order) — testing the wiring adds little value; the composed behaviour
  is what matters
- **Code dominated by external state** — mocking everything produces tests
  that break on refactors without catching bugs

## Tools

| Tool | Language | Status | Best for |
|---|---|---|---|
| **vitest** | TS | 🟢 SOTA | Most TS projects, fast, watch mode |
| **bun:test** | TS | 🟢 SOTA | Bun projects, zero config |
| **Jest** | TS/JS | 🟡 Mature | Legacy codebases, large ecosystem |
| **node:test** | JS/TS | 🟢 Zero deps | Node-native, no framework |
| **Mocha + Chai** | JS | 🔴 Legacy | Don't adopt new |

## Setup

```bash
# Vitest (recommended for most TS projects)
bun add -d vitest

# Or Bun native (if you're all-in on Bun)
# bun:test is built-in, no install needed
```

**vitest config** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: { lines: 80, functions: 80 }
    }
  }
})
```

## Example

A simple pure function with meaningful tests:

```typescript
// src/money.ts
export function addCents(a: number, b: number): number {
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    throw new Error('addCents requires integer cents')
  }
  return a + b
}

// src/money.test.ts
import { describe, test, expect } from 'vitest'
import { addCents } from './money'

describe('addCents', () => {
  test('adds two positive values', () => {
    expect(addCents(100, 250)).toBe(350)
  })

  test('adds negative values', () => {
    expect(addCents(500, -100)).toBe(400)
  })

  test('rejects non-integer inputs', () => {
    expect(() => addCents(1.5, 2)).toThrow('requires integer cents')
  })

  test('zero identity', () => {
    expect(addCents(0, 0)).toBe(0)
    expect(addCents(42, 0)).toBe(42)
  })
})
```

## Gotchas

### 1. Tests that don't assert
```typescript
// ❌ Useless — no assertion, passes even if the function crashes
test('it works', () => {
  processOrder({ items: [] })
})

// ✅ Good
test('empty order has total 0', () => {
  expect(processOrder({ items: [] }).total).toBe(0)
})
```

### 2. Testing implementation, not behaviour
```typescript
// ❌ Brittle — breaks on refactor even if behaviour is correct
test('uses reduce internally', () => {
  expect(Array.prototype.reduce).toHaveBeenCalled()
})

// ✅ Resilient — tests observable behaviour
test('sums the values', () => {
  expect(sum([1, 2, 3])).toBe(6)
})
```

### 3. Over-mocking
```typescript
// ❌ Mocks everything — tests nothing real
vi.mock('./math', () => ({
  add: vi.fn().mockReturnValue(42)
}))
test('add returns 42', () => {
  expect(add(1, 2)).toBe(42)  // ← you're just testing the mock
})

// ✅ Don't mock pure functions
```

### 4. Shared state between tests
```typescript
// ❌ Order-dependent
let counter = 0
test('increments', () => { counter++; expect(counter).toBe(1) })
test('starts at 0', () => { expect(counter).toBe(0) }) // fails if run second

// ✅ Isolated
test('increments', () => {
  let counter = 0
  counter++
  expect(counter).toBe(1)
})
```

## CI integration

```yaml
- name: Unit tests
  run: bun test src/**/*.test.ts
  timeout-minutes: 5
```

Typical runtime: **500–5000 tests run in < 10 seconds** with proper
isolation. If your unit tests run slower than 1ms each on average, they're
not unit tests — they're integration tests in disguise.

## Signal it produces

- **Line coverage** (`v8` / `istanbul` report)
- **Test count + pass/fail ratio**
- **Duration distribution** (watch for slow tests that shouldn't be unit)

Don't chase 100% line coverage blindly — see
[06-mutation-testing](06-mutation-testing.md) for a better quality metric.

## Graduation criteria

- [ ] Every pure function has at least 3 tests: happy path, edge case, error
- [ ] Unit tests run in < 10 seconds total
- [ ] Zero flakes — no `.skip` / `.retry` / timing-dependent assertions
- [ ] Line coverage > 80% on pure modules
- [ ] Tests co-located with source (`foo.ts` → `foo.test.ts` in the same
  directory)

## Further reading

- [vitest docs](https://vitest.dev)
- [Testing Trophy by Kent C. Dodds](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [Our case study — unit testing the backoff module](../case-studies/sylphx-managed-resource-controller.md#unit-tests)
