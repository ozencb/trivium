---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

The token bucket algorithm solves a real tension in rate limiting: you want to enforce a sustained throughput ceiling without penalizing callers who batch work or experience natural bursts. It does this by separating *instantaneous capacity* from *long-term rate*.

## The Mechanism

The bucket holds tokens up to a fixed capacity. A refill process adds tokens at a constant rate (e.g., 100/second). Each incoming request consumes one or more tokens. If tokens are available, the request proceeds; if not, it's rejected or queued. That's it.

The key insight is that the bucket's capacity and the refill rate are independent knobs. The refill rate sets your sustained throughput ceiling—no matter how you arrange your requests, you can't exceed it over time. The bucket capacity controls how large a burst you can absorb before that ceiling kicks in.

## Mental Model

Think of it as a leaky bucket in reverse: instead of water draining out, tokens drip in. You can let tokens accumulate (up to capacity), then spend them all at once. A bucket with capacity 1000 and refill rate 100/sec means a caller who's been idle for 10 seconds can fire 1000 requests immediately—then they're rate-limited to 100/sec going forward.

## Practical Scenarios

**Backend**: API gateways use this to give clients predictable burst allowances. A well-behaved client that polls occasionally gets to burst when they need it. The naive "fixed window" alternative penalizes bursty-but-reasonable usage—token bucket doesn't. Redis is the common distributed store for token counts, using Lua scripts for atomic check-and-decrement.

**SRE**: When protecting downstream services, token bucket lets you tune blast radius. If your database can handle 500 sustained QPS but tolerates short spikes to 2000, you set those as separate parameters. You're not just throttling—you're codifying your service's actual capacity contract. This pairs well with circuit breakers: the breaker opens on sustained overload, but token bucket handles normal variance before you get there.

## Common Pitfalls

- **Clock skew in distributed systems**: If each node refills independently, you'll exceed your intended aggregate rate. Use a shared store or a token-bucket sidecar.
- **Bucket capacity too large**: Clients can accumulate a 10-minute worth of burst allowance and dump it all at once, overwhelming downstreams even though the "rate limit" looks fine.
- **Treating rejection as the only outcome**: Many implementations should *queue* rather than reject when tokens run out, especially for background jobs. Rejection is right for latency-sensitive APIs; queuing is right for batch workloads.

Reach for token bucket when your callers have legitimate burst patterns and you want to be permissive about them without giving up the sustained rate guarantee.
