# 03 — Integration Testing

> Test multiple modules working together, with I/O boundaries mocked or faked. The sweet spot in the Testing Trophy.

**Category:** Core
**Effort:** Medium
**ROI:** **High** — this is where most of your tests should live
**Maturity level it unlocks:** 2

---

## What it is

An integration test exercises **two or more real modules** connected
together, with the I/O boundary (DB, HTTP, file system) either:

- Replaced with an in-memory fake (e.g. pg-mem for Postgres)
- Mocked at the top layer only (e.g. fetch returns canned responses)
- Replaced with a testcontainers-spawned real service

Unlike unit tests, the **composed behaviour** matters. Unlike E2E tests,
you don't launch a real browser / cluster / network.

## Why it catches bugs nothing else does

Most real bugs live in the **wiring between modules**, not inside any one
module. Examples:

- Module A calls module B with the wrong argument order
- Module A handles module B's error types incorrectly
- Module A expects module B to return a Promise, B returns synchronously
- The Zod schema at the API boundary accepts what the DB module can't handle
- Transaction ordering is wrong — B reads before A commits

Unit tests can't catch these because each module passes in isolation.
E2E tests can catch them but are too slow and brittle to run thousands
of times.

**Integration tests are the sweet spot: fast enough to run on every save,
realistic enough to catch wiring bugs.**

## When to use

- **API routes + DB** (request → route → DB query → response)
- **Background workers** (job pickup → processing → state update)
- **State machines** with multi-step transitions
- **Orchestrators** that call multiple services
- **ANY time** you're testing "does module A + module B produce the right
  result together?"

**This is where most of your tests should live.** The Testing Trophy
(Kent C. Dodds) recommends integration tests as the largest category —
more than unit, more than E2E.

## When NOT to use

- **Pure functions** — unit tests are faster and more focused
- **Full user journeys** — use E2E / Playwright
- **Testing a mock** — if you're mocking everything, you're not testing
  integration, you're testing your mock setup

## Tools

Same frameworks as unit testing — the METHOD is different, not the tool:

| Tool | Status | Notes |
|---|---|---|
| **vitest** | 🟢 SOTA | Fast, watch mode, module mocking |
| **bun:test** | 🟢 SOTA | Zero config, bun-native |
| **Jest** | 🟡 Mature | Still fine for legacy projects |

For the DB layer specifically:

| Tool | Purpose |
|---|---|
| **pg-mem** | In-memory Postgres (fast, some SQL gaps) |
| **testcontainers-node** | Real Postgres in Docker (slow startup, full fidelity) |
| **drizzle-kit** / ORM fixtures | Schema setup helpers |

## Example

Real integration test from our managed-resource controller — reconcile
state machine with a fake DB and fake K8s service:

```typescript
import { describe, test, expect, mock, beforeEach } from 'bun:test'
import type { KubernetesObject } from '@kubernetes/client-node'
import type { ManagedResource } from '@/lib/db/schema'

// Mock I/O boundaries BEFORE importing the controller
const appliedManifests: KubernetesObject[] = []

mock.module('@/lib/kubernetes/server-side-apply', () => ({
  FIELD_MANAGER: 'sylphx-platform-v1',
  serverSideApply: mock(async (m: KubernetesObject) => {
    appliedManifests.push(m)
  }),
  withK8sResilience: mock(async <A,>(fn: () => Promise<A>) => fn()),
  // ... stubs for every symbol the module exports
}))

// In-memory DB
const mockDb = createMockDb()
mock.module('@/lib/db', () => ({ db: mockDb }))

const { ManagedResourceController } = await import('../controller')

describe('lifecycle integration: provision → sync', () => {
  beforeEach(() => {
    appliedManifests.length = 0
    mockDb.reset()
  })

  test('pending → provisioning → synced', async () => {
    // Seed the mock DB
    const resource = await mockDb.insertResource({
      id: 'r-1',
      reconcileStatus: 'pending',
    })

    // Register a stub provider that returns ready=true immediately
    const controller = new ManagedResourceController()
      .register(makeStubProvider({ ready: true }))

    // Run one reconcile pass
    const result = await controller.runLoop()

    // Assert on the composed outcome
    expect(result.synced).toBe(1)
    expect(result.failed).toBe(0)

    // Assert on the DB state
    const updated = await mockDb.getResource('r-1')
    expect(updated.reconcileStatus).toBe('synced')

    // Assert on the K8s state
    expect(appliedManifests).toHaveLength(2)  // namespace + cluster
  })
})
```

## Gotchas

### 1. Over-mocking → testing your mocks
```typescript
// ❌ Every dependency mocked — no real code under test
mock.module('./a', () => ({ doA: vi.fn().mockReturnValue('mocked') }))
mock.module('./b', () => ({ doB: vi.fn().mockReturnValue('mocked') }))
// Your test is now just asserting that your mocks return what you told them to.
```

Rule of thumb: mock ONLY the I/O boundary. Everything inside is real code.

### 2. Module mock POLLUTION across files
Bun's `mock.module` (and Jest's `jest.mock`) is **process-wide**. If file
A mocks `@/lib/db` and file B imports the real one, B may see the mock
from A depending on run order.

Solutions:
- Put each integration test in its own file with its own mocks
- Use `beforeEach` to reset mocks
- For truly isolated tests, use a separate test script:
  `bun test ./path/to/isolated.test.ts`

### 3. Shared state between tests
```typescript
// ❌ Order-dependent
const controller = new Controller()
test('first test adds something', () => {
  controller.add('x')
  expect(controller.list()).toHaveLength(1)
})
test('second test starts fresh', () => {
  expect(controller.list()).toHaveLength(0)  // ← fails
})

// ✅ Fresh state per test
let controller: Controller
beforeEach(() => {
  controller = new Controller()
})
```

### 4. Integration tests that are actually E2E
If your "integration test" spawns a real DB, real HTTP server, and real
Redis, it's not an integration test — it's E2E. Those are fine but
categorise them correctly and run them in a separate CI stage.

### 5. Slow test setup
If each integration test takes 500ms to set up a fresh DB, you'll have a
slow suite. Options:
- Use pg-mem (no container startup)
- Share an immutable "seed" DB state + reset via truncate
- Use testcontainers once + parallel isolated schemas per test

## CI integration

```yaml
- name: Unit + integration tests
  run: bun test src/**/*.{test,integration.test}.ts
  timeout-minutes: 5
```

Typical runtime: **100 integration tests in 1–5 seconds** with in-memory
fakes. Target: your entire integration suite runs in < 30 seconds.

## Signal it produces

- **Same metrics as unit tests** — coverage, pass/fail, duration
- **Flakiness rate** — if > 0, fix before anything else

## Graduation criteria

- [ ] Every API route has an integration test for the happy path + 1 error
- [ ] Every state machine transition is covered
- [ ] Tests run in < 30 seconds total
- [ ] Module mocks are explicit and minimal
- [ ] No `skip` / `retry` / flakes
- [ ] Tests work correctly when run in isolation AND as part of the full suite

## Further reading

- [Kent C. Dodds — "Write tests. Not too many. Mostly integration."](https://kentcdodds.com/blog/write-tests)
- [Testing Library docs](https://testing-library.com/) — React integration
- [testcontainers-node](https://github.com/testcontainers/testcontainers-node)
- [Our case study — managed-resource lifecycle integration](../case-studies/sylphx-managed-resource-controller.md#integration-tests)
