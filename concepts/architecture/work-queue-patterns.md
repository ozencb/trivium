---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Work queues decouple the rate at which work arrives from the rate at which it gets processed. Without this decoupling, a burst of requests either overwhelms your workers or forces you to over-provision them to handle peak load — both are expensive.

**The core mechanism**

A producer drops a work item (a task descriptor, not the actual data) onto a queue and moves on immediately. A pool of workers independently polls or subscribes to that queue, pulling items and processing them. The queue acts as a buffer that absorbs variance. Workers can scale horizontally without any producer awareness — add more workers, throughput goes up, the queue drains faster.

The subtle part is that this isn't just "async processing." The queue provides durability and backpressure. If all workers are busy, items accumulate rather than being dropped or blocking producers. If a worker crashes mid-task, the item stays unacknowledged in the queue and gets redelivered. This is why idempotency is a hard prerequisite — you will process items more than once under failure conditions, and your handlers must tolerate it.

**Concrete model**

Think of an airport security line. Passengers (producers) arrive at variable rates. TSA agents (workers) process at fixed capacity. The queue absorbs the burst. Adding lanes (scaling workers) reduces wait time without changing how passengers arrive or check in. The key insight: the queue's depth is your primary operational signal — it tells you whether your worker pool is keeping up.

**Backend scenarios where this matters**

- **Image/video processing**: An upload endpoint accepts files instantly, enqueues a transcoding job, and returns a job ID. Workers transcode independently. Without this, a 4K video upload holds an HTTP connection open for minutes.
- **Email/notification dispatch**: User action triggers an enqueued notification job. Retries, rate limiting against external providers, and failure isolation all happen in worker-land, not in your request path.
- **ETL pipelines**: Ingestion is fast; transformation is slow and CPU-heavy. A queue between them lets you scale transformers independently and replay on schema changes.

**Pitfalls to watch**

Unbounded queues hide overload — a queue that's always growing means your workers will never catch up; set depth alerts early. Poison pills (malformed items that always fail) can starve a queue if your retry logic lacks a dead-letter destination. And visibility timeouts matter: if processing takes longer than the timeout, you'll get duplicate deliveries, so set timeouts conservatively above your p99 processing time.

This pattern is the prerequisite mental model for distributed task scheduling, where you add concerns like priority, delayed execution, and cross-node coordination on top of the basic queue-worker contract.
