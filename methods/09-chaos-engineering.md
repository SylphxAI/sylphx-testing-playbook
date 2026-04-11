# 09 — Chaos Engineering

> Intentionally break your infrastructure during tests to verify your system recovers gracefully. "Chaos" is the antonym of "hope as a strategy."

**Category:** Critical (for distributed systems)
**Effort:** High
**ROI:** Extreme when distributed failures matter
**Maturity level it unlocks:** 3

---

## What it is

Chaos engineering injects controlled failures into your production-like
environment:

- Kill a pod at random (pod-kill chaos)
- Add 500ms network latency (network delay chaos)
- Consume 80% CPU on a host (stress chaos)
- Drop packets (packet loss chaos)
- Simulate a DNS outage
- Partition the network
- Fill up a disk

Then it verifies: did your system stay within SLO? If yes — you're resilient.
If no — you have a bug you'd otherwise hit in production at 3am.

## Why it catches bugs nothing else does

Unit/integration/E2E tests run against healthy infrastructure. Chaos tests
run against **broken** infrastructure. They catch:

- Missing retry logic
- Missing circuit breakers
- Missing timeouts (or timeouts set too high)
- Assumption: "this service never goes down"
- Race conditions during leader failover
- Data corruption during partial failure
- Stuck-state bugs ("I'll just wait forever")

The philosophical shift: instead of **hoping** your system is resilient,
you **prove it** by trying to break it.

## When to use

- **Distributed systems** with multiple replicas
- **Services with SLO commitments**
- **Anything stateful** (DB, queue, cache)
- **Kubernetes-native services**

## When NOT to use

- **Single-host applications** — kill the process, you're done
- **Systems without observability** — chaos without metrics is just chaos
- **Pre-production infra that teams rely on** — don't break staging if
  people are using it

## Tools

| Tool | Target | Status | Best for |
|---|---|---|---|
| **Chaos Mesh** | Kubernetes | 🟢 **SOTA 2026-2027** | K8s-native, CRD-based, great UI |
| **Litmus Chaos** | Kubernetes | 🟢 Mature | Alternative to Chaos Mesh |
| **Toxiproxy** | TCP proxy | 🟢 Mature | Language-agnostic network chaos |
| **Pumba** | Docker | 🟡 Simple | Container-level only |
| **Chaos Monkey (Netflix)** | AWS | 🔴 Legacy | Precursor; tools above are better |
| **Gremlin** | Multi-platform | 🟢 SaaS | Commercial, full-featured |

## Setup (Chaos Mesh on K8s)

```bash
kubectl create namespace chaos-mesh
helm install chaos-mesh chaos-mesh/chaos-mesh \
  -n chaos-mesh \
  --set dashboard.create=true
```

Copy [`templates/chaos-mesh/`](../templates/chaos-mesh/) for YAML
experiment templates.

## Example

Pod kill experiment — verify HA failover:

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: controller-pod-kill
spec:
  action: pod-kill
  mode: one
  selector:
    namespaces:
      - sylphx-platform
    labelSelectors:
      app: sylphx-controller
  gracePeriod: 0
  duration: 30s
```

Network delay experiment — verify circuit breaker trips:

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: controller-apiserver-delay
spec:
  action: delay
  mode: all
  selector:
    labelSelectors:
      app: sylphx-controller
  delay:
    latency: '500ms'
    jitter: '100ms'
  direction: to
  target:
    mode: all
    selector:
      labelSelectors:
        component: kube-apiserver
  duration: 3m
```

Composite workflow — run multiple experiments in sequence:

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: Workflow
metadata:
  name: managed-resource-resilience
spec:
  entry: entry-gate
  templates:
    - name: entry-gate
      templateType: Serial
      children:
        - baseline-check     # SLO must be green BEFORE chaos
        - pod-kill
        - wait-30s
        - verify-slo-after-kill
        - network-delay
        - verify-slo-after-delay
        - cpu-stress
        - verify-slo-after-stress
        - final-slo-check    # Strict SLO after full chaos suite
```

## Gotchas

### 1. Chaos without SLO gates
Chaos Mesh doesn't automatically know what "broken" means. You need to
couple experiments with **automated SLO verification**:

```yaml
- name: verify-slo-after-kill
  templateType: Task
  task:
    container:
      image: curlimages/curl
      command:
        - sh
        - -c
        - |
          RATE=$(curl -fsS "http://prometheus/api/v1/query?query=..." | jq '...')
          # Fail the workflow if SLO breached
          awk -v r="$RATE" 'BEGIN { exit (r < 0.99) }'
```

### 2. Running chaos in shared environments
A pod-kill experiment on the shared staging cluster breaks OTHER teams.
Use labels + selectors to target ONLY your service's pods.

### 3. No baseline
Always assert SLO is GREEN before starting chaos. If SLO is already red,
the experiment tells you nothing new.

### 4. Chaos Mesh permissions
Chaos Mesh needs broad K8s permissions (pod-kill requires delete on
pods). Scope its RBAC to specific namespaces, never cluster-wide in
production.

### 5. Pushing chaos in prod too early
Netflix runs chaos in prod because their systems survived years of it.
Yours probably won't. Run chaos in staging until you get consistent
passes; THEN promote to prod in controlled windows.

## CI integration

```yaml
- name: Chaos resilience workflow (nightly)
  run: |
    kubectl apply -f infra/chaos-mesh/workflow-managed-resource-resilience.yaml
    # Wait for completion
    kubectl wait --for=condition=Completed workflow/managed-resource-resilience --timeout=30m
  if: github.event_name == 'schedule'
```

## Signal it produces

- **Workflow pass/fail** (did SLO hold during chaos?)
- **Grafana overlay** showing the chaos window on your latency graphs
- **Detailed event log** of what was injected when
- **Pod restart counts** during experiments

## Graduation criteria

- [ ] Chaos Mesh installed in staging
- [ ] At least 3 experiment types (pod-kill, network-delay, stress)
- [ ] Experiments composed into a workflow with SLO gates
- [ ] Runs on a schedule (nightly / weekly)
- [ ] Failed experiments page on-call
- [ ] Baseline SLO check BEFORE each experiment
- [ ] Post-experiment SLO check verifies recovery

## Further reading

- [Principles of Chaos Engineering](https://principlesofchaos.org/)
- [Chaos Mesh docs](https://chaos-mesh.org/)
- [Netflix — "Chaos Engineering" book](https://www.oreilly.com/library/view/chaos-engineering/9781491988459/)
- [Our case study — 4 experiments + composite workflow](../case-studies/sylphx-managed-resource-controller.md#chaos-engineering)
