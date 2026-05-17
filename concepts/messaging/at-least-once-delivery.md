---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## At-Least-Once Delivery

The guarantee is simple: your message will be processed *at minimum* once. The consequence is equally simple: it might be processed more than once, so every consumer must handle duplicates gracefully.

**Core Mechanism**

The broker holds a message in an "unacknowledged" state until the consumer sends an explicit ACK. If the consumer crashes after processing but before ACKing—or the network drops the ACK itself—the broker can't distinguish "processed but ACK lost" from "never processed." So it retries. This is the fundamental asymmetry: the broker can only prove delivery when it receives confirmation, but it can never prove a message *wasn't* already processed.

The retry window is the operative concept. In SQS it's the visibility timeout; in Kafka it's the session timeout plus heartbeat interval. When a consumer takes a message, the broker starts a clock. If it expires without an ACK, the message becomes available again. GC pauses, slow I/O, and network hiccups all create the window where duplicates emerge.

**Mental Model**

A postal service that keeps re-sending until you sign for it. If you were out for the first delivery but home for the second, you now have two packages—and the courier has no idea you already opened the first one.

**Practical Scenarios**

*Backend:* You're processing a payment webhook. The provider retries on non-2xx responses. Your handler charges the card, then throws before returning 200—provider retries, customer is double-charged. Standard fix: store the webhook ID and short-circuit if already seen. This is why idempotency isn't optional here, it's load-bearing.

*SRE:* At-least-once is your friend during rolling restarts—re-deliveries are fine if consumers are idempotent. The failure mode to watch is visibility timeout tuned too low relative to p99 processing time. Under load, legitimate slow consumers start appearing "dead" to the broker, triggering duplicate storms that look like a traffic spike but are actually a configuration problem.

*Data:* ETL pipelines almost always run on at-least-once semantics. A deduplication step keyed on event ID or a deterministic payload hash is standard practice. Without it, aggregations double-count in ways that surface as subtle analytics drift—often not caught until someone asks why revenue is up 3% this quarter.

**Why Not Just Use Exactly-Once?**

Exactly-once requires coordination between broker and consumer—distributed transactions, or Kafka's idempotent producers plus transactional consumers. That's expensive coordination overhead on every message. At-least-once is cheap: the broker just needs a timeout and retry logic. The tradeoff is pushing the deduplication burden to the consumer, which is usually acceptable because consumers typically have access to a database that can enforce uniqueness cheaply.
