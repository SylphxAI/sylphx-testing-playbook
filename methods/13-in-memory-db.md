# 13 — In-Memory Database Integration Testing

> Run real ORM queries against an in-memory database for fast, deterministic SQL semantic testing.

**Category:** Critical for DB-heavy code
**Effort:** Low-Medium
**ROI:** High
**Maturity level:** 2

## What it is

Instead of mocking the ORM (which tests nothing real) or spinning up Docker Postgres (which is slow), use a pure-TypeScript in-memory database implementation. It parses real SQL, enforces real constraints (NOT NULL, UNIQUE, CHECK), and runs the REAL ORM query builder output.

## Why it catches bugs nothing else does

Mocked DB code tests **what you think the query does**. In-memory DB tests **what the query actually does**. Catches:

- Incorrect JOIN conditions
- WHERE clause bugs (type coercion, NULL handling)
- ORDER BY with NULLS FIRST/LAST
- FOR UPDATE lock behaviour
- Interval arithmetic
- Composite indexes / unique constraints

...all without spawning a real Postgres container.

## Tools

| Tool | DB | Language | Status |
|---|---|---|---|
| **pg-mem** | Postgres | JS/TS | 🟢 SOTA for Postgres |
| **better-sqlite3** (`:memory:`) | SQLite | JS | 🟢 If you use SQLite |
| **H2** (in-mem mode) | JDBC | Java | 🟢 Java world |
| **sqlmock** | Any | Go | 🟢 Go world |

## Setup

```bash
bun add -d pg-mem
```

## Example (pg-mem + Drizzle)

```typescript
import { newDb } from 'pg-mem'
import { drizzle } from 'drizzle-orm/node-postgres'
import { users } from '@/db/schema'
import { buildActionableWhere } from '../actionable-query'

const mem = newDb()
mem.public.registerFunction({
  name: 'gen_random_uuid',
  returns: 'uuid' as any,
  implementation: () => '00000000-0000-0000-0000-000000000000',
})
mem.public.none(`
  CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`)

// Wrap the pg-mem pool for Drizzle compatibility
const { Pool } = mem.adapters.createPg()
const rawPool = new Pool()
const pool = new Proxy(rawPool, {
  get(target, prop) {
    if (prop === 'query') {
      return async (config: any, ...rest: any[]) => {
        // Strip Drizzle's types.getTypeParser (pg-mem doesn't support it)
        if (config?.types) {
          const { types, rowMode, ...rest2 } = config
          return target.query(rest2, ...rest)
        }
        return target.query(config, ...rest)
      }
    }
    return (target as any)[prop]
  },
})

const testDb = drizzle(pool)

test('buildActionableWhere picks up terminating rows', async () => {
  await testDb.insert(users).values({ email: 'a@b.co' })

  // Run the REAL Drizzle query builder output
  const result = await testDb.execute(sql`
    SELECT id FROM users WHERE ${buildActionableWhere(...)}
  `)

  expect(result.rows.length).toBe(1)
})
```

## Gotchas

### 1. pg-mem supports 80% of PostgreSQL, not 100%
Missing:
- `FOR UPDATE SKIP LOCKED`
- `pg_notify`
- Full-text search (tsvector)
- Extensions
- Triggers (limited)

For these, use [testcontainers](14-testcontainers.md).

### 2. Drizzle Compatibility hacks
Drizzle uses `types.getTypeParser` which pg-mem doesn't support. You need a proxy wrapper (see example).

### 3. Rolling your own schema SQL
pg-mem doesn't run Atlas / Drizzle migrations directly. Either:
- Hand-write the `CREATE TABLE` SQL in tests
- Run your migrations against a temp real Postgres once, dump schema, feed to pg-mem

## CI integration

Integration tests run normally — pg-mem is a library, not a service.

```yaml
- name: pg-mem integration tests
  run: bun test src/**/*.pgmem.test.ts
  timeout-minutes: 2
```

## Graduation criteria

- [ ] Real Drizzle queries run against pg-mem
- [ ] Schema matches production (kept in sync)
- [ ] Test suite < 5 seconds
- [ ] Critical queries (actionable-query, cursor pagination) covered

## Further reading

- [pg-mem docs](https://github.com/oguimbal/pg-mem)
- [Case study — actionable-query pg-mem integration](../case-studies/sylphx-managed-resource-controller.md#pg-mem-integration)
