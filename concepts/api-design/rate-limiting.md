---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Rate Limiting

Rate limiting is a traffic control mechanism that enforces ceilings on how many requests a client (or endpoint) can make within a time window. Without it, a single misbehaving or runaway client can saturate your service for everyone else.

### The Core Mechanism

The two dominant algorithms trade off burst tolerance against smoothness:

**Token bucket**: A client starts with a bucket of N tokens. Each request consumes one token; tokens refill at a fixed rate. Bursts are allowed up to the bucket's capacity — a client can make 50 requests at once if they've accumulated 50 tokens. This is what most APIs actually use.

**Leaky bucket**: Requests enter a queue and drain at a fixed rate, regardless of arrival pattern. It completely flattens bursts, which protects downstream dependencies but adds latency for legitimate spiky traffic. Better suited for internal queue-backed services than public APIs.

There's also **fixed window** (count requests per minute, reset at :00) — simple but has a boundary problem: 100 requests at 11:59:59 and 100 at 12:00:01 gives you 200 requests in 2 seconds. **Sliding window** fixes this by tracking a rolling 60-second view, at the cost of more memory per client.

### Concrete Mental Model

Think of token bucket like a subway turnstile with a stored-up balance. If you walk in every day, you can build credit for a day when you need to run. Leaky bucket is a garden hose — the flow out is constant regardless of how hard you're pushing on the tap.

### Practical Patterns

**Backend**: You'll typically implement rate limiting at the API gateway (Nginx, Kong, AWS API Gateway) for coarse-grained protection, plus at the application layer for fine-grained per-user or per-feature control. The critical implementation detail for multi-instance deployments: you need a shared atomic store — Redis with `INCR`/`EXPIRE` is the standard approach. Per-process counters silently multiply your effective limit by instance count.

**SRE**: Rate limiting is your first line of defense against unintentional DDoS — a client with a bug in a retry loop, a build system hammering your artifact registry. Always expose `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` headers. Clients that can read these will back off gracefully; ones that can't will hammer your 429s, which leads to the **retry storm** failure mode: thousands of clients all hit the limit simultaneously, all wait the same duration, all retry at the same moment.

### What Separates Senior Engineers Here

Knowing which layer to rate-limit at: CDN-level blocks volumetric attacks before they hit your origin; gateway-level handles per-key quotas; application-level enforces business rules like per-user tier limits. Each serves a different threat model, and conflating them is a common design mistake.

The algorithm choice also matters: token bucket is the right default for public APIs because it tolerates legitimate burst patterns (batch jobs, mobile sync). Reaching for leaky bucket without a reason usually means you're solving a different problem — overload protection of a slow downstream, not client fairness.
