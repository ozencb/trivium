---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Rate Limiting

Rate limiting controls how many requests a client can make to an API within a time window — it exists because unbounded request rates can exhaust your infrastructure regardless of whether the source is malicious or just a buggy retry loop.

### Core Mechanism

The naive version is a counter: track how many requests a client has made in the current window, reject once they exceed a threshold, reset at window boundary. This works but has a "thundering herd" problem — every client who hit their limit resets at the same second and floods you simultaneously.

More sophisticated approaches avoid this. A **sliding window** tracks request timestamps and counts only those within the last N seconds from *now*, not from an arbitrary clock tick. This smooths traffic but is memory-expensive at scale.

The most practical production approach is the **token bucket** (which you'll explore next): each client has a bucket that fills with tokens at a fixed rate. Each request consumes a token. If the bucket is empty, the request is rejected. This allows short bursts while enforcing a sustained rate ceiling — which maps well to real usage patterns where a client might legitimately fire 10 requests at once then go quiet.

### Concrete Model

Think of a highway on-ramp with a metering light. Cars (requests) queue and get a green light at a controlled interval. Traffic upstream stays predictable. Some on-ramps allow brief bursts during off-peak; others are strict. The highway (your API) doesn't care about individual cars — it cares about aggregate flow.

### Practical Scenarios

**Backend:** You're building a payment API. Without rate limiting, a misconfigured client SDK retrying on 5xx at full speed will hit your payment processor hundreds of times per second, running up costs and potentially creating duplicate charge attempts. Rate limiting per API key stops the blast radius. You respond with `429 Too Many Requests` and a `Retry-After` header — the client knows to back off without guessing.

**SRE:** You're on call. A new client starts hammering the /search endpoint at 10x normal volume — maybe a load test someone forgot to sandbox. Without rate limiting, this degrades latency for all tenants. With it, that client gets throttled at the edge (load balancer or API gateway), your backend never sees the spike, and you get an alert on elevated 429 rates rather than a page for degraded p99 latency. Rate limits are a circuit breaker at the perimeter.

### What Makes It Non-Trivial

The hard part isn't the algorithm — it's *where* you store the counter. Per-process counters break the moment you scale horizontally. You need a shared store (Redis is the standard choice) with atomic increment operations. And you have to decide your limiting key: by IP, by API key, by user ID, by endpoint, or some combination. The wrong granularity either over-throttles legitimate users or lets sophisticated clients evade limits by rotating identities.
