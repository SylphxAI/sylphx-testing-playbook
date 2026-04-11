# Sylphx Testing Playbook

> **A taxonomy of 35 SOTA software testing methods for 2027, with templates, decision guides, and a real-world case study.**

Testing is not one thing. "Write unit tests" is career advice from 2010. In
2027, a production-grade system uses a **portfolio** of 10–15 distinct testing
methods, each catching a different class of defect. This playbook is the index.

**Who this is for:**
- Engineers asking "what else should I be testing?"
- Tech leads setting up a new project's quality bar
- SREs / platform teams designing reliability targets
- Anyone trying to justify a testing budget with evidence

**What's inside:**
- [35 testing methods](#the-35-methods), categorised and ranked by leverage
- [Maturity matrix](matrix/maturity-model.md) — crawl / walk / run / fly
- [Selection guide](matrix/selection-guide.md) — which methods to adopt first
- [Copy-paste templates](templates/) for the top 12 tools
- [Real case study](case-studies/sylphx-managed-resource-controller.md) —
  how we took a codebase from 320 to 521 tests + 82.6% mutation score across
  3 phases of refactor

---

## TL;DR — what "SOTA testing in 2027" actually means

If you're time-starved, adopt these **10 methods** in order. Each one catches
defects that the previous ones miss:

| # | Method | Catches | Tool |
|---|---|---|---|
| 1 | [Unit testing](methods/01-unit-testing.md) | Logic bugs in pure functions | vitest / bun:test |
| 2 | [Type-level testing](methods/02-type-level-testing.md) | API contract drift at compile time | tsd / expect-type |
| 3 | [Integration testing](methods/03-integration-testing.md) | Cross-module wiring bugs | vitest + mocks |
| 4 | [Property-based testing](methods/04-property-based-testing.md) | Edge cases you didn't imagine | fast-check |
| 5 | [Contract testing](methods/05-contract-testing.md) | Runtime data corruption at boundaries | Zod |
| 6 | [Mutation testing](methods/06-mutation-testing.md) | Tests that exist but don't assert | Stryker |
| 7 | [E2E browser testing](methods/07-e2e-testing.md) | UI regressions | Playwright |
| 8 | [Load testing](methods/08-load-testing.md) | Performance under real traffic | k6 |
| 9 | [Chaos engineering](methods/09-chaos-engineering.md) | Failure mode bugs | Chaos Mesh |
| 10 | [SAST / security](methods/10-sast-security.md) | Injection, taint, secret leaks | Semgrep / CodeQL |

**Running these 10 in CI puts you above 95% of production codebases.** The
remaining 25 methods in this playbook are specialised power tools for when
your requirements exceed the baseline.

---

## The 35 methods

Ranked by **production leverage × implementation effort**. The top rows are
"must have for any serious project"; the bottom rows are "only for domains
that need them."

### ✅ Core (must have)

| # | Method | What it catches | See |
|---|---|---|---|
| 1 | Unit testing | Logic bugs in pure functions | [methods/01](methods/01-unit-testing.md) |
| 2 | Type-level testing | Type contract drift | [methods/02](methods/02-type-level-testing.md) |
| 3 | Integration testing | Wiring bugs between modules | [methods/03](methods/03-integration-testing.md) |
| 4 | Property-based testing | Edge cases from random inputs | [methods/04](methods/04-property-based-testing.md) |
| 5 | Contract testing (Zod) | Runtime data corruption at boundaries | [methods/05](methods/05-contract-testing.md) |
| 6 | Mutation testing | "Tests that exist but don't assert" | [methods/06](methods/06-mutation-testing.md) |

### 🔥 Critical for user-facing products

| # | Method | What it catches | See |
|---|---|---|---|
| 7 | E2E browser testing | UI regressions, cross-browser | [methods/07](methods/07-e2e-testing.md) |
| 17 | Visual regression | Pixel-level CSS drift | [methods/17](methods/17-visual-regression.md) |
| 18 | Accessibility testing | WCAG violations | [methods/18](methods/18-accessibility-testing.md) |

### 🛡️ Critical for production reliability

| # | Method | What it catches | See |
|---|---|---|---|
| 8 | Load / stress testing | Performance under scale | [methods/08](methods/08-load-testing.md) |
| 9 | Chaos engineering | Failure mode bugs | [methods/09](methods/09-chaos-engineering.md) |
| 11 | Canary SLO gates | Regressions during rollout | [methods/11](methods/11-canary-slo-gates.md) |
| 19 | Synthetic monitoring | Production-only bugs | [methods/19](methods/19-synthetic-monitoring.md) |
| 26 | Fault injection | Retry + timeout logic | [methods/26](methods/26-fault-injection.md) |

### 🔐 Critical for security + compliance

| # | Method | What it catches | See |
|---|---|---|---|
| 10 | SAST (Semgrep / CodeQL) | Injection, taint, secret leaks | [methods/10](methods/10-sast-security.md) |
| 12 | Dependency / supply chain | Malicious packages, CVEs | [methods/12](methods/12-dependency-security.md) |
| 20 | Fuzzing | Parser / deserializer crashes | [methods/20](methods/20-fuzzing.md) |

### 🗄️ Critical for data + infra

| # | Method | What it catches | See |
|---|---|---|---|
| 13 | In-memory DB integration | SQL semantic bugs fast | [methods/13](methods/13-in-memory-db.md) |
| 14 | testcontainers | Full-fidelity infra integration | [methods/14](methods/14-testcontainers.md) |
| 15 | Schema / migration testing | Destructive migrations | [methods/15](methods/15-migration-testing.md) |
| 16 | Snapshot / golden testing | Generated output drift | [methods/16](methods/16-snapshot-testing.md) |

### 🧠 High leverage for specialised domains

| # | Method | What it catches | See |
|---|---|---|---|
| 21 | Benchmark regression | Perf cliff drops | [methods/21](methods/21-benchmark-regression.md) |
| 22 | Differential testing | Migration behaviour drift | [methods/22](methods/22-differential-testing.md) |
| 23 | Metamorphic testing | ML models / compilers | [methods/23](methods/23-metamorphic-testing.md) |
| 24 | Combinatorial (pairwise) | Config matrix explosion | [methods/24](methods/24-combinatorial-testing.md) |
| 25 | Record-and-replay | Real traffic drift | [methods/25](methods/25-record-replay.md) |
| 27 | Coverage-guided fuzzing | Deep parser bugs | [methods/27](methods/27-coverage-guided-fuzzing.md) |

### 🎯 Frontier / specialist

| # | Method | What it catches | See |
|---|---|---|---|
| 28 | Formal verification (TLA+) | Concurrency race conditions | [methods/28](methods/28-formal-verification.md) |
| 29 | Concolic / symbolic execution | Paths no test can reach | [methods/29](methods/29-concolic-execution.md) |
| 30 | LLM-assisted test generation | Coverage of forgotten cases | [methods/30](methods/30-llm-test-generation.md) |

### 🟡 Situational

| # | Method | Notes | See |
|---|---|---|---|
| 31 | Approval testing | For complex human-reviewed output | [methods/31](methods/31-approval-testing.md) |
| 32 | BDD / Gherkin acceptance | Stakeholder communication, not test quality | [methods/32](methods/32-bdd-acceptance.md) |
| 33 | Smoke testing | Cheap last-resort canary | [methods/33](methods/33-smoke-testing.md) |
| 34 | Penetration testing (manual) | Compliance requirement | [methods/34](methods/34-penetration-testing.md) |
| 35 | Accessibility manual audits | Beyond axe-core automation | [methods/35](methods/35-manual-a11y-audit.md) |

---

## Quick-start — set up 5 methods in one afternoon

Start with these five and you'll have a better test suite than 80% of
production TypeScript codebases:

```bash
# 1. Unit + integration (already have it if you use vitest / bun:test)

# 2. Type-level tests
bun add -d expect-type

# 3. Property-based tests
bun add -d fast-check

# 4. Contract testing (Zod)
bun add zod

# 5. Mutation testing
bun add -d @stryker-mutator/core
```

Then copy our [template configs](templates/) into your project:

- [`templates/stryker/stryker.conf.json`](templates/stryker/stryker.conf.json)
- [`templates/fast-check/example.test.ts`](templates/fast-check/example.test.ts)
- [`templates/expect-type/example.types.test.ts`](templates/expect-type/example.types.test.ts)
- [`templates/github-actions/ci.yml`](templates/github-actions/ci.yml)

---

## How we picked these 35

Every method in this playbook has been validated on at least one production
codebase. We're not listing hypotheticals — every entry links to either:

1. **A real commit** in [`case-studies/`](case-studies/) showing adoption
2. **A working template** in [`templates/`](templates/) you can copy
3. **A tool with >1000 GitHub stars** actively maintained in 2026+

See the [case study](case-studies/sylphx-managed-resource-controller.md) for
the full evolution of a managed-resource controller from 320 tests + no
mutation testing to 521 tests + 82.6% mutation score in three refactor
phases (P5 → P6 → P7).

---

## Principles

The playbook encodes these beliefs, drawn from shipping real systems:

### 1. Code coverage is the **minimum** bar, not the goal

100% line coverage with weak assertions is worse than 60% coverage with
strong assertions. **Mutation score** is the truer signal — see
[methods/06](methods/06-mutation-testing.md).

### 2. Tests catching the same bugs are wasted tests

Each testing method in this playbook catches a **distinct class of bug**:
- Unit tests catch logic errors
- Type tests catch API drift
- Property tests catch unimagined edge cases
- Mutation tests catch weak assertions
- Contract tests catch runtime data corruption
- Fuzzing catches parser crashes
- Load tests catch perf regressions
- Chaos catches failure mode bugs
- SAST catches security injection

Having 10,000 unit tests ≠ having 1,000 unit tests + 100 property tests +
50 contract tests. The latter catches more bug classes.

### 3. Tests are infrastructure, not documentation

Tests should be:
- **Fast** (ms per test, <30s total for the "inner loop")
- **Deterministic** (no flakes, no ordering dependency)
- **Isolated** (no shared global state, no `mock.module` pollution)
- **Parallel-safe** (run with `-j 8` without issue)

If your tests don't meet these bars, fix the infrastructure before adding
more tests. See [methods/03 § gotchas](methods/03-integration-testing.md#gotchas).

### 4. The test pyramid is outdated — use the trophy

Old thinking: 70% unit, 20% integration, 10% E2E.
New thinking (Kent C. Dodds' Testing Trophy):
- 🏆 **Static** (types, lint) — fast, runs on save
- 🥇 **Integration** — the actual sweet spot
- 🥈 **Unit** — for pure functions only
- 🥉 **E2E** — for critical user paths

Most of our tests are **integration** — they exercise real module wiring
against mock I/O boundaries. Pure unit tests are reserved for genuinely
pure functions (math, parsers, formatters).

### 5. Every test must be able to answer "what bug would this catch?"

If you can't answer that, delete the test. It's load-bearing noise.

---

## Repository structure

```
sylphx-testing-playbook/
├── README.md                    ← you are here
├── methods/                     ← one markdown per testing method
│   ├── 01-unit-testing.md
│   ├── 02-type-level-testing.md
│   └── ...
├── matrix/
│   ├── maturity-model.md        ← crawl / walk / run / fly thresholds
│   └── selection-guide.md       ← decision tree: which method next?
├── templates/                   ← copy-paste config starters
│   ├── stryker/
│   ├── playwright/
│   ├── k6/
│   └── ...
├── case-studies/
│   └── sylphx-managed-resource-controller.md
├── languages/                   ← language-specific notes
│   ├── typescript.md
│   ├── python.md
│   ├── go.md
│   └── rust.md
└── .github/workflows/
    └── ci.yml                   ← link check + markdown lint
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). TL;DR:
- Add new methods as `methods/NN-name.md` following the [template](methods/TEMPLATE.md)
- Every method needs a working example in `templates/`
- Every claim needs either a commit link or a tool with >1000 stars
- Keep it opinionated — the value is in the recommendations, not the neutrality

---

## License

MIT. Fork it, adapt it, reference it from your org's engineering handbook.

---

## Acknowledgements

Born out of the Sylphx managed-resource controller refactor (Phase 5 → 7,
2026 Q2). Inspired by:

- Kent C. Dodds — [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- Martin Fowler — [Integration vs Unit distinction](https://martinfowler.com/bliki/IntegrationTest.html)
- Google SRE — [SLO / error budget doctrine](https://sre.google/)
- Netflix — [Chaos engineering canon](https://principlesofchaos.org/)
- Stripe — [Contract testing at scale](https://stripe.com/blog/online-migrations)
- AWS — [TLA+ in cloud infrastructure](https://lamport.azurewebsites.net/tla/formal-methods-amazon.pdf)
