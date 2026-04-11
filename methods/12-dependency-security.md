# 12 — Dependency / Supply Chain Security

> Scan every dependency for known CVEs, malicious packages, and unpinned transitive risks.

**Category:** Critical (security hygiene)
**Effort:** Low
**ROI:** High
**Maturity level:** 3

## What it is

Automated scanning of `package.json` / `package-lock.json` / `bun.lock` against public vulnerability databases (npm audit, OSV, GHSA).

## Why it catches bugs nothing else does

Your source code can be perfect, but if `lodash@4.17.20` has CVE-2021-23337, you're vulnerable. Supply chain attacks (like `event-stream`, `colors.js` sabotage, `ua-parser-js` hijack) injected malicious code into popular packages — only dependency scanning catches these.

## Tools

| Tool | Purpose |
|---|---|
| **`bun audit`** | Bun's built-in CVE scanner |
| **`npm audit`** | npm's built-in |
| **Socket.dev** | 🟢 SOTA — ML-augmented supply chain risk scoring |
| **Snyk** | Commercial, broad coverage |
| **Dependabot** (GitHub) | Auto-PRs for vuln updates |
| **Renovate** | Alternative to Dependabot, more configurable |
| **cosign** (Sigstore) | Cryptographic dependency signing |
| **SLSA** | Supply-chain integrity attestations |

## Setup

```bash
# GitHub-native: Dependabot
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: daily
    open-pull-requests-limit: 10
```

For deeper checks:
```bash
# Install Socket CLI
bun add -g @socketsecurity/cli
socket npm install  # wraps install with supply-chain check
```

## Example

```yaml
# CI
- name: Audit dependencies
  run: bun audit
  # Fail on high/critical CVEs
```

```yaml
# Renovate config
{
  "extends": ["config:recommended", ":dependencyDashboard"],
  "vulnerabilityAlerts": {
    "enabled": true,
    "automerge": true
  }
}
```

## Gotchas

- **`npm audit` false positives** — some CVEs don't affect your actual usage
- **Transitive pinning** — you need `overrides` / `resolutions` to pin a sub-dep
- **Dependabot fatigue** — unmerged PRs pile up; schedule weekly review

## Graduation criteria

- [ ] `bun audit` in CI, failing on high/critical
- [ ] Dependabot / Renovate enabled
- [ ] SBOM (Software Bill of Materials) generated on each build
- [ ] Production builds use only signed / attested packages

## Further reading

- [Socket.dev blog](https://socket.dev/blog)
- [Sigstore / SLSA](https://slsa.dev)
- [OWASP supply chain guide](https://owasp.org/www-project-supply-chain/)
