# 15 — Schema & Migration Testing

> Lint migrations for destructive operations, long locks, and irreversible changes BEFORE applying to production.

**Category:** Critical for data-bearing services
**Effort:** Low
**ROI:** Extreme — one bad migration can destroy customer data
**Maturity level:** 2

## What it is

Static analysis of SQL migration files against a set of safety rules:

- No `DROP TABLE` / `DROP COLUMN` without a guard
- No `ALTER COLUMN ... TYPE ...` that rewrites the table
- No `ADD COLUMN NOT NULL` without a default (blocks writes)
- No index creation without `CONCURRENTLY`
- No `UPDATE ... WHERE ...` affecting > X% of rows in one transaction

## Tools

| Tool | DB | Status |
|---|---|---|
| **Atlas** | Postgres, MySQL | 🟢 SOTA (`atlas migrate lint`) |
| **Skeema** | MySQL | 🟢 Mature |
| **Liquibase** | Multi | 🟡 Enterprise |
| **Squawk** | Postgres | 🟢 Focused linter |
| **sqlfluff** | Multi | 🟢 SQL linter |

## Setup

Atlas is SOTA for SQL-first schema management:

```bash
brew install ariga/tap/atlas
```

```hcl
# atlas.hcl
env "ci" {
  src = "file://atlas/schema.sql"
  dev = "docker://postgres/18/dev"
}
```

## Example

```bash
# In CI:
atlas migrate lint --env ci --latest 1
```

Catches:
```
Destructive changes detected:
  migrations/20260411100000_drop_col.sql:3: dropping column "email" from table "users"
```

For Postgres specifically:
```bash
squawk migrations/*.sql
```
Catches:
```
squawk-4: ban-drop-column
  fileName: migrations/20260411.sql:3
  Dropping a column requires a lock on the entire table
```

## Gotchas

### 1. "Safe" migrations that aren't
`ADD COLUMN ... NOT NULL DEFAULT 'x'` rewrites the entire table in old PG (< 11). In new PG it's fine. Use `atlas migrate lint` which knows the version.

### 2. Backfill as a separate migration
Big UPDATEs should be batched:
```sql
-- ❌ Locks the table
UPDATE users SET status = 'active' WHERE status IS NULL;

-- ✅ Batched
UPDATE users SET status = 'active' WHERE id IN (SELECT id FROM users WHERE status IS NULL LIMIT 1000);
-- run repeatedly
```

### 3. Missing rollback verification
Test that `down` migrations actually reverse `up`:
```bash
atlas migrate down --env ci  # then re-up
atlas schema diff --env ci
# Should be empty — schema is same as before
```

## CI integration

```yaml
- name: Lint migrations
  run: atlas migrate lint --env ci --latest 1
```

## Graduation criteria

- [ ] Every migration passes `atlas migrate lint`
- [ ] Destructive changes require explicit `--allow-destructive` flag
- [ ] Migrations reviewed in PR with lint output visible
- [ ] Rollback tested for every migration
- [ ] Big backfills batched, not single-txn

## Further reading

- [Atlas docs](https://atlasgo.io)
- [Squawk](https://github.com/sbdchd/squawk)
- [GitLab's migration review process](https://docs.gitlab.com/ee/development/migration_style_guide.html)
