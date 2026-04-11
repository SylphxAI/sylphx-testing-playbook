# 10 — SAST (Static Application Security Testing)

> Static analysis that searches your source code for security vulnerabilities. Catches injection, taint, and secret-leak classes of bugs before they reach production.

**Category:** Critical (for any production service)
**Effort:** Low
**ROI:** High
**Maturity level it unlocks:** 3

---

## What it is

SAST tools parse your source code and apply pattern matching + taint
analysis to find:

- **Injection** — user input flowing into SQL / shell / HTML
- **Secrets in code** — API keys, passwords, private keys committed
- **Weak crypto** — MD5, SHA-1, ECB mode, short keys
- **Misconfigurations** — CORS `*`, open S3 buckets, permissive IAM
- **Taint flow** — untrusted data reaching dangerous sinks
- **Hardcoded credentials**
- **Known-vulnerable patterns** (from CWE top 25)

Unlike DAST (Dynamic — runs against a running app), SAST works on the
source code and runs in CI.

## Why it catches bugs nothing else does

SAST catches security bugs that are INVISIBLE to functional tests:

- An SQL injection might pass all unit tests (tests use safe inputs)
- A secret in a config file has no functional impact until it leaks
- Insecure deserialization isn't a bug until an attacker finds it
- IAM policies with `*` action work perfectly until abused

Security bugs are distinguished by **what they ENABLE** more than what
they DO wrong. Only pattern analysis can catch them early.

## When to use

- **Always** — there's no reason not to
- Required for: HIPAA, PCI-DSS, SOC 2, ISO 27001 compliance
- Required for: any production service handling user data

## Tools

| Tool | Status | Best for |
|---|---|---|
| **Semgrep** | 🟢 **SOTA** | Fast, rule-based, great DX, free tier |
| **GitHub CodeQL** | 🟢 Mature | Deep taint analysis, free for public repos |
| **Snyk Code** | 🟢 Commercial | Enterprise, ML-augmented |
| **SonarQube** | 🟡 Mature | Self-hosted, broad language support |
| **Checkmarx** | 🟡 Enterprise | Compliance-heavy environments |
| **gitleaks** | 🟢 Focused | Secret scanning only, ultra-fast |

## Setup

### Semgrep (recommended)
```bash
bun add -d @semgrep/cli
# or
pip install semgrep
```

Run locally:
```bash
semgrep --config=auto src/
```

### GitHub CodeQL (for public repos)
```yaml
# .github/workflows/codeql.yml
name: CodeQL
on: [push, pull_request]
jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: typescript
      - uses: github/codeql-action/analyze@v3
```

## Example

Semgrep rules catch patterns like:

```typescript
// ❌ SQL injection — flagged by Semgrep
app.get('/user/:id', (c) => {
  const id = c.req.param('id')
  return db.query(`SELECT * FROM users WHERE id = '${id}'`)
  //                                              ^^^^^^^^^
  //                                     tainted data flows into SQL
})

// ✅ Parameterized query
app.get('/user/:id', (c) => {
  const id = c.req.param('id')
  return db.query('SELECT * FROM users WHERE id = $1', [id])
})
```

Custom Semgrep rule (TypeScript):

```yaml
# .semgrep.yml
rules:
  - id: no-raw-sql-concat
    pattern: db.query(`... ${$X} ...`)
    message: |
      Use parameterized queries instead of string interpolation.
    severity: ERROR
    languages: [typescript]

  - id: no-hardcoded-api-key
    pattern-either:
      - pattern: const $KEY = "sk_live_$..."
      - pattern: const $KEY = "AKIA$..."
    message: API key committed to source — rotate immediately
    severity: ERROR
    languages: [typescript]
```

## Gotchas

### 1. False positives
Semgrep's default ruleset (`--config=auto`) has some false positives.
Review and suppress:

```typescript
// semgrep-ignore-next-line: this input is validated upstream
db.query(`... ${safeInput} ...`)
```

Or tune rules per-project.

### 2. Secret scanning on existing leaks
`gitleaks` will find every secret in your HISTORY, not just the current
commit. If you find one:
1. Rotate it IMMEDIATELY (assume it's public)
2. Use `git filter-repo` to remove it from history
3. Force-push (coordinate with team)
4. Add to `.gitleaksignore` going forward

### 3. SAST blocking PRs noisily
If every PR has 50 false-positive security warnings, developers will
ignore SAST. Solutions:
- Use `only-changes` mode — scan only diff, not whole repo
- Tier rules by severity — only ERROR blocks merge, WARN informs

### 4. SAST without DAST
SAST catches what's in your source. DAST catches what's in your running
system. You need both for defense in depth. See
[penetration testing method 34](34-penetration-testing.md).

### 5. Ignoring dependency vulnerabilities
SAST covers YOUR code. Your dependencies have their own CVEs. See
[dependency security method 12](12-dependency-security.md).

## CI integration

```yaml
- name: SAST
  uses: returntocorp/semgrep-action@v1
  with:
    config: >-
      p/security-audit
      p/typescript
      p/owasp-top-ten
      .semgrep.yml  # project-specific rules
```

Typical runtime: **30 seconds – 2 minutes** on a medium codebase.

## Signal it produces

- **Finding count by severity** (ERROR / WARN / INFO)
- **SARIF report** uploaded to GitHub Security tab
- **Blocked PRs** if severity threshold is breached

## Graduation criteria

- [ ] Semgrep / CodeQL in CI
- [ ] Rules covering: injection, XSS, secrets, crypto
- [ ] Secret scanning (gitleaks) on history + every commit
- [ ] Results visible in PR reviews
- [ ] Project-specific custom rules for domain logic
- [ ] Zero high-severity findings in main branch

## Further reading

- [Semgrep registry](https://semgrep.dev/explore)
- [GitHub Security Lab CodeQL](https://securitylab.github.com/tools/codeql)
- [OWASP Top 10](https://owasp.top10.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
