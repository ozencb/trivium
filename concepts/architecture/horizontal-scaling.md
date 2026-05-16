---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Horizontal Scaling

Adding more machines to handle more load — rather than making one machine bigger. The key insight is that this shifts your bottleneck from hardware limits to distributed systems problems.

### The core mechanism

Vertical scaling (bigger machine) hits a ceiling: there's only so much RAM and CPU you can throw at one box, it gets expensive fast, and a single point of failure remains. Horizontal scaling sidesteps that ceiling by running multiple identical instances behind a load balancer. Each instance handles a slice of traffic independently.

The prerequisite is statelessness. If instance A handles a user's login and stores session data in memory, instance B can't serve that user's next request. Once you've moved state out-of-process — to a database, Redis, a cookie — any instance becomes interchangeable, and you can spin up 2 or 200 of them without coordination logic.

### Mental model

Think of it like checkout lanes at a grocery store. One cashier with superhuman speed (vertical) eventually maxes out. Opening more lanes (horizontal) scales linearly — until you hit the shared constraint: the one inventory system, the one card terminal vendor, the one store manager. That's your stateful bottleneck surfacing.

### Practical implications by role

**Backend:** Your service needs to be written for this from the start. No in-process caches that diverge across instances, no file system state, no singleton counters. Distributed locks, external session stores, and idempotent endpoints become load-bearing. When you add the 5th replica and suddenly see duplicate job processing, that's horizontal scaling making a latent statefulness bug visible.

**SRE:** Horizontal scaling is what makes your SLOs survivable. Losing one of ten instances means 10% capacity degradation, not an outage. But it introduces new failure modes: thundering herd when all instances restart simultaneously, partial deploys catching traffic mid-rollout, health check tuning to ensure load balancers shed bad instances fast enough. Your runbooks need to distinguish "one instance is sick" from "the whole fleet is sick."

**DevOps/Platform:** You need autoscaling policies (CPU? RPS? queue depth?) and the infrastructure to make instance launch fast enough to matter. If a spike takes 4 minutes to trigger and provision a new instance, you scaled too late. The other half of the job is scale-*in* — removing instances without dropping in-flight requests, which means graceful shutdown and connection draining.

### Why it unlocks Database Sharding

Once your application tier scales horizontally, the database becomes the next bottleneck — it's still one stateful thing handling all reads and writes. Sharding is horizontal scaling applied to the data layer: partitioning data across multiple database nodes so no single node holds everything. The same tradeoffs reappear at a lower level.
