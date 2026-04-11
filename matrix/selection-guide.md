# Method Selection Guide

"Which method should I add NEXT?" — decision tree.

Stop trying to adopt all 35 methods. Answer 6 questions, get a prioritised list.

---

## Step 1 — What does your code DO?

The method you need depends on what your code is. Find your row:

### A. Pure functions + data transforms

**(Parsers, formatters, encoders, math, business rules, state reducers)**

Recommended order:
1. Unit testing ([01](../methods/01-unit-testing.md)) — obvious starting point
2. Property-based testing ([04](../methods/04-property-based-testing.md)) — massive ROI
3. Mutation testing ([06](../methods/06-mutation-testing.md)) — verify tests actually assert
4. Fuzzing ([20](../methods/20-fuzzing.md)) — if the function takes untrusted input
5. Differential testing ([22](../methods/22-differential-testing.md)) — if you're refactoring

**Skip**: E2E, load, visual regression, chaos — irrelevant for pure code.

### B. Stateful services / APIs

**(REST APIs, GraphQL, gRPC, event handlers, background workers)**

Recommended order:
1. Unit testing ([01](../methods/01-unit-testing.md))
2. Integration testing ([03](../methods/03-integration-testing.md)) — the bulk
3. Contract testing ([05](../methods/05-contract-testing.md)) — Zod at boundaries
4. Type-level testing ([02](../methods/02-type-level-testing.md)) — shared DTOs
5. Load testing ([08](../methods/08-load-testing.md)) — before first launch
6. Chaos engineering ([09](../methods/09-chaos-engineering.md)) — fault injection
7. Canary deploys ([11](../methods/11-canary-slo-gates.md)) — SLO gates
8. SAST ([10](../methods/10-sast-security.md)) — injection + secret leak

**Skip**: Visual regression, a11y (unless you have a UI), formal methods
(unless concurrent).

### C. UI applications

**(React / Vue / Svelte / Angular apps, dashboards, consumer products)**

Recommended order:
1. Unit testing ([01](../methods/01-unit-testing.md)) — for hooks + utilities
2. Integration testing ([03](../methods/03-integration-testing.md)) — components
3. E2E testing ([07](../methods/07-e2e-testing.md)) — Playwright critical flows
4. Visual regression ([17](../methods/17-visual-regression.md)) — Chromatic
5. Accessibility ([18](../methods/18-accessibility-testing.md)) — axe-core
6. Contract testing ([05](../methods/05-contract-testing.md)) — API client
7. Type-level testing ([02](../methods/02-type-level-testing.md)) — props / generics

**Skip**: Fuzzing, chaos, formal verification — minimal ROI for UI code.

### D. Distributed infrastructure

**(Reconcilers, operators, controllers, schedulers, data pipelines)**

Recommended order:
1. Unit testing ([01](../methods/01-unit-testing.md))
2. Integration testing ([03](../methods/03-integration-testing.md)) — state machine
3. Property-based testing ([04](../methods/04-property-based-testing.md)) — invariants
4. Mutation testing ([06](../methods/06-mutation-testing.md)) — verify assertions
5. **In-memory DB integration** ([13](../methods/13-in-memory-db.md)) — pg-mem
6. **testcontainers** ([14](../methods/14-testcontainers.md)) — full DB fidelity
7. Chaos engineering ([09](../methods/09-chaos-engineering.md)) — pod kill / net partition
8. Fault injection ([26](../methods/26-fault-injection.md)) — retry logic
9. Canary SLO gates ([11](../methods/11-canary-slo-gates.md))
10. Formal verification ([28](../methods/28-formal-verification.md)) — if state machine is complex

**This is what the Sylphx managed-resource controller is** — see the
[case study](../case-studies/sylphx-managed-resource-controller.md).

### E. Libraries / frameworks

**(npm packages, SDKs, utilities used by many teams)**

Recommended order:
1. Unit testing + **exhaustive property tests** — every invariant
2. Mutation testing — **must be >= 90%** on published surface
3. Type-level testing — public API stability
4. Differential testing — backward compat across versions
5. Fuzzing — if you parse anything
6. Benchmark regression — consumers notice perf cliffs
7. Documentation tests — every README example as a test

**You're multiplying every bug by 1000s of consumers. Test accordingly.**

### F. ML / data science pipelines

**(Training jobs, inference servers, feature pipelines, A/B tests)**

Recommended order:
1. Unit testing — feature engineering + utilities
2. Contract testing ([05](../methods/05-contract-testing.md)) — schema drift
3. Metamorphic testing ([23](../methods/23-metamorphic-testing.md)) — no oracle
4. Differential testing ([22](../methods/22-differential-testing.md)) — model versions
5. Property-based testing — numerical invariants
6. Snapshot testing ([16](../methods/16-snapshot-testing.md)) — model outputs
7. Load testing — inference latency SLOs

---

## Step 2 — What's your scale?

| Scale | Priority shift |
|---|---|
| **Solo / prototype** | Stop at Level 1. Focus on shipping. |
| **Team of 3–10** | Level 2. Aim for speed of iteration. |
| **Team of 10–50** | Level 3. Tests become communication. |
| **Team of 50+** | Level 3+, add testing infrastructure team. |
| **Multi-team / monorepo** | Invest in shared test infra (templates, base configs). |

---

## Step 3 — What's your risk tolerance?

