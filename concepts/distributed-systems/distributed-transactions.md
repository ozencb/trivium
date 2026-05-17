---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Distributed transactions extend the ACID guarantee across multiple independent resources — different databases, services, or message brokers — such that all participants commit or all roll back as one unit. You want this when correctness requires atomicity across boundaries that don't share a write-ahead log.

**The core problem**

You already know 2PC. The deeper issue is what 2PC exposes: in a distributed system, the coordinator and participants can fail independently at any point. The critical vulnerability is the window after a participant votes "yes" but before it receives the final commit/abort decision. During that window, the participant holds locks and can't proceed unilaterally — it's in a "blocking" state. If the coordinator crashes here, participants are stuck until the coordinator recovers. This is the fundamental tension: achieving atomicity requires holding state across nodes, and held state across nodes is a liveness liability.

3PC was designed to eliminate the blocking window by adding a pre-commit phase, making it non-blocking under node failures but still vulnerable to network partitions. XA transactions (used by Java EE, many relational databases) implement a standardized 2PC protocol but inherit its failure modes. In practice, XA is slow — it requires a synchronous round-trip to every participant before each commit — and most cloud-native databases don't support it at all.

**Concrete mental model**

Imagine a payment service and an inventory service with separate databases. An order must debit the account and reserve stock atomically. With 2PC: the coordinator sends PREPARE to both, both lock their rows and vote yes, then the coordinator writes COMMIT to its log and sends COMMIT to both. If the coordinator dies between writing its log and sending the second COMMIT, inventory is committed and payment is stuck in limbo, holding a lock, waiting. Recovery requires replaying the coordinator log — which assumes that log is durable and recoverable.

**Backend scenario**

In microservices, distributed transactions are usually the wrong tool. Services own their data; reaching across service boundaries for a lock couples their failure domains. A payment service that holds an inventory lock while a network partition is ongoing takes down order creation for everyone. The architectural response is to design around eventual consistency — accept that consistency is temporal, use compensating actions, and make operations idempotent.

**Data scenario**

For data pipelines — say, writing atomically to both a PostgreSQL OLTP database and a Kafka topic — XA is theoretically possible but Kafka's transaction support is separate from the database's. The operationally robust answer is the Transactional Outbox Pattern: write to the database and an outbox table in one local transaction, then relay the outbox to Kafka asynchronously. Local transactions are cheap; distributed ones aren't.

**Why this matters in senior design discussions**

The instinct to reach for a distributed transaction is often correct in intent but wrong in execution. Recognizing *why* it's wrong — blocking failure modes, lock amplification, coordinator SPOF — lets you propose Saga or Outbox as first-class alternatives rather than workarounds.
