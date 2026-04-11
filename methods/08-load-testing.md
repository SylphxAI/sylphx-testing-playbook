# 08 — Load / Stress Testing

> Hit your system with realistic (and unrealistic) traffic volumes to find performance cliffs before users do.

**Category:** Critical (for production services)
**Effort:** Medium
**ROI:** High — catches one class of SLO-breaking bugs no other method finds
**Maturity level it unlocks:** 3

---

## What it is

Load testing scripts simulate many concurrent users performing real
request patterns against your service. The framework records latency,
throughput, error rate, and compares against SLO thresholds.

Types:

| Type | Pattern | Purpose |
|---|---|---|
| **Load test** | Steady expected traffic | Verify SLO at normal load |
| **Stress test** | 2x–10x expected, ramp up | Find breaking point |
| **Spike test** | Sudden 10x, brief | Test auto-scaling response |
| **Soak test** | Steady load for 24h+ | Catch memory leaks, slow degradation |
| **Capacity test** | Ramp until failure | Max sustainable QPS |

## Why it catches bugs nothing else does

Unit / integration / E2E tests all run at **zero load**. They pass in
isolation but miss:

- N+1 queries that blow up at 100 concurrent users
- Connection pool exhaustion
- Memory leaks under sustained load
- GC pauses under heap pressure
- Lock contention on shared resources
- Rate limiter misconfigurations
- Cascading timeouts when one service slows down
- CPU cache effects that only appear at high throughput

## When to use

- **Before every launch** of a new service
- **After every major architectural change** (new DB, new caching layer)
- **Regularly** (weekly / monthly) to catch perf regressions
- **Before marketing events** that might spike traffic

## Tools

| Tool | Language | Status | Best for |
|---|---|---|---|
| **k6** | JS/TS test scripts | 🟢 **SOTA** | Default choice. TS-friendly, cloud-native, CI-ready |
| **Gatling** | Scala DSL | 🟢 Mature | Enterprise, complex scenarios |
| **Locust** | Python | 🟢 Mature | Custom scenarios in Python |
| **Artillery** | YAML + JS | 🟡 OK | Simpler scenarios |
| **wrk / hey / vegeta** | CLI | 🟢 Simple | One-shot HTTP benchmarks |
| **JMeter** | Java GUI | 🔴 Legacy | Don't adopt new |

## Setup

```bash
# k6 CLI (install via Homebrew / apt / choco)
brew install k6
```

Copy [`templates/k6/load-test.ts`](../templates/k6/load-test.ts).

## Example

```javascript
// k6-scripts/resource-api-load.js
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const errorRate = new Rate('errors')

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // ramp up to 100 VUs
    { duration: '5m', target: 100 },   // steady at 100 VUs
    { duration: '2m', target: 500 },   // spike to 500
    { duration: '5m', target: 500 },   // steady spike
    { duration: '2m', target: 0 },     // ramp down
  ],
  thresholds: {
    // SLO-based gates — CI fails if these trip
    http_req_duration: [
      'p(95)<500',   // 95% of requests under 500ms
      'p(99)<1000',  // 99% under 1s
    ],
    http_req_failed: ['rate<0.01'],   // < 1% error rate
    errors: ['rate<0.01'],
  },
}

const API = __ENV.API_URL || 'http://localhost:3000'
const TOKEN = __ENV.TOKEN

export default function () {
  const res = http.get(`${API}/api/resources`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has resources': (r) => JSON.parse(r.body).length > 0,
  }) || errorRate.add(1)

  sleep(1)
}
```

Run:
```bash
k6 run --env API_URL=https://staging.example.com --env TOKEN=$TOKEN k6-scripts/resource-api-load.js
```

## Gotchas

### 1. Load testing production without permission
You can DDoS yourself. Always:
- Test against staging first
- Announce window for prod tests
- Use a read-only endpoint for the first run
- Have a kill switch (k6 supports `--duration 1m` ceilings)

### 2. Unrealistic traffic patterns
```javascript
// ❌ All users hit the same endpoint
http.get('/api/homepage')

// ✅ Weighted mix matching real traffic
const endpoints = [
  { url: '/api/homepage', weight: 0.6 },
  { url: '/api/search', weight: 0.3 },
  { url: '/api/profile', weight: 0.1 },
]
```

Use production logs to derive the traffic mix. Hit the endpoints that
MATTER, in the proportions users actually use them.

### 3. Ignoring the first-request penalty
Cold starts (lambdas, JIT warmup, DB connection pool initialization) make
the first few requests slow. Use k6's `stages` to ramp up gradually, and
ignore the ramp phase in thresholds.

### 4. Load testing without metrics on the target
Load test ONLY tells you what the CLIENT sees. You also need:
- Server CPU / memory during the test
- Database query time / lock stats
- Network throughput
- GC pause histograms

Run Grafana / your APM side-by-side with k6.

### 5. Running on insufficient hardware
A 16-core machine can't simulate 10,000 users realistically. Use k6
Cloud, or scale horizontally across multiple CI runners.

## CI integration

```yaml
- name: Load test (staging)
  run: |
    k6 run --env API_URL=${{ secrets.STAGING_URL }} --env TOKEN=${{ secrets.STAGING_TOKEN }} \
      k6-scripts/resource-api-load.js
  timeout-minutes: 20
  if: github.event_name == 'schedule' || github.ref == 'refs/heads/main'
```

k6's `thresholds` fail the run if SLOs are breached → CI goes red → you
get paged.

## Signal it produces

- **Latency percentiles** (p50, p95, p99)
- **Throughput** (req/s)
- **Error rate** under load
- **Resource saturation points** (where p95 diverges from p50)

## Graduation criteria

- [ ] k6 script for at least one critical endpoint
- [ ] SLO thresholds encoded in `thresholds`
- [ ] Run against staging on every main merge
- [ ] Real traffic mix based on production logs
- [ ] Server-side metrics captured during runs
- [ ] Latest results visible in a Grafana dashboard

## Further reading

- [k6 docs](https://k6.io/docs/)
- [Google SRE — "Handling Overload"](https://sre.google/sre-book/handling-overload/)
- [Brendan Gregg — Systems Performance](https://www.brendangregg.com/systems-performance-2nd-edition-book.html)
