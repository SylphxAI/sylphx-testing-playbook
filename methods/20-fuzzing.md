# 20 — Fuzzing

> Bomb your functions with random / adversarial input until something crashes. Finds edge cases no one imagined.

**Category:** Critical for parsers + deserializers
**Effort:** Medium
**ROI:** High for security-sensitive code
**Maturity level:** 3

## What it is

A fuzzer generates millions of random inputs (bytes, strings, JSON, binary) and feeds them to your function. If ANY input causes a crash, infinite loop, or assertion failure — it's a bug.

Unlike property testing, fuzzing doesn't need you to specify invariants. It just asks "does this function crash?"

## Tools

| Tool | Language | Status | Best for |
|---|---|---|---|
| **Jazzer.js** | JS/TS | 🟢 SOTA | Coverage-guided fuzzing for Node |
| **@fast-check/fuzz** | JS/TS | 🟢 Integration | Uses fast-check arbitraries |
| **libFuzzer** | C/C++ | 🟢 OG | LLVM fuzzer, gold standard |
| **AFL++** | Native | 🟢 SOTA | American Fuzzy Lop, battle-tested |
| **go-fuzz** | Go | 🟢 Mature | Go's built-in fuzzing |
| **Hypothesis** | Python | 🟢 Via stateful | Property + fuzz hybrid |

## Example (Jazzer.js)

```typescript
// fuzz/parse-connection-string.fuzz.ts
import { parseConnectionString } from '../src/parseConnectionString'

export function fuzz(data: Buffer): void {
  const input = data.toString('utf-8')
  try {
    parseConnectionString(input)
  } catch (e) {
    // Parse errors are OK; crashes / infinite loops are not
    if (e instanceof RangeError || e instanceof TypeError) {
      throw e  // These ARE bugs
    }
  }
}
```

Run:
```bash
bunx jazzer fuzz/parse-connection-string.fuzz.ts
```

Jazzer mutates the corpus using coverage feedback until it finds a crash
or exhausts the time budget.

## Gotchas

### 1. Corpus management
Seed fuzzers with real valid inputs so they reach deeper code paths faster.

### 2. OOM / timeout kills
Set resource limits:
```bash
bunx jazzer fuzz/... -max_len=10000 -timeout=5
```

### 3. Flakes from non-determinism
`Date.now()`, `Math.random()` make fuzzing hard. Inject clocks / RNG.

## Graduation criteria

- [ ] Every parser / deserializer / URL-handler has a fuzz harness
- [ ] Corpus seeded with real inputs
- [ ] Nightly CI run, crashes create GitHub issues
- [ ] Any crash found → regression test added

## Further reading

- [Jazzer.js docs](https://github.com/CodeIntelligenceTesting/jazzer.js)
- [Google OSS-Fuzz](https://google.github.io/oss-fuzz/)
