---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Stateless Processes

Stateless processes treat each request as self-contained: the process holds no memory of prior requests, and any state that must persist lives outside the process boundary entirely. The payoff is that you can route any request to any instance — no sticky sessions, no warm-up dependencies — which makes horizontal scaling a mechanical operation rather than a coordination problem.

### The core mechanism

The invariant is strict: **nothing stored in memory or on local disk can be assumed to survive to the next request.** This means no in-process caches that serve as a source of truth, no local filesystem writes that a later request depends on reading, no session objects hanging off a global map. State lives in an external backing service — a database, Redis, object storage — which the process reads from and writes to per-request.

This isn't just about HTTP sessions. It applies to any inter-request dependency. A process that builds an in-memory index on startup and answers queries against it is stateful in this sense, even if the index is read-only. If the process crashes and a replacement doesn't rebuild it identically, you have hidden state.

### Mental model

Think of a process instance as a pure function with side effects: given a request and credentials to reach external state, it produces a response. Two instances given the same inputs should be substitutable. The external store is the single source of truth; instances are ephemeral compute.

The Twelve-Factor App frames this as "backing services" (factor IV) and "stateless processes" (factor VI) working in concert — stateless processes only work if you have somewhere trustworthy to offload state.

### Practical scenarios

**Backend:** Web API servers are the canonical case. User session data goes in Redis or JWTs (stateless by cryptographic verification). File uploads go to object storage, not `/tmp`. In-memory caches are acceptable as performance hints — but if a cache miss falls back to the database correctly, the cache is not load-bearing state.

**SRE:** Stateless services simplify incident response dramatically. A pod OOMKilled or a VM terminated? Replace it — no data loss, no need to drain sessions before termination, no "but that instance has in-flight work" anxiety. You get clean rollouts: spin up new instances, cut traffic, terminate old ones.

**DevOps:** Autoscaling becomes a policy, not a project. When load spikes, you add instances without coordinating state migration. Deployment pipelines don't need warm-up windows or session affinity rules. Stateless also makes multi-region simpler: any region can serve any request if the backing services are reachable.

### The common trap

Developers often introduce implicit state: a library that caches config in a module-level variable, a framework that stores per-request context in a thread-local, a background job system that enqueues in-process. These don't look like state until an instance is replaced and behavior changes. Audit your dependencies for statefulness, not just your own code.
