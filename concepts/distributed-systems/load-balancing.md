---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**Load Balancing**

Traffic distribution across multiple instances isn't just about "not crashing" — it's the mechanism that lets you scale horizontally without changing application code, and the thing that separates "it works" from "it works at 10x load."

**Core Mechanism**

A load balancer sits in front of your instance pool and makes a routing decision on each incoming request. The algorithm is where the real engineering lives:

- **Round robin**: Simplest. Works well when requests are uniform in cost. Breaks when they aren't.
- **Least connections**: Route to the instance with fewest active connections. Better for long-lived requests (WebSockets, streaming).
- **IP hash / consistent hashing**: Hash the client IP to always route the same client to the same instance. Useful for session affinity, but creates hotspots if one IP generates outsized traffic.
- **Weighted**: Assign more traffic to beefier instances. Common during rolling deploys when new instances haven't warmed up yet.

Alongside routing, the load balancer runs health checks — typically HTTP probes on a `/health` endpoint — and pulls unhealthy instances from rotation without operator intervention.

**Mental Model**

Think of it like a maître d' at a restaurant. They know which tables are occupied, seat new parties efficiently, and when a waiter calls in sick, stop sending customers to that section. The kitchen (your instances) never needs to know how many diners are in the building.

**Practical Scenarios**

*Backend*: You deploy three API servers behind an ALB. A slow database query causes one instance's response time to spike. Least-connections routing naturally diverts traffic away from it; round robin doesn't — you'll see elevated error rates from that pod until it recovers or health checks trip.

*SRE*: During an incident, you drain a single instance by setting its weight to zero rather than killing it, letting in-flight requests complete. This is the difference between graceful degradation and a wave of 503s burning your SLO.

*DevOps*: Blue/green deployments work because a load balancer can atomically shift 100% of traffic from one target group to another. Canary deployments work because it can split — send 5% to the new version while you watch error rates.

*Fullstack*: Sticky sessions (session affinity via cookie) let stateful server-side sessions survive without a shared session store. It's a pragmatic escape hatch, but it couples user experience to instance health — if that instance dies, the session goes with it.

**Where it gets nuanced**

Knowing when *not* to add a load balancer is the senior-engineer signal. A single-instance internal service with predictable, low traffic doesn't need one. The overhead — extra network hop, TLS termination, routing config — adds up. Load balancers also become a single point of failure themselves, which is why production setups run them in pairs or use anycast DNS to sidestep the problem entirely. That last point connects directly to Service Mesh, which pushes load balancing decisions into a sidecar proxy at each instance, eliminating the centralized bottleneck altogether.
