---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Backoff Algorithms

You already know exponential backoff conceptually—wait longer between retries, with delays growing geometrically. The deeper story is *why the exact formula matters* and how naive implementations can make outages worse.

### The core problem exponential solves

When a service fails, every client that was mid-request fails at roughly the same moment. Without backoff, they retry immediately—wave after wave hitting an already-struggling service, preventing recovery. Exponential growth (`wait = base * 2^attempt`) works because it naturally staggers retries across time as attempt counts diverge. But there's a catch: clients that started failing at the same time still have identical attempt counts, so they retry in lockstep. You get spikes every 1s, 2s, 4s, 8s—coordinated retry storms.

### Jitter breaks the synchronization

Adding randomness to the delay desynchronizes clients. The naive form—`wait = random(0, base * 2^attempt)`—helps, but AWS's research identified a better approach: **decorrelated jitter**.

```
sleep = min(cap, random(base, prev_sleep * 3))
```

Each client's delay is derived from its *own previous delay*, not a shared formula. This produces a much flatter distribution of retries across time, which is what you actually want under load.

The intuition: if 1000 clients all compute `random(0, 8s)`, you still get ~125 clients retrying in each 1-second window. With decorrelated jitter, the distribution self-spreads more aggressively because each client's history diverges.

### What this looks like in practice

**Backend services**: When your service calls a flaky downstream (database, third-party API), the retry logic should be decorrelated-jitter exponential with a cap—something like max 30s. The cap prevents a single client from waiting absurdly long; the jitter prevents clients from pile-driving a recovering service. Without the cap, a client that's been retrying for 10 minutes has an unbounded delay formula.

**SRE/incidents**: The thundering herd isn't just a retry problem—it's why bringing a service back up after a full outage is dangerous. You restore the service, every queued client retries, and you immediately re-saturate it. Understanding backoff algorithms tells you *why* you should rate-limit traffic on the way back up, not just restore capacity. It also explains why circuit breakers and backoff are complementary: the circuit breaker stops new attempts, backoff governs how fast old ones resume.

### The pitfall most implementations get wrong

Resetting the backoff on reconnect without tracking *why* the connection closed. If a client successfully connects but immediately gets a 503, and it resets its retry counter to zero, it'll hammer the service with short delays thinking it's making progress. Track success at the *transaction* level, not the connection level.

For greenfield work, reach for a library that implements these algorithms correctly (most retry libraries do). For debugging production incidents, knowing this theory tells you exactly where to look in the retry configuration.