| Domain | Required methods |
|---|---|
| **Experimental** | Level 1 is fine |
| **Customer-facing B2C** | Level 2 + visual regression + a11y |
| **B2B SaaS** | Level 3 — customers have SLA expectations |
| **Payments / money** | Level 3 + formal verification on money flows |
| **Healthcare / HIPAA** | Level 3 + SAST + formal audit trail |
| **Safety-critical (auto, aero, medical)** | Level 4 + formal methods + certification |
| **Open source library** | Level 3–4 regardless of team size |

---

## Step 4 — What's failing in production?

If you already have production issues, choose methods that catch **your
specific class of bug**:

| Production bug you hit | Method that would have caught it |
|---|---|
| "User submitted X and the whole thing crashed" | Fuzzing ([20](../methods/20-fuzzing.md)) or property tests ([04](../methods/04-property-based-testing.md)) |
| "We deployed and nothing worked" | E2E smoke ([07](../methods/07-e2e-testing.md)) + canary ([11](../methods/11-canary-slo-gates.md)) |
| "Works for most users, fails for some" | Contract tests ([05](../methods/05-contract-testing.md)) + combinatorial ([24](../methods/24-combinatorial-testing.md)) |
| "Slow under load" | Load tests ([08](../methods/08-load-testing.md)) + benchmark regression ([21](../methods/21-benchmark-regression.md)) |
| "Works in staging, fails in prod" | testcontainers ([14](../methods/14-testcontainers.md)) + synthetic monitoring ([19](../methods/19-synthetic-monitoring.md)) |
| "Tests pass but prod is broken" | Mutation testing ([06](../methods/06-mutation-testing.md)) + fault injection ([26](../methods/26-fault-injection.md)) |
| "Security breach" | SAST ([10](../methods/10-sast-security.md)) + dependency scan ([12](../methods/12-dependency-security.md)) |
| "Race condition" | Formal verification ([28](../methods/28-formal-verification.md)) + chaos ([09](../methods/09-chaos-engineering.md)) |
| "UI broken on mobile" | Visual regression ([17](../methods/17-visual-regression.md)) + cross-browser E2E |
| "Accessibility lawsuit" | Automated a11y ([18](../methods/18-accessibility-testing.md)) |
| "Migration destroyed data" | Migration testing ([15](../methods/15-migration-testing.md)) + differential ([22](../methods/22-differential-testing.md)) |
| "Deep parser bug" | Coverage-guided fuzzing ([27](../methods/27-coverage-guided-fuzzing.md)) |

---

## Step 5 — What's your deployment model?

| Deployment | Priority |
|---|---|
| **Static site / CDN** | E2E + visual regression + a11y |
| **Serverless functions** | Unit + contract + load testing (cold start matters) |
| **Container / K8s** | Add chaos engineering + canary |
| **Self-hosted VMs** | Add smoke testing + synthetic monitoring |
| **Desktop / mobile app** | Add record-and-replay for backward compat |
| **Embedded / edge** | Formal methods become affordable (code is small) |

---

## Step 6 — What's your budget?

Tests cost compute time + engineer time. Rough budget guide:

| Resource | Crawl | Walk | Run | Fly |
|---|---|---|---|---|
| **CI runtime per commit** | 2 min | 5 min | 15 min | 30+ min (parallel) |
| **Engineer-hours per sprint on testing** | 0–5% | 10–20% | 25–35% | 40%+ |
| **Tools / SaaS monthly** | $0 | $50 | $500 | $5000+ |
| **Dedicated test infra engineers** | 0 | 0 | 1 part-time | 2+ full-time |

---

## Put it together — your prioritised list

1. **Find your category** (A–F above) → get the base ordered list
2. **Adjust by scale** → drop methods your team can't maintain
3. **Adjust by risk** → add mandatory methods for your domain
4. **Adjust by production pain** → skip ahead to the method that fixes your actual bug
5. **Adjust by deployment** → add platform-specific methods
6. **Respect your budget** → don't adopt more than you can run green

**Example — B2B SaaS with 10 engineers hitting UI regression bugs:**
- Category B (service) + Category C (UI) → combined list
- Team 10 → Level 2–3
- B2B risk → Level 3
- Prod bug = UI regression → prioritise E2E + visual regression
- K8s deploy → chaos + canary
- $500/mo budget → can afford Playwright + Chromatic + Stryker

**Result — adopt in this order:**
1. E2E testing (Playwright) ← fixes current pain
2. Visual regression (Chromatic) ← fixes current pain
3. Mutation testing (Stryker) ← verify existing tests
4. Property-based testing (fast-check) ← fill coverage gaps
5. Canary SLO gates (Flagger) ← prevent next incident
6. SAST (Semgrep) ← compliance hygiene

**Do NOT adopt:** fuzzing, formal methods, metamorphic, concolic — irrelevant
for your situation.

---

## Anti-patterns

### "Let's adopt all 35 methods"
No. You'll burn engineer-months on infrastructure that doesn't catch bugs
relevant to your domain.

### "Let's just write more unit tests"
Adding the 501st unit test when you have 500 catches 0.2% more bugs. Adding
your first property test catches edge cases unit tests will NEVER find.

### "We need 100% coverage"
Coverage is a floor, not a goal. Mutation score is the ceiling. See the
[mutation testing method doc](../methods/06-mutation-testing.md).

### "Tests are slowing us down"
Slow tests are a bug in your testing infrastructure, not in the idea of
testing. Fix the infra before cutting the tests.

### "We'll add tests later"
No you won't.
