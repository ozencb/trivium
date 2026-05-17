---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Fixed Window Rate Limiting

Fixed window rate limiting maintains a single counter per client, resetting it on a strict time boundary — every minute at :00, every hour at :00:00. The algorithm is O(1) space per client and trivial to implement, which makes it ubiquitous and also frequently wrong for the use cases people apply it to.

**The mechanism**

Pick a window size (say, 60 seconds) and a limit (say, 100 requests). Store `{count, window_start}` per client. On each request:

1. If `now >= window_start + 60s`, reset: `count = 0, window_start = floor(now / 60s) * 60s`
2. Increment `count`
3. If `count > limit`, reject

The critical invariant: the window is *anchored to clock time*, not to the client's first request. Window boundaries are global and synchronized — 12:00:00, 12:01:00, 12:02:00 — regardless of when a client started sending.

**The boundary burst problem**

Suppose limit = 100/min. A client sends 100 requests at 12:00:59 (last second of window 1) — all pass. At 12:01:00 the counter resets. They send 100 more — all pass again. In two seconds, they've sent 200 requests while your system believes the limit is 100/min. The invariant the algorithm *actually* enforces is "no more than N requests per window," not "no more than N requests per any 60-second span." That's a weaker guarantee than it appears.

**Mental model**

Think of a subway turnstile that resets at midnight. If you're fast, you can walk through 50 times at 11:59pm and 50 times at 12:00am — 100 trips in 2 minutes. The turnstile counts per-day correctly, but the burst was real.

**Practical implications**

*Backend:* This is the right choice when your concern is *quota* rather than *traffic shaping* — e.g., a free-tier API where a user is allowed 10,000 requests per day. Billing windows and quota resets are calendar-aligned anyway, so boundary bursts don't matter much. Where it fails is protecting downstream services from traffic spikes, because bursty traffic patterns (retry storms, polling clients) tend to cluster at window edges.

*SRE:* When you're rate limiting to protect a dependency — a database, a third-party API — fixed windows give you weaker protection than you think. A DDoS-like pattern can reliably double effective throughput by hitting window boundaries. If you're seeing a downstream service spike at predictable intervals (every minute, every hour), check whether you have synchronized fixed windows across a fleet of callers — the boundary resets are likely coordinating the bursts.

**Why it motivates alternatives**

Sliding window log and token bucket both address the 2x burst problem differently: sliding window tracks actual timestamps to enforce a true rolling limit; token bucket smooths requests by filling capacity at a fixed rate. Fixed window is where most people start — understanding its specific failure mode is what makes the tradeoffs of those alternatives legible.
