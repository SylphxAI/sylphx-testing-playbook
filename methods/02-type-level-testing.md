# 02 — Type-Level Testing

> Test your TYPES, not just your code. Catch API drift at compile time before a single test runs.

**Category:** Core
**Effort:** Low
**ROI:** High (especially for libraries)
**Maturity level it unlocks:** 2

---

## What it is

Type-level testing asserts that **TypeScript types are what you think they are**.
You write assertions ABOUT types, and the TypeScript compiler verifies them.

If the type is wrong, `tsc` fails the build. No test runner needed — the
compiler IS the test runner.

```typescript
import { expectTypeOf } from 'expect-type'

expectTypeOf<ResourceId>().toEqualTypeOf<string & { readonly __brand: 'ResourceId' }>()
expectTypeOf<ResourceId>().not.toEqualTypeOf<OrgId>()
expectTypeOf(UserSchema.parse).returns.toEqualTypeOf<User>()
```

## Why it catches bugs nothing else does

Type-level tests catch a unique class of bug: **silent API drift**. Example:

```typescript
// Public API
export function createOrder(input: OrderInput): Order { ... }

// Refactor changes Order's `total` from `number` to `{ amount: number, currency: string }`
// No runtime tests break because every existing call site still compiles
// (they read `result.total` as an object → silently gets `[object Object]`)
```

A type-level test catches this at compile time:
```typescript
expectTypeOf(createOrder).returns.toHaveProperty('total').toEqualTypeOf<number>()
// ❌ compile error after the refactor
```

For libraries, this is the ONLY way to catch breaking changes to public
types before releasing.

## When to use

- **Libraries / frameworks** — every exported type needs a contract test
- **Branded / nominal types** — verify they can't be confused
- **Generics** — test that type parameters flow correctly
- **Conditional types** — edge cases in `T extends U ? ... : ...`
- **Inferred return types** — catch unexpected widening

## When NOT to use

- **Internal-only types** — if a type is only used inside one module, the
  TypeScript compiler already catches misuse at every call site
- **Simple types** — don't write `expectTypeOf<User['name']>().toEqualTypeOf<string>()`
  if the type is literally `{ name: string }` in the same file

## Tools

| Tool | Status | Best for |
|---|---|---|
| **expect-type** | 🟢 SOTA | General-purpose, fluent API |
| **tsd** | 🟢 SOTA | Separate `*.test-d.ts` files, `@ts-expect-error` |
| **ts-toolbelt** (type utilities) | 🟢 Active | Building custom type assertions |
| **typings-checker** | 🔴 Legacy | Don't adopt new |

## Setup

```bash
bun add -d expect-type
```

Add type-level tests alongside your runtime tests:

```typescript
// src/ids/brands.types.test.ts
import { expectTypeOf } from 'expect-type'
import { describe, test } from 'bun:test'
import { ResourceId, OrgId, type Brand } from './brands'

describe('brands are nominally distinct', () => {
  test('ResourceId is NOT assignable to OrgId', () => {
    // Compile-time check — runtime is a no-op
    function takesOrgId(_id: OrgId): void {}
    const resourceId = ResourceId.unsafe('x')

    // @ts-expect-error — this SHOULD fail to compile
    takesOrgId(resourceId)

    expectTypeOf(resourceId).not.toEqualTypeOf<OrgId>()
  })
})
```

## Example

Real example from our branded IDs:

```typescript
import { expectTypeOf } from 'expect-type'
import {
  ResourceId,
  OrgId,
  unbrand,
  type Brand,
} from '../brands'

describe('branded IDs are structurally strings', () => {
  test('ResourceId is a string', () => {
    expectTypeOf<ResourceId>().toExtend<string>()
  })
})

describe('brands are nominally distinct', () => {
  test('plain string is NOT assignable to any brand', () => {
    function takesResourceId(_id: ResourceId): void {}
    const plain: string = 'some-string'

    // @ts-expect-error — plain string needs ResourceId.of() or .unsafe()
    takesResourceId(plain)

    expectTypeOf<string>().not.toEqualTypeOf<ResourceId>()
  })
})

describe('brand constructors', () => {
  test('ResourceId.of() returns ResourceId', () => {
    expectTypeOf(ResourceId.of).returns.toEqualTypeOf<ResourceId>()
  })

  test('ResourceId.is() is a type guard', () => {
    expectTypeOf(ResourceId.is).guards.toEqualTypeOf<ResourceId>()
  })
})
```

## Gotchas

### 1. `@ts-expect-error` in the WRONG place
`@ts-expect-error` suppresses the NEXT line. If that line becomes valid
TS, the compiler reports `Unused @ts-expect-error directive` — which is
how you catch positive-case drift.

```typescript
// @ts-expect-error — plain string not assignable to ResourceId
takesResourceId(plain)  // ← this line MUST still error

// If we refactor and plain becomes assignable, the @ts-expect-error
// itself becomes an error → your test fails → regression caught
```

### 2. Branded types that aren't actually branded
```typescript
// ❌ Structural types can still flow through
type UserId = string & { __userId: 'UserId' }  // phantom field
const x: UserId = 'abc'  // ✅ TS accepts this (string is subtype)

// ✅ Unique symbol makes it truly nominal
declare const __brand: unique symbol
type Brand<T, B extends string> = T & { readonly [__brand]: B }
```

### 3. Over-testing trivial types
```typescript
// ❌ Waste of lines
expectTypeOf<{ name: string }>().toHaveProperty('name').toEqualTypeOf<string>()

// The type annotation on the same line already proves this
```

### 4. Confusing `toEqual` vs `toExtend`
```typescript
expectTypeOf<Circle>().toExtend<Shape>()       // Circle is assignable TO Shape
expectTypeOf<Shape>().not.toExtend<Circle>()   // Shape is NOT assignable to Circle
expectTypeOf<Circle>().toEqualTypeOf<Circle>() // structurally identical
```

## CI integration

Type tests run as part of `tsc --noEmit` — no separate command needed:

```yaml
- name: Typecheck (includes type-level tests)
  run: bun run typecheck
```

Typical runtime: **zero additional time** — type-level tests add ~1% to
tsc duration.

## Signal it produces

- **Compile success/failure**
- **Error location + message** pointing to the exact assertion that broke
- No numeric metric (it's pass/fail)

## Graduation criteria

- [ ] Every exported public type has at least one assertion
- [ ] Branded / nominal types have `not.toEqualTypeOf` tests
- [ ] Negative cases use `@ts-expect-error` with descriptive comments
- [ ] Type-level tests run on every PR (via `tsc --noEmit`)
- [ ] You've caught at least one breaking change via a failing type test

## Further reading

- [expect-type docs](https://github.com/mmkal/expect-type)
- [tsd docs](https://github.com/SamVerschueren/tsd)
- [TypeScript Handbook — Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [Our case study — branded IDs with 15 type-level tests](../case-studies/sylphx-managed-resource-controller.md#branded-ids)
