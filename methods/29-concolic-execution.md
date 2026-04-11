# 29 — Concolic / Symbolic Execution

> SMT solver analyzes code paths and finds inputs that reach SPECIFIC branches.

**Category:** Frontier
**Effort:** Very High
**ROI:** Specialist
**Maturity level:** 4

## What it catches

Paths no existing test reaches. The tool reads your code, encodes branches as logical constraints, and asks an SMT solver: "find me an input that takes THIS branch."

## Tools

| Tool | Language | Status |
|---|---|---|
| **KLEE** | C/C++ | 🟢 Research-grade, LLVM |
| **SymCC** | C | 🟢 Newer alternative |
| **PEX** | C# | 🟡 Microsoft Research |
| **@microsoft/symbex-js** | JS | 🔴 Early prototype |

## Status for JS/TS

As of 2027: not production-ready. The JS ecosystem is too dynamic (types,
prototype chains, eval) for symbolic execution to fully analyze. Rust, C,
C++ have mature tooling.

## When to (theoretically) use

- Finding unreachable code paths that test suites miss
- Security — finding inputs that exploit specific vulnerability patterns
- Coverage-guided fuzzing often uses concolic execution under the hood

## Further reading

- [KLEE symbolic execution engine](https://klee.github.io/)
- ["Symbolic Execution for Software Testing" (Cadar et al.)](https://dl.acm.org/doi/10.1145/2408776.2408795)
