# 05 — Contract Testing (Zod / Schemas)

> Validate data at every boundary (DB, API, queue, config file). Catch corruption LOUDLY the moment it enters your system.

**Category:** Core
**Effort:** Low
**ROI:** **Extreme** — one well-placed schema catches hundreds of runtime bugs
**Maturity level it unlocks:** 2

---

## What it is

Contract testing means:

1. Define a **schema** for every data shape at a boundary
2. Parse data through the schema the moment it crosses the boundary
3. Throw a clear error with a path (`config.instances: expected positive int, got -1`) on any mismatch

Unlike TypeScript types (compile-time only), schemas enforce contracts at
**runtime** — they catch corruption that no type system can see.

```typescript
import { z } from 'zod'

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().int().positive(),
})

type User = z.infer<typeof UserSchema>

// At the DB boundary
const rawRow = await db.query('SELECT * FROM users WHERE id = $1', [id])
const user = UserSchema.parse(rawRow)  // ← throws LOUDLY on corruption
```

## Why it catches bugs nothing else does

Contract testing catches **runtime data corruption** that TypeScript can't:

- A buggy migration writes `age: -1` to the DB
- An external API changes its response format without telling you
- A config file has a typo: `instnces: 3` instead of `instances: 3`
- A message queue payload is malformed
- Someone manually edited a row with psql and broke an invariant

Without contract validation, these bugs propagate silently until they
crash something deep in business logic. With contract validation, they
fail at the boundary with a clear path to the offending field.

## When to use

**Always** at these boundaries:

- Database reads → parse the row against a schema
- HTTP request inputs → parse query params / body
- HTTP response inputs (from external APIs) → parse responses
- Message queue payloads → parse on consume
- Config files → parse at startup
- Environment variables → parse with `z.string().transform(...)`
- File uploads → parse frontmatter / metadata
- CLI arguments

**Anywhere data enters your system from outside your type-safe zone.**

## When NOT to use

- **Internal function arguments** — TypeScript types are enough
- **Hot paths where parsing overhead matters** (measure first!)

## Tools

| Tool | Language | Best for |
|---|---|---|
| **Zod** | TS/JS | 🟢 SOTA for TS, integrates with Hono/Drizzle |
| **Valibot** | TS | 🟢 Tree-shakeable alternative, smaller bundle |
| **ArkType** | TS | 🟢 Performance-focused, novel type inference |
| **io-ts** | TS | 🟡 fp-ts ecosystem |
| **JSON Schema + Ajv** | Universal | 🟢 Cross-language contract sharing |
| **Pydantic** | Python | 🟢 Python equivalent |
| **Joi** | JS | 🔴 Legacy, prefer Zod |

## Setup

```bash
bun add zod
```

For full SSOT integration:
```bash
bun add drizzle-zod  # generate Zod schemas from Drizzle tables
```

## Example

Full boundary validation with tagged error handling:

```typescript
// src/lib/resources/schemas.ts
import { z } from 'zod'

export const PostgresResourceConfigSchema = z.object({
  engine: z.enum(['cnpg', 'self-hosted']),
  instances: z.number().int().positive(),
  backupRetentionDays: z.number().int().nonnegative(),
  host: z.string().min(1).nullable(),
  port: z.number().int().min(1).max(65535),
  // ... 15 more fields
})

export type PostgresResourceConfig = z.infer<typeof PostgresResourceConfigSchema>

// Discriminated union — only valid (kind, provider, config, secrets) tuples
export const ManagedResourceDataSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('database'),
    provider: z.literal('postgresql'),
    config: PostgresResourceConfigSchema,
    secrets: z.object({ connectionString: z.string().optional() }),
  }),
  z.object({
    kind: z.literal('kv'),
    provider: z.enum(['valkey', 'redis']),
    config: KvResourceConfigSchema,
    secrets: z.object({ password: z.string().optional() }),
  }),
  // ... more kinds
])

// Usage at boundary
export function parseManagedResourceData(row: unknown): ManagedResourceData {
  return ManagedResourceDataSchema.parse(row)
}
```

At the call site:
```typescript
// DB read
const rawRow = await db.query.managedResources.findFirst(...)

// Validate at the boundary
const resource = parseManagedResourceData(rawRow)
// ← throws with a clear path like:
// ZodError: [
//   {
//     path: ['config', 'instances'],
//     message: 'Number must be greater than 0',
//     received: -1
//   }
// ]
```

## Schemas as SSOT (single source of truth)

The SOTA pattern: **Zod schema is the source of truth, TypeScript type is derived.**

