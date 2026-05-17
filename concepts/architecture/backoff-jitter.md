---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Jitter in Retries

When a service goes down and comes back up, every client that failed at the same moment retries at the same moment — because they all computed the same exponential backoff from the same failure timestamp. Jitter breaks that lock-step by adding randomness to retry delays, so a thundering herd of synchronized retries becomes a trickle spread across time.

### The core mechanism

Exponential backoff gives you delay growth: `base * 2^attempt`. Without jitter, 1,000 clients that all failed at T=0 will retry at T=1s, then T=2s, then T=4s — all together. The recovering service gets slammed in synchronized bursts that can knock it back down before it stabilizes.

The two main jitter approaches:

**Full jitter**: `random(0, base * 2^attempt)` — delay is anywhere from zero to the computed max. Aggressive desynchronization, but some clients retry almost immediately.

**Decorrelated jitter** (AWS's recommended approach):
```
sleep = min(cap, random(base, previous_sleep * 3))
```
Each attempt's delay is based on the previous one, with randomness layered in. This tends to produce the smoothest distribution across clients.

The goal in both cases is the same: clients that failed together should not retry together.

### Mental model

Imagine 500 people all reach for a doorknob at exactly the same time. The door can only handle 20 at once. Without jitter, you get waves of 500, 500, 500 trying every few seconds. With jitter, each person waits a random interval and they arrive as a continuous stream — the door never gets overwhelmed again.

### Practical scenarios

**Backend (service-to-service calls)**: If your auth service blips and 300 application servers all fail their token validation at T=0, unjitered retries will hit your auth service with a 300-request spike every `2^n` seconds. With jitter, those 300 retries spread across the next few seconds and the auth service recovers cleanly. This is especially common in k8s deployments where many replicas are doing the same work.

**SRE / incident response**: The thundering herd after a cache invalidation or database failover is a textbook re-outage pattern. If you're postmorteming "the service came back up but went down again immediately," synchronized retries without jitter are often the culprit. Jitter is one of those controls that's cheap to add but only becomes obviously necessary after you've been paged at 2am for a bounce-loop.

### When to reach for it

Any time you have multiple clients retrying the same dependency — which is almost always. It's a two-line change with outsized value. If you're configuring a retry library, jitter is usually a parameter you set, not something you implement. Default to full or decorrelated jitter; "equal jitter" (half the computed value plus a random half) is a reasonable middle ground if you need a minimum delay floor.
