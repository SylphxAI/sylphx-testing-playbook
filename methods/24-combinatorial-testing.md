# 24 — Combinatorial (Pairwise) Testing

> Instead of testing 5^10 = 9.7M parameter combinations, test every PAIR of parameter values at least once (~25 tests). Catches ~90% of defects.

**Category:** Situational
**Effort:** Low
**ROI:** High for config matrices
**Maturity level:** 2

## What it catches

Defects in systems with many orthogonal configuration flags. Studies show most defects involve the interaction of 1-2 parameters — not 6 simultaneously.

## How it works

Research (NIST): when testing a system with N parameters, covering all PAIRS of parameter values catches ~90% of defects. Covering all TRIPLES catches ~95%. Full combinatorial coverage catches 100% but costs N^P test cases.

## Tools

- **PICT** (Microsoft) — `pict` CLI, generates minimal pairwise test cases
- **all-pairs-test-cases** (npm)
- **fast-check** `fc.pairwise()` — experimental

## Example

For a system with 5 parameters each with 3 values:
- Full: 3^5 = 243 tests
- Pairwise: ~15 tests
- Same ~90% defect detection

```
$ pict config.txt
db_engine  replicas  backup  pitr  ha
cnpg       1         yes     yes   no
cnpg       3         no      no    yes
self-host  1         no      yes   yes
...15 rows total
```

## Further reading

- [NIST combinatorial testing](https://csrc.nist.gov/projects/automated-combinatorial-testing-for-software)
- [Microsoft PICT](https://github.com/microsoft/pict)