```typescript
// ❌ Duplicated — schema and type can drift
interface User { id: string; email: string }
const UserSchema = z.object({ id: z.string(), email: z.string() })

// ✅ Single source — type is inferred
const UserSchema = z.object({ id: z.string(), email: z.string() })
type User = z.infer<typeof UserSchema>
```

For DB models, use `drizzle-zod` to auto-generate Zod from Drizzle:

```typescript
import { createSelectSchema } from 'drizzle-zod'
import { users } from '@/db/schema'

export const UserRowSchema = createSelectSchema(users)
export type UserRow = z.infer<typeof UserRowSchema>
```

Now adding a column to the Drizzle table automatically flows through to
the Zod schema AND the TypeScript type. No drift possible.

## Gotchas

### 1. `parse` vs `safeParse`
```typescript
// ❌ Throws on invalid — caller must try/catch
const user = UserSchema.parse(raw)

// ✅ Returns a Result — more Rust-like
const result = UserSchema.safeParse(raw)
if (!result.success) {
  log.error('user parse failed', { issues: result.error.issues })
  return null
}
const user = result.data
```

Use `safeParse` at boundaries where you want to degrade gracefully.
Use `parse` where corruption is unrecoverable.

### 2. Schema bloat in hot paths
```typescript
// ❌ Parsing on every request — adds 5-50μs per request
app.get('/users/:id', (c) => {
  const user = UserSchema.parse(db.findUser(c.req.param('id')))
  return c.json(user)
})

// ✅ Parse once at the service boundary, pass typed around internally
const userService = {
  findById: (id: string): User => UserSchema.parse(db.findUser(id))
}
```

Schemas at boundaries = good. Schemas in hot inner loops = performance bug.

### 3. Forgetting to narrow after validation
```typescript
// ❌ Schema accepts, but TS doesn't see the narrow
function process(row: unknown) {
  ManagedResourceDataSchema.parse(row)
  row.config  // ← TS still says `unknown`!
}

// ✅ Use the return value
function process(raw: unknown) {
  const row = ManagedResourceDataSchema.parse(raw)
  row.config  // ✅ typed
}
```

### 4. Accepting unknown fields silently
```typescript
// ❌ Extra fields pass through (Zod default)
const User = z.object({ name: z.string() })
User.parse({ name: 'Alice', isAdmin: true })  // ✅ accepted — isAdmin stripped

// ✅ Strict — reject unknown fields
const User = z.object({ name: z.string() }).strict()
User.parse({ name: 'Alice', isAdmin: true })  // ❌ throws
```

Default passthrough is fine for public APIs (forward compat). Strict is
right for internal contracts where unknown fields indicate bugs.

### 5. Schema validation replacing unit tests
Contract tests complement unit tests; they don't replace them. You still
need unit tests for the business logic that consumes the parsed data.

## CI integration

No separate step — Zod parse runs as part of your normal test suite and
production code. The contract checks run every time data crosses a
boundary.

For schemas themselves, add tests verifying the schema accepts valid data
and rejects invalid:

```typescript
describe('PostgresResourceConfigSchema', () => {
  test('accepts minimal valid config', () => {
    expect(() => PostgresResourceConfigSchema.parse(validConfig)).not.toThrow()
  })

  test('rejects invalid engine', () => {
    expect(() => PostgresResourceConfigSchema.parse({ ...validConfig, engine: 'mysql' }))
      .toThrow()
  })
})
```

## Signal it produces

- **Runtime ZodErrors** with exact path to offending field
- **DB read failures** when schema drifts from table
- **API 400 responses** with validation details

Monitor these in production — a spike in ZodErrors indicates either
a bug in your code writing bad data, or a contract drift with an upstream
system.

## Graduation criteria

- [ ] Every DB read has an explicit schema or uses drizzle-zod
- [ ] Every API request is validated (Hono + `@hono/zod-validator`)
- [ ] Every external API response is parsed
- [ ] Env vars are validated at startup (fail fast on misconfig)
- [ ] Tests exist for each schema covering valid + invalid cases
- [ ] Zod is your SSOT — types are `z.infer<typeof schema>`

## Further reading

- [Zod docs](https://zod.dev)
- [drizzle-zod](https://orm.drizzle.team/docs/zod)
- [Hono + Zod OpenAPI](https://hono.dev/examples/zod-openapi)
- [Our case study — drizzle-zod SSOT (ADR-049)](../case-studies/sylphx-managed-resource-controller.md#drizzle-zod-ssot)
