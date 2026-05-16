---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Dead-Letter Queues

A dead-letter queue (DLQ) is a secondary queue where messages land when they can't be successfully processed after repeated attempts. It's the answer to "what happens to a message that keeps failing?" — instead of losing it silently or blocking the main queue forever, you quarantine it somewhere observable.

### The Core Mechanism

Most message brokers (SQS, RabbitMQ, Kafka, etc.) let you configure a retry policy: try delivery N times, and if all attempts fail, route the message to a DLQ rather than discarding it. The broker handles this automatically — your consumer doesn't need to explicitly send messages there.

"Failure" is typically defined as:
- The consumer explicitly rejects/nacks the message
- The consumer crashes without acknowledging
- A visibility timeout expires (the consumer took too long)
- The message exceeds a max receive count

The key property is that the original message is preserved exactly — no mutation, full payload, usually with metadata about why it failed and how many times.

### Mental Model

Think of it like a hospital triage system. The main queue is the ER intake line. When a patient (message) can't be treated (processed) repeatedly, you don't keep cycling them through intake — you move them to a holding ward (DLQ) for a specialist to investigate. The holding ward doesn't treat anyone; it just stores problem cases so the main intake doesn't grind to a halt.

### Practical Scenarios

**Backend:** You have an order processing service consuming from a queue. A specific order message causes a NullPointerException because it has a malformed `shippingAddress` field — some upstream service sent bad data. Without a DLQ, this message retries forever, consuming worker threads, potentially causing backpressure upstream, and masking the real bug. With a DLQ, it gets quarantined after 3 attempts, your main queue stays healthy, and you have an alert on DLQ depth that pages you with the exact payload to debug.

**SRE:** DLQ depth becomes a meaningful SLI. A DLQ that's normally empty but suddenly has 500 messages is a canary — something systemic is wrong (bad deploy, schema change, downstream dependency down). You can alarm on `dlq.message_count > 0` as a leading indicator before user-facing errors spike. It also enables safe replay: once you fix the root cause, you re-drive messages from the DLQ back to the main queue rather than asking users to resubmit.

### The Nuance

A DLQ doesn't fix poison pill messages on its own — it just prevents them from destroying throughput. You still need a process for draining the DLQ: inspect, fix the consumer or the data, then replay. Without that operational loop, the DLQ becomes a graveyard that grows silently. This is where the connection to at-least-once delivery matters: the guarantee only holds if you actually process DLQ messages eventually.
