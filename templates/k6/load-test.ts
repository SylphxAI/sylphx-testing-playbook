/**
 * k6 load test template — SLO-gated for CI.
 *
 * Fails the CI run if any threshold trips. Start with this file, adapt
 * `options.stages` and `default` function to match your service.
 *
 * Run:
 *   k6 run --env API_URL=https://staging.example.com --env TOKEN=$TOKEN k6/load-test.ts
 *
 * For k6 Cloud distributed runs:
 *   k6 cloud k6/load-test.ts
 */

// @ts-check
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// ─── Custom metrics ──────────────────────────────────────
const errorRate = new Rate('errors')
const apiLatency = new Trend('api_latency_ms', true)

// ─── Test shape ──────────────────────────────────────
export const options = {
	stages: [
		{ duration: '2m', target: 50 },   // ramp up
		{ duration: '5m', target: 50 },   // steady load
		{ duration: '2m', target: 200 },  // spike
		{ duration: '5m', target: 200 },  // steady spike
		{ duration: '2m', target: 0 },    // ramp down
	],
	thresholds: {
		// SLO gates — CI fails if any breach
		http_req_duration: [
			'p(95)<500',   // 95% under 500ms
			'p(99)<1000',  // 99% under 1s
		],
		http_req_failed: ['rate<0.01'],  // < 1% error rate
		errors: ['rate<0.01'],
		api_latency_ms: ['p(99)<1000'],
	},
	// Abort if thresholds are breached early — fail fast
	abortOnFail: true,
}

// ─── Setup ──────────────────────────────────────
const API = __ENV.API_URL || 'http://localhost:3000'
const TOKEN = __ENV.TOKEN || ''
const HEADERS = {
	Authorization: `Bearer ${TOKEN}`,
	'Content-Type': 'application/json',
}

// ─── Default scenario ──────────────────────────────────────
/**
 * Each virtual user runs this function in a loop. Model realistic user
 * behaviour: pick an endpoint randomly (weighted by real traffic), fire
 * the request, assert response correctness, record metrics, sleep like
 * a real user.
 */
export default function () {
	const endpoints = [
		{ weight: 0.6, path: '/api/resources', method: 'GET' },
		{ weight: 0.3, path: '/api/resources/r-1', method: 'GET' },
		{ weight: 0.1, path: '/api/health', method: 'GET' },
	]

	// Weighted random pick
	const r = Math.random()
	let acc = 0
	const endpoint = endpoints.find((e) => {
		acc += e.weight
		return r <= acc
	}) || endpoints[0]

	const start = Date.now()
	const res = http.request(endpoint.method, `${API}${endpoint.path}`, null, {
		headers: HEADERS,
	})
	apiLatency.add(Date.now() - start)

	const ok = check(res, {
		'status is 2xx': (r) => r.status >= 200 && r.status < 300,
		'response has body': (r) => r.body !== null,
	})
	if (!ok) errorRate.add(1)

	sleep(Math.random() * 2 + 1)  // 1–3s think time
}

// ─── Per-stage handlers (optional) ──────────────────────────────────────
export function handleSummary(data) {
	return {
		'stdout': textSummary(data, { indent: ' ', enableColors: true }),
		'k6-report.json': JSON.stringify(data, null, 2),
	}
}

function textSummary(data, opts) {
	// k6's built-in formatter — shipped with k6
	// @ts-expect-error
	return require('https://jslib.k6.io/k6-summary/0.0.2/index.js').textSummary(data, opts)
}
