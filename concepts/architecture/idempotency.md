---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Idempotency

An operation is idempotent if applying it multiple times produces the same result as applying it once. This matters because you already know at-least-once delivery guarantees duplicates — idempotency is how you make those duplicates harmless without coordinating at the transport layer.

### The Core Mechanism

Idempotency isn't about deduplicating the *call* — it's about making the *effect* safe to repeat. Two approaches:

**Natural idempotency**: some operations are inherently safe to repeat. `SET status = 'verified'` is idempotent; `SET login_count = login_count + 1` is not. The question to ask: does the second execution change anything the first didn't?

**Idempotency keys**: for operations that aren't naturally idempotent, the client generates a unique ID (UUID) per logical operation and sends it with each attempt. The server records processed keys and their results — on a duplicate, it returns the cached result instead of re-executing.

Mental model: a light switch labeled ON/OFF is idempotent — flipping to ON twice leaves you in the same state. A toggle switch is not — two presses undoes the first.

### Backend

Payment processing is the canonical example. Stripe requires idempotency keys precisely because payment requests time out. Without one: did the charge go through? Retry and risk a double charge. With one: retry freely — the server returns the original response if it already processed that key.

Database writes: `INSERT ... ON CONFLICT DO NOTHING` with a natural unique key makes bulk ingestion pipelines safe to replay. This matters when reprocessing a Kafka partition after a consumer crash — you replay from the last committed offset, duplicates included.

Message consumers: if your consumer handler is idempotent, you decouple correctness from broker-level delivery guarantees. Processing a message twice has no effect, so you never need to pause and ask "did this already run?"

### Fullstack

Form submissions: generate a submission token server-side when rendering the form, embed it as a hidden field. The backend deduplicates on it. Double-clicks and browser retries become safe — the second request is a no-op.

Optimistic UI mutations: when a mutation fails and you retry, an idempotent endpoint means you don't need to first check whether the original attempt actually succeeded. Retry unconditionally.

### The Connection Forward

Exactly-once delivery at the infrastructure level is either impossible or requires expensive coordination (two-phase commit, distributed transactions). Idempotency lets you accept at-least-once at the transport layer and achieve effectively-once *outcomes* at the application layer. That's the practical trade-off the industry settled on.
