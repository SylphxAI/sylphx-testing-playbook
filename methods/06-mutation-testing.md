# 06 — Mutation Testing

> Break your code in small ways and verify your tests catch each break. The ultimate test-quality metric.

**Category:** Core
**Effort:** Medium (setup is easy, improving score takes time)
**ROI:** **Extreme** — reveals useless tests you didn't know you had
**Maturity level it unlocks:** 2 → 3

---

## What it is

A mutation testing framework automates "what if I break this line of code?
Would any test fail?"

For every operator, literal, and conditional in your source code, it
generates a **mutant** — a tiny variant of your code with one thing changed:

```typescript
// Original
return age >= 18

// Mutant 1: boundary shift
return age > 18

// Mutant 2: always true
return true

// Mutant 3: always false
return false
```

For each mutant, the framework:
1. Applies the mutation to a copy of your source
2. Runs your entire test suite
3. Checks if any test fails

| Result | Meaning |
|---|---|
| 💀 **Killed** | A test failed → you caught the bug |
| 😱 **Survived** | All tests passed → the mutation is live and your tests are blind to it |
| ⏰ **Timeout** | Mutation caused an infinite loop |
| 🗺 **No coverage** | No test runs this line |

**Mutation score = killed / (killed + survived) × 100%**

## Why it catches bugs nothing else does

**Line coverage can lie. Mutation score cannot.**

```typescript
// 100% line coverage, 0% mutation score
function divide(a: number, b: number): number {
  if (b === 0) return 0
  return a / b
}

test('divide', () => {
  divide(10, 2)   // covers line 2 + 3
  divide(10, 0)   // covers line 1 + 2
  // 100% line coverage — but NO assertions!
})
```

The test above has 100% line coverage but doesn't assert anything. Mutation
testing will kill this "test" immediately: all mutants survive because
nothing is checked.

Real case from our codebase: we had 93% line coverage on `schemas.ts`
but only **52% mutation score**. Looking at the survived mutants revealed
we had no tests for `parseConfigByKind('kv', ...)` or
`parseConfigByKind('search', ...)` — only `'database'`. Adding those tests
lifted the score to 62%.

## Why it's the TRUE test quality metric

- Line coverage tells you "this line executed"
- Branch coverage tells you "both branches executed"
- **Mutation score tells you "if this code was wrong, your tests would notice"**

The third is what you actually want from tests.

## When to use

- **High ROI**: pure function modules, core business logic, libraries
- **Medium ROI**: service layer, business logic in a stateful app
- **Low ROI**: UI components, glue code, I/O-heavy modules

## When NOT to use

- **Flaky test suite** — mutation testing amplifies flakes (each mutant
  reruns all tests). Fix the flakes first.
- **Slow test suite** — mutation testing runs your full test suite hundreds
  of times. If your suite takes 10 minutes, mutation testing takes hours.
  Target: test suite < 30 seconds before adopting mutation testing.
- **Integration-test-only codebases** — mutation works best on pure code.
  Integration tests amplify runtime × mutant count.

## Tools

| Tool | Language | Status | Best for |
|---|---|---|---|
| **Stryker** | JS/TS, C#, Scala | 🟢 SOTA | JS/TS industry standard |
| **PITest** | Java | 🟢 SOTA | Java equivalent |
| **mutmut** | Python | 🟢 SOTA | Python equivalent |
| **Mutant** | Ruby | 🟢 SOTA | Ruby equivalent |
| **go-mutesting** | Go | 🟡 Maintained | Smaller Go community |

## Setup

```bash
bun add -d @stryker-mutator/core
```

Copy the template from
[`templates/stryker/stryker.conf.json`](../templates/stryker/stryker.conf.json).

Key configuration decisions:

```json
{
  "testRunner": "command",
  "commandRunner": {
    "command": "bun test path/to/specific/tests"
  },
  "mutate": [
    "src/core/**/*.ts",
    "!src/**/*.test.ts"
  ],
  "thresholds": {
    "high": 85,
    "low": 70,
    "break": 60
  },
  "concurrency": 4,
  "timeoutMS": 30000
}
```

