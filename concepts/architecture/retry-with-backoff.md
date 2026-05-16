---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Retry with Exponential Backoff** is a strategy for recovering from transient failures by retrying requests at increasing time intervals, preventing the retry storm that flat-interval retries create under load.

## The core mechanism

When a request fails, a naive retry fires immediately or on a fixed interval. The problem: if a downstream service is struggling, hammering it with retries at the same rate compounds the problem — you're adding load to a system that's already failing under load.

Exponential backoff solves this by doubling the wait between attempts: 1s, 2s, 4s, 8s, 16s... The math is `min(cap, base * 2^attempt)`. You cap it so retries don't stretch into minutes.

The critical addition is **jitter** — randomizing each interval slightly. Without it, every client that hit the same failure at the same time will retry in lockstep, creating retry waves. With jitter, `sleep = random(0, min(cap, base * 2^attempt))`, clients desynchronize and the downstream load spreads out.

## Mental model

Think of it like a crowded restaurant. If everyone checks back every 30 seconds exactly, the host gets mobbed repeatedly. If each person adds a random few minutes to their wait, traffic smooths out naturally. The restaurant recovers; the synchronized group doesn't let it.

## Practical scenarios

**Backend (service-to-service calls):** You're calling a payment processor that occasionally throttles with 429s. Retrying immediately on a 429 burns your rate limit quota faster. Exponential backoff with jitter means a single transient spike in their load doesn't cascade into your service's error rate — most calls succeed on the second or third attempt, spread across time.

**SRE:** During an incident where a database replica falls behind, hundreds of app servers start seeing read timeouts. Flat-interval retries can turn a recoverable lag spike into a full outage by overwhelming the primary. Backoff gives the replica time to catch up. This is also where you'll tune the cap — you don't want an SLO breach because retries are waiting 64 seconds when 8 would suffice.

**Fullstack:** API calls from the browser to your own backend hit failures during a deploy restart. The client-side retry with backoff means users experience a brief pause rather than an error screen — the backend comes back up within a few seconds and the next retry succeeds. Without backoff, all clients retry instantly and you get a thundering herd on a freshly restarted process.

## Connection to what comes next

Backoff is per-request. It doesn't know whether the downstream system is in a sustained failure mode or just hiccupping. That's the gap Circuit Breaker fills — it tracks failure rates across requests and stops attempting calls entirely when the system looks fundamentally broken, rather than letting every request burn its retry budget.
