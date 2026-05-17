---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Horizontal Scaling

Horizontal scaling means adding more identical instances of a service to share load, rather than giving a single instance more CPU or RAM. The appeal isn't just capacity—it's that you can grow incrementally and recover from failures without a single point of contention.

### The Core Mechanism

The invariant that makes horizontal scaling work is **shared-nothing between instances**. Each request must be completable by any instance without coordination. That means no in-process session state, no local cache you depend on being warm, no locks held across requests. The load balancer becomes the entry point; the backing store (database, cache, queue) becomes the source of truth.

This is why stateless processes are a prerequisite. If your app stores session data in memory, adding a second instance means requests that hit the "wrong" node will fail authentication. The fix—externalizing session to Redis—is the canonical pattern for making a service horizontally scalable.

A useful mental model: think of each instance as a worker that only knows what's in the current request and what it can read from shared storage. Two workers should produce identical outputs for identical inputs.

### Concrete Example

You have an API that processes image uploads. Initially one server handles everything. Load spikes. You vertically scale—bigger CPU, more RAM—and buy time. But eventually you hit the instance size ceiling, or you realize a single node is a reliability risk.

Horizontal scaling: put a load balancer in front, deploy three identical instances, store uploads in S3 instead of local disk, store job state in a database. Now any instance can handle any request. Adding a fourth instance during a traffic spike is a config change, not an infrastructure event.

### Practical Angles

**Backend:** The hardest part is usually identifying hidden statefulness—things like local file writes, in-memory caches that diverge across nodes, or background jobs that assume single-instance execution. Distributed locks and leader election patterns exist specifically for cases where you can't fully eliminate coordination.

**SRE:** Horizontal scaling directly enables rolling deploys and fault tolerance. With N instances, you can take one down for maintenance or absorb a node failure without downtime. It also makes autoscaling tractable—your scaling policy becomes "add instance when CPU > 70%" rather than "call someone to resize the VM."

**DevOps:** Containerization (Docker/Kubernetes) made horizontal scaling operationally cheap. The work shifted from "how do we scale" to "how do we handle stateful components at the edges"—databases, queues, and caches are what require careful thought now. Kubernetes HPA (Horizontal Pod Autoscaler) is the direct expression of this pattern.

### The Ceiling You're Avoiding

Vertical scaling has a hard ceiling—the largest available machine. It also introduces risk: bigger nodes are often more expensive to replace, harder to provision, and a single failure hurts more. Horizontal scaling trades that ceiling for coordination complexity, which is usually the better tradeoff once you've externalized your state correctly.
