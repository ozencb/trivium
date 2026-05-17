---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Message Replay

Message replay is the ability to re-read messages from a durable log starting at any committed offset, not just from the tail. It's what separates a message broker from a simple queue: messages aren't destroyed on consumption, so any consumer can rewind and re-process history on demand.

**The core mechanism**

In Kafka, each partition maintains an ordered, immutable log of messages with monotonically increasing offsets. Consumer groups track their position (committed offset) per partition independently of the log itself. Replay is just resetting that offset — to `earliest`, to a specific timestamp, or to an exact offset — and letting the consumer read forward again. The broker doesn't care; it serves any valid offset range within its retention window.

This means replay is fundamentally a consumer-side concern. The producer and broker are unaware it's happening. Multiple consumer groups can replay the same log simultaneously without interfering with each other or with live consumers.

**Mental model**

Think of the log as a Git commit history and consumer offsets as branch pointers. You can `git checkout` any past commit to inspect or replay from there; the history doesn't change, and other branches aren't affected. Replay is moving your pointer backward, then letting it advance forward again.

**Where this matters in practice**

*Backend:* You deploy a bug fix for a payment processing consumer that miscalculated fees for three days. Instead of writing a one-off migration script against the database — which requires knowing exactly what state to correct — you reset the consumer group's offset to three days ago and reprocess. The correct logic runs against the original events, producing the correct side effects. This only works cleanly if your consumer is idempotent; since Kafka gives you at-least-once delivery, you're already handling duplicate message IDs, so replay typically slots in without extra infrastructure.

*Data:* A new analytics pipeline needs six months of event history to bootstrap its aggregations. Rather than ETL-ing from a data warehouse, you point it at Kafka with `auto.offset.reset=earliest` and let it consume from the beginning of retention. Similarly, when adding a new derived table or feature store, replay lets you backfill from the canonical event log rather than approximating from snapshots.

**Common pitfalls**

Replay exposes assumptions about idempotency fast. Consumers that trigger emails, charge cards, or increment counters without deduplication will fire those side effects again. Check your downstream effects before replaying in production.

Retention limits what's replayable. If your use case requires replaying beyond the retention window, you need a separate long-term store (S3 + Kafka tiered storage, or an event store) — retention is not a backup strategy.

Finally, replay under load can starve live consumers if the replaying group consumes aggressively on shared partitions. Throttling consumer fetch rates or using a separate consumer group with explicit lag monitoring avoids this.
