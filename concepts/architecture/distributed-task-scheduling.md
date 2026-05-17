---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Distributed task scheduling is what you get when a work queue grows up: not just "put job on queue, worker picks it up," but a system that owns the full lifecycle — when tasks run, that they run exactly once despite multiple workers, that they retry intelligently on failure, and that they survive the node that claimed them dying mid-execution.

**The core mechanism**

The fundamental problem work queues don't fully solve is *ownership under failure*. A worker claims a task, crashes at 80%, and now you have a task that's neither queued nor complete. Distributed schedulers solve this with lease-based ownership: a worker claims a task by acquiring a time-bounded lock (often backed by something like Redis or etcd). If the heartbeat stops before the lease expires, another worker can claim it. This is your at-least-once guarantee — the same task may execute twice, which is why idempotency is non-negotiable.

On top of leases, schedulers layer deduplication (usually a task ID with a unique constraint somewhere), priority queues, cron-style recurring tasks, and visibility into what's running, stuck, or dead. The trick is coordinating all of this across a fleet of stateless workers without a single point of scheduling authority — which typically means the queue itself holds state, not the workers.

**Mental model**

Think of it like a hospital triage system. Patients (tasks) arrive with priority and metadata. Nurses (workers) claim patients, and if a nurse disappears, the patient gets reassigned — but you don't want two nurses performing the same surgery. The scheduler is the whiteboard everyone reads from, and the lease is the nurse signing out a patient. The hospital (your system) doesn't care which nurse does the work, only that every patient gets seen exactly once.

**Backend**

You reach for this when your async processing outgrows a simple queue. Image processing pipelines, email sending at scale, data export jobs, scheduled report generation — anywhere you have heterogeneous task types with different priorities, retry semantics, or rate limits. The big pitfall: assuming idempotency is someone else's problem. It isn't. Design task handlers to be safe to re-run from the start, always.

**SRE**

From an operations perspective, distributed task schedulers give you observability you never had with raw queues: queue depth by task type, task age, worker throughput, retry rates. When something's wrong — a downstream dependency is slow, a worker pool is undersized — the scheduler surfaces it. The failure mode to watch: thundering herds when a queue backs up and suddenly drains. Workers that all retry simultaneously can DDOS your own database. Exponential backoff with jitter on retries isn't optional.

This is the foundation for workflow orchestration — once you have reliable single-task scheduling, you can chain tasks into DAGs, which is exactly what tools like Temporal and Airflow build on top of.
