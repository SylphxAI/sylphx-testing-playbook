# 28 — Formal Verification (TLA+/Alloy)

> Write a MATHEMATICAL SPEC of your system. A model checker exhaustively explores every reachable state to prove invariants.

**Category:** Frontier
**Effort:** Very High (steep learning curve)
**ROI:** Extreme for concurrent state machines
**Maturity level:** 4

## What it catches

**Concurrency bugs no test can catch.** Race conditions, deadlocks, liveness violations. Model checkers explore all possible interleavings — something an exponentially large test suite still can't do.

## When to use

- Distributed consensus algorithms (Raft, Paxos)
- Transaction / lock managers
- Leader election protocols
- Reconciliation state machines with non-trivial races
- Money flows (payments, ledger)

## Tools

| Tool | Style |
|---|---|
| **TLA+** | Temporal logic, industry standard (Lamport) |
| **Alloy** | Relational, easier first-time UX |
| **P** | Microsoft's actor-based formal language |
| **Coq / Lean 4** | Theorem provers (not just model checkers) |
| **Stately / XState** | 🟡 Visual state machines with some verification |

## Example (TLA+ skeleton)

```
---- MODULE Reconcile ----
VARIABLES status, retryCount

Init ==
  /\ status = "pending"
  /\ retryCount = 0

Next ==
  \/ /\ status = "pending"
     /\ status' = "provisioning"
     /\ UNCHANGED retryCount
  \/ /\ status = "provisioning"
     /\ status' = "synced"
     /\ UNCHANGED retryCount
  \/ /\ status \in {"pending", "provisioning"}
     /\ status' = "failed"
     /\ retryCount' = retryCount + 1

\* INVARIANT: we never skip teardown
NoOrphanDelete ==
  status = "deleted" => PreviousState = "terminating"
====
```

Run TLC model checker to verify `NoOrphanDelete` holds in all reachable states.

## Real-world use

- **AWS** — TLA+ on S3, DynamoDB, EBS
- **MongoDB** — TLA+ on replication protocol
- **Azure** — TLA+ on Cosmos DB

## Further reading

- [Learn TLA+ (Hillel Wayne)](https://learntla.com/)
- [Practical TLA+ (book)](https://www.hillelwayne.com/post/practical-tla/)
- [AWS — "Use of Formal Methods at Amazon Web Services"](https://lamport.azurewebsites.net/tla/formal-methods-amazon.pdf)
