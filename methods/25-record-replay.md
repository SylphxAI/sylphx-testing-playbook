# 25 — Record-and-Replay Testing

> Record real production traffic, replay against new code, diff the responses.

**Category:** Situational
**Effort:** High
**ROI:** Extreme for backward-compat validation
**Maturity level:** 3–4

## What it catches

Backward compatibility regressions that synthetic tests miss. Production traffic has edge cases you'd never think to write tests for.

## Tools

- **GoReplay** — tcpdump for HTTP traffic, replay against staging
- **Diffy** (Twitter OSS) — replay + automatic response diff
- **VCR-style libraries** (nock with `recorder`) — record HTTP in tests
- **rr** (Mozilla) — process-level deterministic replay

## How it works

```bash
# Capture 1h of prod traffic
gor --input-raw :80 --output-file prod-traffic.log

# Replay against staging, compare to baseline
gor --input-file prod-traffic.log --output-http http://staging.example.com
```

Then diff the staging responses against a "golden" baseline or the current production responses.

## When to use

- **Before major version cut** — compare v2 responses to v1 on real traffic
- **Sanity check** — new release shouldn't change existing responses
- **API versioning** — deprecated endpoints should still work

## Gotchas

- **Privacy** — production traffic has PII; sanitize before replay
- **Non-idempotent calls** — don't replay POSTs that modify state
- **Clock sensitivity** — replay-time responses may differ from record-time

## Further reading

- [GoReplay](https://goreplay.org/)
- [Twitter Diffy](https://blog.x.com/engineering/en_us/a/2015/diffy-testing-services-without-writing-tests)
