---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Replication Lag

Replication lag is the delay between when a write commits on the primary and when it becomes visible on a replica. It's unavoidable in asynchronous replication and the root cause of most "I just saved this, why can't I see it?" bugs.

### The core mechanism

Most replication is asynchronous by default: the primary commits a transaction and acknowledges the client immediately, without waiting for any replica to confirm receipt. The primary then ships the change — as WAL entries in Postgres, binlog events in MySQL — and replicas apply it independently in the background.

Lag accumulates when replicas can't keep up with the write rate. This happens during traffic spikes, after large bulk operations, if the replica is I/O-bound, or simply because of network latency between regions. You can observe it as a byte offset difference between primary and replica log positions, or as a time delta (how far behind the replica is, in seconds).

Replication is inherently serial on the replica side — changes must be applied in order, which means one slow operation (say, a long-running DDL) blocks everything behind it. Even a modern read replica under normal load typically sits 10ms–2s behind; cross-region replicas can be 5–30s behind routinely.

### Mental model

Think of the primary as a cashier processing orders, and the replica as a trainee shadowing them by copying each order into a separate notebook. The trainee is always a few steps behind. If a customer asks the trainee "did my order come through?", the honest answer is "probably, but I might not have written it down yet."

### Practical implications

**Backend:** A user submits a form (write hits primary), gets redirected to a page that fetches from a replica — and sees the old state or a 404. This is the canonical read-your-writes failure. The fix usually involves routing that user's immediate follow-up reads to primary, or adding a short delay, or using synchronous replication for critical paths.

**SRE:** Replica lag is a key signal for write throughput health. A sudden spike often means either the primary is getting hammered or a replica is sick. Monitoring lag (`pg_stat_replication`, `SHOW SLAVE STATUS`) and alerting at thresholds (e.g., >30s) is standard practice. Lagging replicas that serve traffic silently degrade user experience before anything "breaks."

**Data:** Analytical queries running against read replicas can return subtly wrong aggregates during high-write periods. A count taken right after a large batch insert may undercount by thousands. If your pipeline reads from a replica and writes derived data based on that read, you're baking stale assumptions into downstream tables.

This is the foundation for understanding read-your-writes consistency — once you internalize that replicas are eventually consistent by default, the question becomes which strategies you use to bound or hide that gap from users.
