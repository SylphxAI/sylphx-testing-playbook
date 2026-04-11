# 14 — testcontainers (Real Services in Docker)

> Spin up REAL Postgres / Redis / Kafka / etc in Docker containers during tests. Full-fidelity integration.

**Category:** Critical for data integration
**Effort:** Medium
**ROI:** High for DB-heavy testing
**Maturity level:** 2

## What it is

testcontainers starts a real Docker container for your test and tears it down after. Unlike in-memory fakes (pg-mem), you get 100% fidelity with the real service — every SQL feature, every operator, every extension.

## When to use over pg-mem

- `FOR UPDATE SKIP LOCKED` (pg-mem doesn't support)
- `pg_notify` / LISTEN
- Full-text search
- PostGIS / TimescaleDB extensions
- Triggers
- Real query planner / EXPLAIN

## Tools

| Tool | Language | Status |
|---|---|---|
| **testcontainers-node** | JS/TS | 🟢 SOTA |
| **testcontainers-python** | Python | 🟢 SOTA |
| **testcontainers-java** | Java | 🟢 Original |
| **testcontainers-go** | Go | 🟢 Mature |

## Setup

```bash
bun add -d testcontainers
# Docker must be running on the host
```

## Example

```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'

describe('pg_notify integration (requires real Postgres)', () => {
  let container: StartedPostgreSqlContainer
  let db: ReturnType<typeof drizzle>

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18.3-alpine')
      .withDatabase('test')
      .withUsername('test')
      .withPassword('test')
      .start()

    const client = new Client({ connectionString: container.getConnectionUri() })
    await client.connect()
    db = drizzle(client)

    // Run migrations
    await client.query(fs.readFileSync('./schema.sql', 'utf8'))
  })

  afterAll(async () => {
    await container.stop()
  })

  test('LISTEN/NOTIFY delivers events', async () => {
    const received: string[] = []
    const listener = new Client({ connectionString: container.getConnectionUri() })
    await listener.connect()
    await listener.query('LISTEN my_channel')
    listener.on('notification', (msg) => received.push(msg.payload!))

    await db.execute(sql`SELECT pg_notify('my_channel', 'hello')`)

    await new Promise((r) => setTimeout(r, 100))
    expect(received).toContain('hello')

    await listener.end()
  })
})
```

## Gotchas

### 1. Container startup time
Starting Postgres takes ~3-5 seconds. Amortize by:
- `beforeAll` (container per test file), not `beforeEach`
- Run tests in parallel with isolated schemas: `CREATE SCHEMA test_${processId}` per worker

### 2. CI without Docker
GitHub Actions has Docker-in-Docker. Other CI might not.

### 3. Leaked containers
If tests crash without `afterAll`, containers stay running. testcontainers has a "ryuk" reaper container that kills orphans — make sure it's enabled.

## CI integration

```yaml
- name: Integration tests (testcontainers)
  run: bun test src/**/*.integration.test.ts
  timeout-minutes: 10
  env:
    DOCKER_HOST: unix:///var/run/docker.sock
```

## Graduation criteria

- [ ] testcontainers setup for all stateful deps (DB, cache, queue)
- [ ] Integration tests run in CI
- [ ] < 30 seconds total container startup time (parallel)
- [ ] Tests that need features pg-mem doesn't support use testcontainers

## Further reading

- [testcontainers-node docs](https://node.testcontainers.org/)
- [Testing Postgres with testcontainers](https://www.atomicjar.com/2022/12/testcontainers-postgres-typescript/)
