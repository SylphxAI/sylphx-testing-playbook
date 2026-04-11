# 34 — Penetration Testing (Manual)

> Ethical hackers try to break your system. Complements automated SAST.

**Category:** Critical for compliance
**Effort:** Very high (external firm or bug bounty)
**ROI:** Extreme for compliance
**Maturity level:** 3

## What it catches

Security vulnerabilities automated tools miss:
- Business logic flaws (e.g. race conditions in payment flows)
- Auth bypasses (token reuse, session fixation)
- Privilege escalation in complex role systems
- OSINT-based attacks (exposed internal URLs, leaked creds)
- Social engineering vectors (phishing templates, support flow abuse)

## When required

- **Compliance**: PCI-DSS, SOC 2 Type II, HIPAA, ISO 27001 all require annual pentest
- **Pre-launch** for security-critical products
- **After major architecture changes**

## How to get it done

1. **Hire a firm** — NCC Group, Bishop Fox, Trail of Bits, etc ($20k–200k)
2. **Bug bounty** — HackerOne, Bugcrowd, YesWeHack
3. **Red team exercise** — in-house or contracted, broader scope

## Complementary to SAST

- **SAST** (method 10) catches known-pattern vulnerabilities in source
- **Pentest** catches novel, business-logic, and runtime-only bugs

You need BOTH.

## Further reading

- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [HackerOne](https://www.hackerone.com/)
