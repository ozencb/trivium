---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Load Shedding

When a system reaches capacity, serving all traffic equally sounds fair but is actually the worst outcome — everything degrades together, latency spikes for everyone, and you risk cascading failure. Load shedding inverts this: you deliberately reject a subset of requests so the requests you do accept get full quality of service.

### The Core Mechanism

Load shedding is admission control at the system level. Rather than letting requests queue up and consume resources until the whole system falls over, you measure a signal (queue depth, CPU, latency percentile, connection count) and once it crosses a threshold, you start rejecting incoming work fast — typically with a 503 and no body, burning as few resources as possible.

The key word is *prioritization*. A naive implementation sheds randomly. A good one assigns every request a priority tier at the boundary — user-facing checkout flow vs. internal analytics ingestion vs. background report generation — and sheds low-priority tiers first. High-priority traffic keeps flowing at full quality; low-priority callers get 503s until capacity recovers.

**Mental model:** ER triage. When the ER is overwhelmed, patients aren't seen in arrival order — a sprained ankle waits while chest pain goes immediately. Load shedding is triage for your infrastructure.

### How It Differs From What You Know

Rate limiting (which you know) constrains individual callers over time. Load shedding responds to the *system's current state*, regardless of who's calling. Circuit breakers protect you from downstream failures; load shedding protects you from your own overload. All three can coexist: circuit breakers catch external degradation, rate limiting prevents abuse, load shedding is the last line of defense for self-preservation.

### Practical Scenarios

**Backend:** You have an API that handles both synchronous user requests and async webhook processing. Under a traffic spike, your thread pool saturates. Without load shedding, webhooks and user requests compete equally, and user P99 latency craters. With load shedding, webhooks get 503'd first — they'll retry with backoff — while user requests continue normally. The webhook queue grows temporarily; the user experience doesn't degrade.

**SRE:** During a partial outage where one region is shedding, you'll see 503 rates spike in dashboards. A common mistake is treating this as an error to fix rather than a protection working as designed. The real signal to watch is whether *high-priority* 503s appear — that means your priority tiers are misconfigured or the system is genuinely past capacity.

### Where Engineers Get It Wrong

- **Shedding too late:** Accepting the request then failing deep in the stack wastes resources. Shed at the edge, before work begins.
- **No priority model defined upfront:** "We'll figure out priorities when we need them" always goes badly under incident pressure.
- **Clients that retry immediately on 503:** Shedding only works if callers respect it. Clients must implement exponential backoff; otherwise you get a retry storm that makes the overload worse.

In a design interview, knowing to distinguish *who gets shed* (priority tiers) from *when shedding kicks in* (the signal and threshold) shows you've thought past the happy path.
