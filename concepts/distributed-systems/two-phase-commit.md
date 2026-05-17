---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Two-Phase Commit (2PC)

2PC is the classic answer to "how do I atomically commit a transaction across multiple nodes?" — either every participant commits or none do. It's the foundation of distributed transactions, but its failure modes explain why most modern systems avoid it.

### The Mechanism

The protocol has a **coordinator** orchestrating **cohorts** (the participant nodes) through two rounds:

**Phase 1 — Prepare:** The coordinator sends a `PREPARE` to all cohorts. Each cohort writes the transaction to its WAL (making it durable), acquires locks on affected rows, and votes `YES` or `NO`. A `YES` vote is a binding promise: "I can commit this and will hold my locks until told otherwise."

**Phase 2 — Commit/Abort:** If all votes are `YES`, the coordinator writes `COMMIT` to its own log, then broadcasts `COMMIT` to cohorts. If any `NO`, it broadcasts `ABORT`. Cohorts release locks and acknowledge.

The invariant: once a cohort votes `YES`, it has surrendered its autonomy. It cannot unilaterally abort. It must wait for the coordinator's decision, indefinitely if necessary.

### The Mental Model

Think of it like a wedding officiant asking "does anyone object?" If someone objects, the whole thing stops. If no one does, everyone is bound. But here's the problem: if the officiant passes out right after everyone says "I do" but before announcing "you're married," all guests are frozen in place — cannot leave, cannot proceed — until the officiant recovers. That freeze is the **blocking problem**.

### Why It Breaks

Coordinator failure after Phase 1 completion but before Phase 2 puts cohorts in an uncertain state. They've voted `YES` and are holding locks. They can't commit (never received the decision). They can't abort (they promised they wouldn't). The cohorts are **blocked** — live but stuck — until the coordinator recovers or a human intervenes. This isn't a theoretical edge case; any coordinator restart or network partition triggers it.

### Practical Relevance

**Backend:** Distributed databases like CockroachDB and Spanner implement 2PC internally (often layered on Paxos for coordinator durability), which is why cross-shard writes are expensive. When you see latency spikes on multi-shard transactions, you're paying the lock-hold cost of Phase 1 wait time.

**Data:** ETL pipelines that write to multiple systems (e.g., updating a warehouse and a stream simultaneously) sometimes use 2PC via XA transactions. The blocking risk is why most data engineers prefer idempotent sagas with compensating transactions — fail fast and retry, rather than hold locks waiting for a coordinator that may never return.

**Interview signal:** Understanding that 2PC's problem is *blocking on uncertainty*, not just "coordinator failure," is what separates someone who's read about it from someone who's reasoned through distributed failure modes. Sagas trade atomicity for availability by replacing the "hold locks and wait" model with explicit compensation — a fundamentally different reliability contract.
