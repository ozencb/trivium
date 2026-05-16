---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Jitter in Retries

Exponential backoff staggers retries over time, but when many clients fail simultaneously, they stay synchronized — all retrying at the same intervals, creating coordinated thundering herds. Jitter breaks that synchronization by introducing randomness into retry delays.

### The core problem

Imagine 500 clients connected to a service that goes down for 20 seconds. With pure exponential backoff (base 1s, multiplier 2), every client retries at ~1s, ~2s, ~4s after the failure. When the service comes back up, it faces three synchronized spikes in quick succession — exactly the scenario most likely to prevent recovery. The clients aren't being malicious; they're just deterministic in the same way.

Jitter dissolves this by making each client's retry interval independently random within a window.

### How it actually works

The simplest form — **full jitter** — replaces the computed delay with a uniform random value between 0 and that delay:

```
delay = random(0, min(cap, base * 2^attempt))
```

This spreads retries roughly uniformly across the window, converting synchronized spikes into a steady (manageable) drizzle of requests.

**Equal jitter** is more conservative: it guarantees at least half the computed delay, adding randomness only to the upper half. Useful when you want a floor on retry spacing to avoid thrashing.

**Decorrelated jitter** (from Marc Brooker's AWS paper) is subtler — each retry's sleep is derived from the *previous* sleep rather than the attempt count, which naturally decorrelates clients even without shared state:

```
sleep = min(cap, random(base, previous_sleep * 3))
```

This produces the best distribution under heavy load at the cost of being slightly harder to reason about.

### Mental model

Think of it like a crowded train platform where everyone's watch shows the same time. When the train arrives, everyone rushes at once. Jitter is like making everyone's watch slightly wrong in a random direction — the crowd spreads out naturally without any central coordination.

### Practical scenarios

**Backend**: Any client calling a downstream service (database, payment processor, third-party API) should add jitter to retries. Without it, a single brief network hiccup causes a coordinated retry storm that can cascade into a sustained outage. This is especially acute in microservice architectures where multiple replicas of the same service all fail simultaneously.

**SRE**: Jitter shows up in dashboards as the difference between a clean sawtooth pattern (no jitter — bad sign during incidents) and a smooth curve (jitter working as intended). When writing runbooks, "retry in 30 seconds" is dangerous advice for distributed systems — you're inadvertently programming humans to create thundering herds. The runbook should say "retry in 20–40 seconds" or let the client library handle it.

One often-overlooked place: scheduled jobs (cron, batch workers). If 50 instances of a job all start at :00 and hit the same resource, adding startup jitter (`sleep random(0, 30)`) at launch is cheap insurance.
