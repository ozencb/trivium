---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Retry with Exponential Backoff

When a downstream call fails transiently—a 503, a timeout, a connection reset—the instinct is to retry. The problem is that a naive immediate retry from every caller in your fleet hits the struggling service with the same load that just broke it. Exponential backoff with jitter is how you retry without becoming part of the problem.

**The mechanism**

The delay formula is typically `min(cap, base * 2^attempt)`. Attempt 1 waits 1s, attempt 2 waits 2s, attempt 3 waits 4s, capped at something like 30s. The cap matters—without it, after enough failures you'd wait hours.

Jitter is the part most people skip, and it's the part that actually matters at scale. Without it, 500 clients that all failed at `t=0` will all retry at `t=1s`, then `t=2s`—synchronized waves hitting the recovering service in lockstep. With full jitter (`random(0, delay)`), those 500 retries spread across each window instead of concentrating. The peak load drops by roughly the number of clients. A service that could recover under gradual load gets a chance to breathe instead of getting hammered back down.

**Concrete mental model**

Imagine a restaurant that's briefly overwhelmed. If every waiting customer storms back to the host stand at the same second, the situation gets worse. If each person independently picks a random time in the next few minutes to check back, the host stand clears naturally.

**Practical scenarios**

*Backend:* Third-party HTTP calls (Stripe, SendGrid, S3) are the canonical case. Most SDK clients don't implement jitter by default—check yours. Also: make sure the operation is idempotent before retrying, which you already understand.

*SRE:* Thundering herd at service startup is a real failure mode. If 50 pods spin up simultaneously after a deploy and all immediately try connecting to a recovering dependency, they can tip it back over. Backoff with jitter on startup connection logic prevents this.

*Fullstack:* Browser clients retrying failed API calls should use jitter too. A 30-second CDN outage can produce a synchronized retry spike precise enough to trigger your rate limiter the moment service resumes.

**What this doesn't solve**

Backoff handles per-request retry behavior, but it doesn't account for the *aggregate* health of a dependency across many callers. If a service is down for 10 minutes, every caller will still exhaust their retry budget independently—burning threads and accumulating tail latency the whole time. That's the gap the Circuit Breaker pattern fills: tracking dependency health at the system level and short-circuiting calls before they even attempt.
