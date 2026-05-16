---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Token Bucket Algorithm

Token bucket is a rate limiting mechanism that allows **controlled bursting** — it enforces a sustained rate limit while permitting short-term traffic spikes up to a configurable ceiling.

### The core mechanism

Imagine a bucket with a maximum capacity of N tokens. Tokens are added at a fixed refill rate (e.g., 100/second). Each incoming request consumes one token. If the bucket has tokens, the request proceeds. If it's empty, the request is rejected (or queued, depending on your semantics).

Two parameters define the behavior:
- **Refill rate** — the sustained throughput you're willing to allow
- **Bucket capacity** — the maximum burst you'll absorb

These are independent. A bucket of capacity 500 with a refill rate of 100/sec means: you can handle 500 requests instantly, but you'll only sustain 100/sec over time. The bucket empties during bursts and refills between them.

### Mental model

Think of it like a prepaid phone: credits accumulate while idle (up to a cap), and you spend them when you make calls. You can burn a week's credits in one long call, but you can't borrow against the future.

This is the key distinction from the **leaky bucket** algorithm, which enforces a strictly smooth output rate — no bursting allowed. Token bucket is more permissive and more realistic for real traffic patterns.

### Backend context

When you're rate limiting an API by user or API key, token bucket gives you the right tradeoffs. A legitimate client doing a batch import at startup shouldn't be punished the same way as a client hammering you in a tight loop. You grant them a burst budget (the bucket), then they're throttled to the sustained limit once it's drained.

Implementation is also cheap: store `{tokens, last_refill_time}` per key in Redis. On each request, calculate elapsed time, add the appropriate tokens (capped at max), then attempt to decrement. This is a standard atomic Lua script in Redis — no locks needed.

### SRE context

Token bucket is widely used for **traffic shaping at ingress** — Envoy, nginx, and most API gateways implement it natively. When a downstream dependency has a known throughput ceiling, you attach a token bucket at the call site to avoid overwhelming it during recovery (the classic thundering herd after an outage). The bucket capacity absorbs the initial reconnect surge; the refill rate keeps steady-state load within safe bounds.

It also maps cleanly onto **quota systems**: give each customer a monthly token pool that refills hourly. Same algorithm, different time scale.