- **`mutate`**: which files to mutate. Only include PURE modules — testing
  UI components / I/O code is slow and low-ROI
- **`thresholds.break`**: CI fails if score drops below this
- **`concurrency`**: parallel workers (roughly match CPU core count)

## Example

Run it once to see the baseline:

```bash
bun run test:mutation
```

Output:
```
File                  | Score  | # killed | # survived
controller/backoff.ts | 88.89% |     16   |      2
controller/errors.ts  | 72.55% |     37   |     14
resources/schemas.ts  | 52.00% |     48   |     45
All files             | 83.40% |    438   |     93

Final mutation score of 83.40 is greater than or equal to break threshold 60
```

Then open `mutation-report/index.html`:
- Browse by file
- Click a line to see survived mutants
- Each mutant shows: original code → mutated code → which tests ran
- Write a test to kill each survivor

## Gotchas

### 1. Equivalent mutants
Some mutants are functionally equivalent to the original — they CAN'T be
killed because they don't change behaviour:

```typescript
// Original
for (let i = 0; i < n; i++) { ... }

// "Mutant" — swap `<` for `<=` at the exit, but also change `i++` for `++i`
// These are often equivalent → surviving forever without being a real test hole
```

Stryker can't always detect equivalent mutants. Accept a small percentage
as unavoidable noise.

### 2. Over-aggressive timeout killing
Setting `timeoutMS` too low kills mutants as "timeout" even when they'd
otherwise survive. False positives. Start with the default (30s) and only
lower it if you have many mutants that actually hang.

### 3. Mutating untested code
```json
// ❌ Mutating an I/O wrapper with no unit tests — every mutant survives
"mutate": ["src/db/client.ts"]

// ✅ Only mutate code that has tests
"mutate": ["src/core/**/*.ts", "!src/core/db/**"]
```

If a mutant has `no coverage`, the file shouldn't be in `mutate` — it's
noise dragging down the score.

### 4. Running mutation testing on every PR
Don't. Stryker runs take 1–10 minutes. Run it:
- On push to main
- Nightly
- On-demand when someone's about to refactor a pure module

NOT on every commit to every feature branch.

### 5. Chasing 100%
Mutation score 100% is often unachievable (equivalent mutants, dead code
that's there for type purposes). **80% is excellent, 90% is world-class.**
Our managed-resource controller sits at 82.6% overall with 100% on the
most critical file (`effect-reconcile.ts`).

## CI integration

```yaml
- name: Mutation testing (nightly)
  run: bun run test:mutation
  if: github.event_name == 'schedule' || github.ref == 'refs/heads/main'
  timeout-minutes: 20
```

Typical runtime:
- **~500 mutants** on **~10 pure modules**: 1.5 minutes (with concurrency 4)
- **~3000 mutants** on a medium codebase: 10–15 minutes

## Signal it produces

- **Overall mutation score** (single number, 0–100%)
- **Per-file breakdown** — find the weakest module first
- **HTML report** with every survived mutant highlighted
- **Report trends over time** — score should only go UP

Compare to line coverage:

| Metric | Tells you |
|---|---|
| Line coverage 100% | "Every line ran at least once" (weak) |
| Branch coverage 100% | "Every branch taken" (weaker still) |
| Mutation score 85% | "85% of bugs injected here would fail a test" (strong) |

## Graduation criteria

- [ ] Stryker config checked in + CI job configured
- [ ] Mutation score on core modules ≥ 80%
- [ ] At least one critical module at 100%
- [ ] `thresholds.break` ≥ 60% enforcing quality
- [ ] You've shipped a test improvement prompted by mutation analysis
- [ ] HTML report bookmarked and used in code review

## Further reading

- [Stryker docs](https://stryker-mutator.io/)
- ["An Empirical Study of Mutation Testing" (1971)](https://www.cs.purdue.edu/homes/apm/foundationalMT.pdf) — the original paper
- [Google's mutation testing infrastructure](https://testing.googleblog.com/2018/07/mutation-testing.html)
- [Our case study — 82.62% with 100% on `effect-reconcile.ts`](../case-studies/sylphx-managed-resource-controller.md#mutation-testing)
