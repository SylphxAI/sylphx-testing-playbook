# 11 — Canary SLO Gates

> Progressive rollouts gated by real-time SLO metrics. Auto-rollback on breach.

**Category:** Critical for production
**Effort:** Medium
**ROI:** High
**Maturity level:** 3

## What it is

Flagger / Argo Rollouts watches your metrics during a deploy. Traffic shifts to the canary gradually (e.g. 5% → 25% → 50% → 100%), and at each step the SLO is checked. If reconcile success rate < 99.5% or p99 latency > 30s, rollback is automatic.

## Why it catches bugs nothing else does

Catches **regressions that only appear under real production traffic**. Your tests passed, your load test passed, but the canary SLO drops because of a production-only interaction — and rollback happens automatically, before users notice.

## Tools

| Tool | Status | Best for |
|---|---|---|
| **Flagger** | 🟢 SOTA | K8s-native, Istio/Linkerd/Contour integration |
| **Argo Rollouts** | 🟢 SOTA | Alternative, tightly integrated with ArgoCD |
| **Spinnaker** | 🟡 Mature | Enterprise, multi-cloud |

## Setup

See [`templates/flagger/canary.yaml`](../templates/flagger/canary.yaml).

## Example

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: my-service
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-service
  analysis:
    interval: 60s
    iterations: 5
    metrics:
      - name: success-rate
        thresholdRange:
          min: 99.5
        templateRef:
          name: success-rate-template
      - name: p99-latency
        thresholdRange:
          max: 500
```

## Graduation criteria

- [ ] Canary CRD deployed for critical services
- [ ] SLO-based gates encoded in MetricTemplate
- [ ] Pre-rollout + post-rollout webhooks for Slack notifications
- [ ] Auto-rollback verified in at least one intentional bad deploy

## Further reading

- [Flagger docs](https://flagger.app/)
- [Argo Rollouts docs](https://argoproj.github.io/argo-rollouts/)
- [Case study — Flagger Canary for managed-resource controller](../case-studies/sylphx-managed-resource-controller.md#canary-deploys)
