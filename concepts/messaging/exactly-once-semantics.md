---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Exactly-Once Semantics

Exactly-once semantics guarantees that a message produces its side effect precisely once, even across crashes, retries, and network failures. It's the hardest delivery guarantee to achieve because it can't be solved at the transport layer alone — the messaging system and the processing logic must cooperate.

### Why transport alone isn't enough

You already know at-least-once delivery means retrying until you get an ack, which risks duplicates. The naive fix — "just make operations idempotent" — handles many cases but not all. Idempotency protects the *processing* side, but you still have a race: what if your service crashes after processing a message but before committing the offset? You've done the work, but the broker thinks you haven't, so it redelivers. Your idempotent handler may be fine, but you've wasted work and possibly hit downstream systems twice.

True exactly-once requires **atomic coupling of processing and acknowledgment** — the "I processed this" and "I advanced past this" must either both happen or neither happens.

### How Kafka does it (the canonical implementation)

Kafka achieves this with two mechanisms working together:

1. **Idempotent producer**: Each producer gets a `producer_id` and attaches a monotonic sequence number to every batch. The broker deduplicates retries using this, so even if a producer retransmits after a timeout, the broker accepts it only once.

2. **Transactional API**: Kafka wraps the entire read-process-write cycle in a transaction. You atomically commit: your output records *and* your consumer group offset. If the transaction aborts (crash, timeout), neither the output nor the offset advance. On retry, the consumer re-reads from the same offset and re-produces the same output — which the broker deduplicates again.

Mental model: imagine a database transaction where `BEGIN` marks where you last left off, and `COMMIT` both writes your results and moves your bookmark. Retry always starts from the bookmark.

### Practical scenarios

**Backend — payment processing**: A charge service consumes events from a queue. Without exactly-once, a crash between charging and committing the offset means the event redelivers and you charge the customer twice. With transactional Kafka (or equivalent), the charge record and the offset commit are atomic — no double-charge even if the pod dies mid-flight.

**Data — stream aggregations**: You're summing order totals per region in Kafka Streams. A partition rebalance mid-window causes the task to restart. Without exactly-once, partial state gets reprocessed and counts inflate. With it, the state store checkpoints and offset commits are transactional, so restarts resume cleanly without double-counting.

### The cost

Exactly-once adds latency (transactions require coordination) and reduces throughput. It also only holds *within* the system boundary — if your Kafka consumer writes to Postgres and S3 in the same logical transaction, you're now coordinating across systems that don't share a transaction log. That's where two-phase commit or idempotency-at-the-destination becomes necessary again.
