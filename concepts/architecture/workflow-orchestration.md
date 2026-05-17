---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Workflow Orchestration

Durable execution platforms like Temporal and Conductor let you write long-running, multi-step processes as ordinary code while the platform handles every failure mode—retries, crashes, timeouts, and resume-after-restart—without you writing any of that scaffolding. The key value isn't orchestration itself (you can do that with queues); it's that workflow state is persisted between every step, so the process survives arbitrary infrastructure failures transparently.

**The core mechanism**

Temporal treats your workflow code as a *deterministic replay target*. Every activity result is checkpointed to an append-only event log. If the worker process dies mid-execution, the platform replays the workflow history to restore in-memory state—re-running your code, but short-circuiting completed activities by substituting their logged results—then continues from the failure point. Your workflow function runs again, but completed work isn't re-executed.

This means activities must be idempotent (they may be retried), but your orchestration logic doesn't need to be. The framework owns that.

**How this differs from what you already know**

The Saga Pattern gives you a design contract—compensating transactions, rollback semantics—but you still own the state machine, retry logic, and idempotency keys. Distributed Task Scheduling (Celery chains, SQS sequences) can pipeline work, but state lives in your database, and recovering from a mid-chain crash requires explicit resume logic you wrote. Temporal collapses that scaffolding into the platform itself.

**Concrete example**

Order fulfillment: reserve inventory → charge card → notify warehouse → send confirmation. Without durable execution, you'd build a Postgres state machine, retry queues per step, and idempotency tokens for every external call. With Temporal, you write sequential code and the platform handles retries, timeouts, and crash recovery. The failure handling *is* the platform.

**When to reach for it**

Any process spanning more than two steps, touching external services with independent failure modes, and running for seconds to days. Classic fits: payment flows, user onboarding pipelines, data migrations, ML training jobs, anything requiring a human approval gate.

**Pitfalls that will burn you**

- Non-deterministic code in workflow logic breaks replay—timestamps, random values, direct DB calls must live in activities, not the workflow function
- Treating activities as cheap—each is a round-trip to the task queue; design them coarse-grained
- Underestimating operational overhead—Temporal's server cluster is itself a stateful system that needs care

**Why this matters in design discussions**

Proposing Temporal vs. "a state machine in Postgres plus a retry queue" signals you understand where operational complexity actually lives. You're trading platform dependency for eliminating custom resilience code. Knowing when that trade is worth it—and when a simple retry loop suffices—is exactly the kind of judgment call that separates senior engineers in architecture conversations.
