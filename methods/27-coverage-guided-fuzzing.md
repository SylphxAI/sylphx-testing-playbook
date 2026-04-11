# 27 — Coverage-Guided Fuzzing

> Fuzzing where the fuzzer uses COVERAGE FEEDBACK to mutate inputs toward unexplored code paths. Finds deep bugs standard fuzzing misses.

**Category:** Frontier
**Effort:** High
**ROI:** Extreme for parsers + decoders
**Maturity level:** 4

## What it catches

Parser bugs, format confusion, deep corner cases in state machines. The fuzzer learns which input mutations reach new code paths and focuses there.

## Difference from basic fuzzing

Basic fuzzing (method 20) generates random inputs. Coverage-guided fuzzing INSTRUMENTS your code, watches which branches fire, and biases mutation toward inputs that trigger new coverage.

## Tools

| Tool | Language | Status |
|---|---|---|
| **Jazzer.js** (coverage mode) | JS/TS | 🟢 SOTA for Node |
| **AFL++** | Native | 🟢 OG, ultra-fast |
| **libFuzzer** | C/C++ | 🟢 LLVM built-in |
| **go-fuzz** | Go | 🟢 |

## Example (Jazzer.js)

```typescript
// fuzz/json-parser.fuzz.ts
export function fuzz(data: Buffer): void {
  const input = data.toString('utf-8')
  try {
    myJsonParser(input)
  } catch (e) {
    if (!(e instanceof SyntaxError)) throw e  // Non-syntax errors are bugs
  }
}
```

Jazzer instruments your code, tracks which branches fire on each input, and mutates toward unexplored branches.

## Output

After running for 1 hour:
- Crash inputs saved to `./crashes/`
- Each crash is a minimal reproducer
- Add them to your regression test corpus

## Further reading

- [Jazzer.js docs](https://github.com/CodeIntelligenceTesting/jazzer.js)
- [AFL++ docs](https://aflplus.plus/)
- [Google OSS-Fuzz results](https://google.github.io/oss-fuzz/)
