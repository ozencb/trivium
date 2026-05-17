---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Idempotency

Since you already understand at-least-once delivery, you know the uncomfortable truth: in distributed systems, messages get delivered more than once. Idempotency is the property that makes this survivable — an operation you can apply 10 times and get the same outcome as applying it once.

**The core mechanism**

The formal definition is f(f(x)) = f(x). The engineering insight is about *state transitions*, not just return values. An idempotent operation reaches a deterministic final state regardless of how many times it runs. This is subtly different from "returns the same response" — it's about what happens to the system.

Two primary mechanisms:
- **Natural idempotency** — some operations are inherently idempotent. `SET user.status = 'active'` is; `INCREMENT user.login_count` is not.
- **Idempotency keys** — the caller provides a unique identifier for the operation. The server records it. On duplicate delivery, it detects the key, skips re-execution, and returns the original result.

**Mental model**

A hotel room key card. Re-swiping it doesn't check you in again — the system recognizes the request was already fulfilled. The card is the idempotency key; the "already checked in" record is your deduplication store.

**Backend**

Payment processing is the canonical case. A charge request times out — did it go through? With idempotency keys (Stripe does this explicitly), you retry with the same key. The processor either executes it (first time) or returns the committed result (duplicate). Without this, retries cause double charges.

Database write patterns matter too. `INSERT ... ON CONFLICT DO NOTHING` or upsert semantics turn non-idempotent inserts into idempotent ones. When designing event consumers, ask: if this event replays, does my handler produce the same state? If not, you need deduplication logic before the handler runs.

**Fullstack**

On the API boundary, POST endpoints break idempotency by default — PUT and DELETE are spec'd to be idempotent; POST isn't. A common pattern: generate an idempotency key client-side (UUID), send it as a header, let the server deduplicate. This makes "submit order" safe to click twice or retry on network failure.

**Where senior engineers differentiate**

The non-obvious part is *scope*. Idempotency isn't just about the database write — it covers all side effects: emails sent, webhooks fired, downstream services called. A truly idempotent endpoint must make all side effects idempotent, or gate them behind the same deduplication check. Missing one is how double-send bugs happen in production.

This is also the foundation for exactly-once semantics — which isn't really "deliver exactly once" (impossible to guarantee end-to-end), it's "deliver at-least-once, consume idempotently, achieve exactly-once *effect*." That reframe is worth internalizing.
