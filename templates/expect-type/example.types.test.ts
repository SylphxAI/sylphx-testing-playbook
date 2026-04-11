/**
 * Type-level test template using expect-type.
 *
 * These tests run at COMPILE time (tsc --noEmit). Runtime is a no-op.
 * If the type assertions are wrong, `tsc` fails. No test runner needed.
 *
 * The `@ts-expect-error` comments are tests themselves: the compiler
 * reports "Unused @ts-expect-error directive" if the error goes away,
 * which catches regressions in nominal typing.
 */

import { describe, test } from 'vitest'  // or bun:test — needed for describe/test scaffolding only
import { expectTypeOf } from 'expect-type'

// ─── Import your actual types ──────────────────────────────────────
import {
	ResourceId,
	OrgId,
	type Brand,
	unbrand,
} from '../src/brands'

// ============================================================================
// Branded IDs are structurally strings
// ============================================================================

describe('branded IDs', () => {
	test('ResourceId extends string', () => {
		expectTypeOf<ResourceId>().toExtend<string>()
	})

	test('OrgId extends string', () => {
		expectTypeOf<OrgId>().toExtend<string>()
	})
})

// ============================================================================
// Brands are nominally distinct (the whole point of branding)
// ============================================================================

describe('brands are nominally distinct', () => {
	test('ResourceId is NOT assignable to OrgId', () => {
		function takesOrgId(_id: OrgId): void {}
		const resourceId = ResourceId.unsafe('x')

		// @ts-expect-error — this MUST fail to compile
		takesOrgId(resourceId)

		expectTypeOf(resourceId).not.toEqualTypeOf<OrgId>()
	})

	test('plain string is NOT assignable to any brand', () => {
		function takesResourceId(_id: ResourceId): void {}
		const plain: string = 'some-string'

		// @ts-expect-error — plain string needs ResourceId.of() or .unsafe()
		takesResourceId(plain)

		expectTypeOf<string>().not.toEqualTypeOf<ResourceId>()
	})
})

// ============================================================================
// Constructor return types
// ============================================================================

describe('brand constructors', () => {
	test('ResourceId.of() returns ResourceId', () => {
		expectTypeOf(ResourceId.of).returns.toEqualTypeOf<ResourceId>()
	})

	test('ResourceId.unsafe() returns ResourceId', () => {
		expectTypeOf(ResourceId.unsafe).returns.toEqualTypeOf<ResourceId>()
	})

	test('ResourceId.is() is a type guard', () => {
		expectTypeOf(ResourceId.is).guards.toEqualTypeOf<ResourceId>()
	})
})

// ============================================================================
// Utility types
// ============================================================================

describe('unbrand utility', () => {
	test('unbrand returns the underlying string', () => {
		const id = ResourceId.unsafe('x')
		const plain = unbrand(id)
		expectTypeOf(plain).toEqualTypeOf<string>()
	})
})

// ============================================================================
// Generic Brand<T, B> utility
// ============================================================================

describe('Brand<T, B>', () => {
	test('Brand<string, "X"> is a subtype of string', () => {
		type X = Brand<string, 'X'>
		expectTypeOf<X>().toExtend<string>()
	})

	test('Brand<string, "X"> is distinct from Brand<string, "Y">', () => {
		type X = Brand<string, 'X'>
		type Y = Brand<string, 'Y'>
		expectTypeOf<X>().not.toEqualTypeOf<Y>()
	})

	test('Brand<number, "Cents"> is distinct from Brand<number, "Dollars">', () => {
		type Cents = Brand<number, 'Cents'>
		type Dollars = Brand<number, 'Dollars'>

		function takesCents(_c: Cents): void {}
		const d = 42 as Dollars

		// @ts-expect-error — Dollars cannot be passed where Cents is expected
		takesCents(d)
	})
})
