/**
 * Property-based testing templates with fast-check.
 *
 * Every property below demonstrates a different invariant type:
 *   1. Monotonicity — function output never decreases with increasing input
 *   2. Idempotence — applying a function twice == applying once
 *   3. Commutativity — f(a, b) === f(b, a)
 *   4. Round-trip — decode(encode(x)) === x
 *   5. Boundedness — output is always within a known range
 *   6. Determinism — same inputs always yield same output
 *
 * Copy the patterns you need; delete the rest.
 */

import { describe, expect, test } from 'vitest'  // or bun:test
import * as fc from 'fast-check'

// ─── Import your actual functions ──────────────────────────────────────
import { computeBackoffMs } from '../src/backoff'
import { buildUrl, parseUrl } from '../src/url'
import { sort } from '../src/sort'
import { add, multiply } from '../src/math'

// ============================================================================
// 1. Monotonicity
// ============================================================================

describe('property: backoff is monotonic non-decreasing', () => {
	test('for every (spec, n): backoff(n) <= backoff(n+1)', () => {
		const spec = fc.record({
			baseMs: fc.integer({ min: 1, max: 100_000 }),
			maxMs: fc.integer({ min: 1_000, max: 3_600_000 }),
		})

		fc.assert(
			fc.property(spec, fc.integer({ min: 0, max: 50 }), (s, n) => {
				const a = computeBackoffMs(n, s)
				const b = computeBackoffMs(n + 1, s)
				return b >= a
			}),
			{ numRuns: 200 },
		)
	})
})

// ============================================================================
// 2. Idempotence
// ============================================================================

describe('property: sort is idempotent', () => {
	test('sort(sort(arr)) === sort(arr)', () => {
		fc.assert(
			fc.property(fc.array(fc.integer()), (arr) => {
				const once = sort([...arr])
				const twice = sort([...once])
				return JSON.stringify(once) === JSON.stringify(twice)
			}),
			{ numRuns: 500 },
		)
	})
})

// ============================================================================
// 3. Commutativity
// ============================================================================

describe('property: add is commutative', () => {
	test('add(a, b) === add(b, a)', () => {
		fc.assert(
			fc.property(fc.integer(), fc.integer(), (a, b) => {
				return add(a, b) === add(b, a)
			}),
		)
	})
})

// ============================================================================
// 4. Round-trip
// ============================================================================

describe('property: buildUrl → parseUrl roundtrip', () => {
	test('parse(build(x)) === x', () => {
		const components = fc.record({
			protocol: fc.constantFrom('http', 'https'),
			host: fc.domain(),
			port: fc.integer({ min: 1, max: 65535 }),
			path: fc.webPath(),
		})

		fc.assert(
			fc.property(components, (c) => {
				const url = buildUrl(c)
				const parsed = parseUrl(url)
				return (
					parsed.host === c.host &&
					parsed.port === c.port &&
					parsed.path === c.path
				)
			}),
			{ numRuns: 300 },
		)
	})
})

// ============================================================================
// 5. Boundedness
// ============================================================================

describe('property: backoff is always in [baseMs, maxMs]', () => {
	test('for every (spec, n): baseMs <= backoff(n) <= maxMs', () => {
		fc.assert(
			fc.property(
				fc.record({
					baseMs: fc.integer({ min: 1, max: 100_000 }),
					maxMs: fc.integer({ min: 1_000, max: 3_600_000 }),
				}),
				fc.integer({ min: 0, max: 100 }),
				(spec, n) => {
					const result = computeBackoffMs(n, spec)
					return result >= spec.baseMs && result <= spec.maxMs
				},
			),
			{ numRuns: 200 },
		)
	})
})

// ============================================================================
// 6. Determinism
// ============================================================================

describe('property: multiply is deterministic', () => {
	test('same inputs always yield same output', () => {
		fc.assert(
			fc.property(fc.integer(), fc.integer(), (a, b) => {
				const r1 = multiply(a, b)
				const r2 = multiply(a, b)
				return r1 === r2
			}),
		)
	})
})

// ============================================================================
// Reproduction of a specific failing seed
// ============================================================================

// When a property fails, fast-check prints a seed. Save it as a regression:
// test('regression: seed 1234567890', () => {
// 	fc.assert(
// 		fc.property(/* ... */),
// 		{ seed: 1234567890, path: '42:3:0', endOnFailure: true },
// 	)
// })
