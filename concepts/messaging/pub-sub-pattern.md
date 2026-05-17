---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Publish-Subscribe Pattern

Pub/sub decouples the *who* from the *what*: a publisher emits an event describing something that happened, and zero-to-many subscribers independently decide what to do about it. Unlike a message queue where a message targets a specific consumer and gets consumed once, pub/sub is a broadcast — the event is delivered to all interested parties.

### The Core Mechanism

The central invariant is **topic-based routing without addressability**. A publisher doesn't know who's listening, doesn't care how many listeners exist, and doesn't change its behavior based on that. The broker (Kafka, SNS, Redis Pub/Sub, etc.) holds the routing table. Subscribers register interest in a topic, the broker fans out each message to all active subscriptions.

This creates an asymmetry worth internalizing: publishers are stateless about consumers, but brokers must maintain subscription state. That's where delivery guarantees, durability, and ordering semantics live — not in the publisher.

**A useful mental model:** a newspaper. The publisher prints one edition and distributes it. Each subscriber gets their own copy. The newspaper doesn't track what you do with it, and adding a million new subscribers doesn't change how the newspaper is written.

### Where the Complexity Actually Lives

The pattern looks simple until you need at-least-once delivery with multiple subscriber *types* that have different processing rates. Now you need the broker to persist messages (Kafka's log, SNS+SQS for fan-out), handle redelivery on failure, and manage subscriber offsets independently. The "decoupling" you gained on the write side reappears as operational complexity on the broker.

### Practical Scenarios

**Backend:** User signup fires a `user.created` event. Email service, analytics, onboarding workflow, and fraud detection all subscribe independently. Adding a new reaction means deploying a new subscriber — the signup service is untouched.

**SRE:** Alert fan-out. A single alerting event hits PagerDuty, Slack, a logging system, and an auto-remediation service simultaneously. Without pub/sub, the alerting pipeline has to know about all four sinks and grows with every integration.

**Data:** CDC (change data capture) events from a database are published to a topic. A real-time analytics pipeline, a search index updater, and a cache invalidation service each subscribe. The DB doesn't change; downstream consumers evolve independently.

**Fullstack:** A WebSocket gateway subscribes to a `notifications` topic. When any backend service publishes a notification event, the gateway pushes to the right connected client. The backend services don't need WebSocket logic.

### When to Reach for It

Use pub/sub when you have one producer and multiple independent consumers, when consumers should evolve without touching the producer, or when you need fan-out semantics. Avoid it when you need exactly-one processing semantics with no fan-out (that's a queue), or when the publisher genuinely needs to know the result (that's RPC).
