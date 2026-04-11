# 23 — Metamorphic Testing

> When there's no "correct answer" oracle, test RELATIONS between input/output pairs instead.

**Category:** Frontier
**Effort:** Medium
**ROI:** High for ML / compilers / optimizers
**Maturity level:** 3–4

## What it catches

Bugs in non-deterministic or unknown-oracle systems — ML models, query optimizers, code compilers. You don't know what the "right" answer is, but you know how outputs should RELATE when inputs change.

## How it works

Examples:

```typescript
// ML classifier
test('metamorphic: small noise shouldn't flip prediction', () => {
  const img = loadImage('cat.jpg')
  const noisy = addPixelNoise(img, 0.01)
  expect(classify(img)).toBe(classify(noisy))
})

// Compiler
test('metamorphic: dead code elimination preserves output', () => {
  const source = 'const x = 1; const y = 2 + x; return y;'
  const withDead = source + '\nconst unused = 999;'
  expect(compile(source)).toBe(compile(withDead))
})

// Sort
test('metamorphic: sort is idempotent', () => {
  fc.assert(fc.property(fc.array(fc.integer()), (a) => {
    return JSON.stringify(sort(sort(a))) === JSON.stringify(sort(a))
  }))
})
```

## When to use

- **ML models** — prediction stability under noise
- **Compilers** — semantic-preserving transformations
- **Query optimizers** — `SELECT a, b FROM t` = `SELECT b, a FROM t` (reordered)
- **Numerical code** — `f(a * x) = a * f(x)` for linear functions

## Further reading

- ["Metamorphic Testing: A Review" (2018)](https://arxiv.org/abs/1805.02762)
