---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Two-Phase Commit (2PC)

Two-Phase Commit is a distributed coordination protocol that ensures multiple nodes either all commit a transaction or all abort — giving you atomicity across systems that don't share memory or a transaction log.

### The Core Mechanism

There's a single **coordinator** and one or more **participants**. The protocol runs in two rounds:

**Phase 1 — Prepare (Voting)**
The coordinator sends a `PREPARE` message to all participants. Each participant checks whether it *can* commit: it acquires locks, writes to a write-ahead log, and persists enough state that it could commit later even after a crash. It votes `YES` or `NO`. If it votes `YES`, it's making a binding promise — it cannot unilaterally abort after this.

**Phase 2 — Commit or Abort**
If all votes are `YES`, the coordinator sends `COMMIT`. If any vote is `NO` (or a timeout occurs), it sends `ABORT`. Participants execute accordingly and release their locks.

The critical insight: Phase 1 is about *capability and durability*, not execution. A `YES` vote means "I've done enough work that I can always commit if asked." This is what separates 2PC from a naive "ask everyone then decide" approach.

### Mental Model

Think of signing a contract simultaneously across time zones. Phase 1 is everyone saying "I've reviewed, initialed every page, and I'm holding my pen." Phase 2 is everyone signing on cue. If anyone drops their pen in Phase 1, you tear up all copies. The key is that once you've said you're ready, you're not allowed to change your mind unilaterally.

### Where It Gets Painful

2PC has a well-known failure mode: **coordinator failure between phases**. If the coordinator crashes after collecting `YES` votes but before sending `COMMIT`/`ABORT`, participants are stuck holding locks indefinitely — they can't commit (no coordinator decision) and they can't abort (they promised they wouldn't). This is the "blocking" problem, and it's why 3PC and Paxos-based commit protocols exist.

### Practical Scenarios

**Backend:** Any distributed saga that requires strict atomicity — e.g., deducting inventory in Service A and charging a payment in Service B as a single logical transaction. Most message brokers and databases that support XA transactions (PostgreSQL, MySQL, RabbitMQ with XA) implement 2PC under the hood.

**Data:** ETL pipelines writing to multiple sinks (a data warehouse + a cache + an audit log) where you need either all three updated or none. Also central to distributed databases like Google Spanner and CockroachDB, where cross-shard writes use a variant of 2PC coordinated by the transaction's leader.

### Connection to What You Know

If you understand Paxos or Raft, 2PC isn't about reaching consensus on a *value* — it's about reaching consensus on whether a *pre-determined action* can proceed. The decision is already known (commit or abort based on votes); the challenge is durability and delivery of that decision to all participants.
