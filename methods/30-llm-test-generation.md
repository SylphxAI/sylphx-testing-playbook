# 30 — LLM-Assisted Test Generation

> AI generates test cases from your code. Frontier method; quality varies.

**Category:** Frontier
**Effort:** Low to use, medium to curate
**ROI:** Situational
**Maturity level:** 4

## What it catches

Coverage gaps where you didn't think to write a test. The LLM reads your code and generates tests that cover untested branches.

## Tools

| Tool | Type |
|---|---|
| **Qodo (Codium)** | 🟢 LLM-native test gen for TS/JS/Python |
| **Mutahunter** | 🟢 LLM + mutation testing, generates tests to kill survivors |
| **GitHub Copilot** | 🟢 Inline test suggestions |
| **Claude / GPT-5** | 🟢 Chat-based test writing |

## Workflow

1. LLM reads your function
2. LLM generates test file
3. **Human reviews** — LLMs hallucinate; assertions may be wrong
4. Run the generated tests
5. Verify they catch real bugs (not just happy path)

## Gotchas

- **Hallucinated assertions** — LLM asserts what it THINKS the function returns, not what it actually returns
- **Shallow tests** — LLMs write happy-path-only tests without edge cases
- **Coverage chasing without quality** — 100% coverage from LLM tests might be 30% mutation score

## When to use

- **As a starting point** for test skeletons
- **To fill coverage gaps** in legacy code
- **Combined with mutation testing** — Mutahunter workflow: find a survived mutant, ask LLM to write a test that kills it

## When NOT to use

- As the ONLY test source — always review + augment
- For security-critical code — human judgment required

## Further reading

- [Qodo (formerly Codium AI)](https://www.qodo.ai/)
- [Mutahunter](https://github.com/codeintegrity-ai/mutahunter)
