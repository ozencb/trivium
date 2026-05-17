---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Fanout Pattern

Fanout is what happens when pub/sub scales out: one message arrives, and the broker duplicates and delivers it to N independent queues simultaneously. The value isn't just convenience — it's that each consumer gets its own copy, progresses at its own pace, and fails independently without affecting the others.

**The core mechanism**

In a standard pub/sub system, a topic has subscribers. Fanout makes this concrete at the infrastructure level: when a message lands on a topic (SNS, Kafka topic, Redis channel), the broker spawns N delivery paths in parallel. Each downstream queue (SQS, a consumer group, a webhook endpoint) gets a full copy. There's no coordination between consumers — they don't share a cursor or compete for messages. Consumer A being slow doesn't block Consumer B.

This is distinct from a work queue (competing consumers), where multiple workers race to claim the same message. In fanout, every subscriber wins.

**Mental model**

Think of a sports scoreboard API. When a goal is scored, one event gets fanned out to: the push notification service (alerts 50k users), the cache invalidation service (clears stale scorelines), the analytics pipeline (increments counters), and the highlights service (triggers clip extraction). These four systems have nothing to do with each other — they just all care about the same event. Without fanout, the score service would need to know about all four, coupling it to every downstream consumer's contract.

**Where you'll actually reach for this**

*Backend:* User signup is a classic case. The auth service emits `user.created` once. Identity, email, billing, audit log, and A/B assignment services all react independently. Adding a new downstream consumer requires zero changes to the producer. The pattern also handles cache invalidation well — broadcast an invalidation event and let every cache node handle its own eviction.

*Data:* CDC (change data capture) pipelines fanout database row changes to a search index, a data warehouse, and an event archive simultaneously. Kafka is particularly good here — consumer groups let you add a new subscriber without reprocessing history, and each group maintains its own offset.

**Pitfalls**

The failure modes are subtle. If delivery to one subscriber fails and you retry, you may double-deliver to others that already succeeded — idempotency on the consumer side is non-negotiable. Ordering also breaks down: two consumers receiving the same events may process them in different orders if their queues have different backpressure. And fanout amplifies load: one spike in publish rate hits all N consumers simultaneously, so capacity planning needs to account for the multiplier. At very high volumes, the broker itself becomes the bottleneck, not the consumers.

The pattern is most appropriate when you have genuinely independent concerns reacting to the same state change, and least appropriate when consumers need coordinated, transactional behavior — for that, you want a saga or orchestrator instead.
