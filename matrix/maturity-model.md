# Testing Maturity Model

Four levels of testing maturity. Each level is a checkpoint — you shouldn't
skip ahead because each builds on the previous one's infrastructure.

---

## 🐣 Level 1 — Crawl

**Definition:** You have tests. They run. You trust the green checkmark.

### Requirements
- [ ] Unit tests for pure functions (any framework)
- [ ] Test runner integrated into `bun test` / `npm test` / CI
- [ ] Line coverage > 60%
- [ ] CI blocks merge on failing tests
- [ ] Deterministic — no `skip` / `retry` hacks

### Characteristic smells
- Manual QA catches bugs that tests missed
- "I'll add tests later" scattered through PR reviews
- Coverage ignored in code review
- `.skip()` and `.todo()` comments accumulating

### Graduation criterion
Your team can refactor with confidence that tests will catch regressions.
If people are scared to change code because "the tests might miss
something," you're not at Level 1 yet.

---

## 🚶 Level 2 — Walk

**Definition:** You have **multiple methods** catching different bug classes.
Tests are fast and feedback is sub-30-seconds.

### Requirements
- [ ] **Level 1 checkpoint passed**
- [ ] Type-level tests for all public APIs (`tsd` / `expect-type`)
- [ ] Integration tests for module wiring
- [ ] Contract testing at boundaries (Zod / JSON Schema)
- [ ] Snapshot testing for generated output
- [ ] Mutation score >= 60% on core modules (Stryker break threshold)
- [ ] Property tests for pure functions with obvious invariants
- [ ] E2E smoke test for the critical happy path
- [ ] CI runs in < 5 minutes
- [ ] Zero flaky tests — if a test fails once it fails every time

### Characteristic smells
- Tests feel like an afterthought in PRs
- No one looks at mutation score
- E2E tests are too slow so everyone skips them
- Test infrastructure is ad-hoc per repo

### Graduation criterion
A new engineer can contribute confidently on day 3. The tests teach them
the codebase.

---

## 🏃 Level 3 — Run

**Definition:** Tests catch **production bugs before they ship**. Quality is
an engineering metric with a numeric target.

### Requirements
- [ ] **Level 2 checkpoint passed**
- [ ] Mutation score >= **80%** on core modules (Stryker `high` threshold)
- [ ] Property tests for **every** pure function with invariants
- [ ] Load testing with SLO-based gates (k6 + CI)
- [ ] SAST in CI (Semgrep / CodeQL)
- [ ] Dependency / supply-chain security (Socket.dev / npm audit / cosign)
- [ ] E2E across all critical user flows (Playwright)
- [ ] Visual regression for the UI (Chromatic / Percy)
- [ ] Accessibility: axe-core in every E2E test
- [ ] Chaos engineering for infra services (Chaos Mesh / Litmus)
- [ ] Canary deploys with automated rollback (Flagger / Argo Rollouts)
- [ ] SLOs defined as code with alerting rules

### Characteristic smells
- Flaky Playwright tests because of timing
- Chaos experiments disabled because they page on-call
- Load tests run once then forgotten
- "We have tests but we don't trust them"

### Graduation criterion
Production incidents trace to bugs that **could not have been caught by any
existing test**. The tests work; the failure modes are novel.

---

## 🚀 Level 4 — Fly

**Definition:** Testing is a **research discipline** at your company. You're
shipping new methods, not just adopting them.

### Requirements
- [ ] **Level 3 checkpoint passed**
- [ ] Mutation score >= **90%** overall, **100%** on critical paths
- [ ] Fuzzing in CI for all parsers / deserializers (Jazzer.js / libFuzzer)
- [ ] Differential testing for refactors (old path vs new path parity)
- [ ] Metamorphic testing for stochastic / ML components
- [ ] Synthetic monitoring from multiple geos (Checkly / Datadog Synthetics)
- [ ] Record-and-replay for backward-compat validation
- [ ] Formal verification (TLA+ / Alloy) for critical state machines
- [ ] Combinatorial testing for config matrix coverage
- [ ] LLM-assisted test generation integrated into PR flow
- [ ] Post-incident: EVERY production bug becomes a regression test
- [ ] Internal tools / bots that write tests from production logs

### Characteristic markers
- Your team publishes blog posts / talks about testing
- Other companies cite your testing practices
- Test quality is an interview signal
- You're building tools that didn't exist before

### Graduation criterion
You're at the frontier. There's no Level 5 — you define it.

---

## Which level should YOU target?

Match your project category to a level. Don't overshoot — Level 4 for a
side project is malpractice; Level 1 for a payments API is negligence.

| Project type | Target level | Rationale |
|---|---|---|
| **Side project / prototype** | Level 1 | Don't waste time on infra you won't use |
| **Internal tool / dashboard** | Level 2 | Enough safety to refactor confidently |
| **B2B SaaS MVP** | Level 2→3 | Customer trust matters from day 1 |
| **Consumer app (pre-PMF)** | Level 2 | Speed > safety until you have users |
| **Consumer app (post-PMF)** | Level 3 | Regressions now cost real users |
| **Fintech / healthcare** | Level 3 from day 1 | Regulation + trust requirements |
| **Core infra / platform** | Level 3→4 | You're a multiplier; bugs cascade |
| **Core libraries / frameworks** | Level 4 | Every bug hits thousands of teams |
| **Safety-critical (medical, auto, aero)** | Level 4+ | Formal methods mandatory |

---

## How long does each level take?

Rough estimates for a 3-engineer team starting from Level 0:

| Level | Effort | Calendar time |
|---|---|---|
| 0 → 1 | ~3 engineer-days | 1 week |
| 1 → 2 | ~2 engineer-weeks | 3 weeks |
| 2 → 3 | ~1 engineer-month per missing method | 2–3 months |
| 3 → 4 | ~3 engineer-months, research-flavoured | 6+ months |

**Level 2 → 3** is the biggest jump because you're adding multiple new
tool categories (load, SAST, chaos, canary). Don't try to do all at once;
pick one per sprint.

---

## Common anti-patterns

### "We'll start with Level 4 because SOTA"
Skipping levels is wasted effort. You need the Level 1/2 infrastructure
(fast test runner, zero flakes, coverage tracking) before advanced methods
produce any signal. Start at 1, earn each level.

### "We have 100% line coverage so we're at Level 3"
Line coverage is a Level 1 metric. Mutation score is the Level 3 metric.
Your 100% coverage might be worth 30% mutation — see
[methods/06](../methods/06-mutation-testing.md).

### "Property testing is academic, real teams don't do it"
Every major cloud vendor (AWS, Google, Stripe, Cloudflare) uses property
testing for critical paths. If you're NOT using it for your core libraries
you're shipping avoidable bugs.

### "We don't need load testing — we haven't launched yet"
Load testing is cheapest to set up in week 1 when you have no data. Set
up k6 + a CI gate before your first production traffic so regressions are
caught against a baseline.
