---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Failover

Failover is the mechanism that keeps your system available when a component dies — it automatically redirects traffic from a failed node to a healthy one. The reason it matters: high availability is a promise, and failover is the infrastructure-level contract enforcing that promise when things go wrong.

### The Core Mechanism

Failover has two parts: **detection** and **promotion**.

Detection is harder than it looks. A node that's slow looks identical to a node that's dead from the outside. Health checks — heartbeats, TCP probes, application-level endpoints — define what "dead" means. The gap between actual failure and detection completing is your first time cost.

Promotion is where the design decisions live. Two dominant patterns:

**Leader election-based failover** (Zookeeper, etcd, Raft): The cluster runs a consensus algorithm to elect a new leader when the current one fails. The upside is correctness — you won't accidentally elect two leaders simultaneously (split-brain). The downside is latency: consensus takes time, often 5–30 seconds depending on timeout configuration.

**DNS-based failover** (Route 53 health checks, etc.): A health check service monitors your primary, and on failure, updates a DNS record to point at a standby. Simpler to operate, but you're at the mercy of DNS TTLs and client caching. Even with a 60-second TTL, stale resolvers will keep hitting your dead node longer than you'd like.

### Concrete Mental Model

Think of a primary-replica database setup. Your primary is serving writes. It dies. Now three things need to happen in sequence: detect the failure, promote a replica, redirect clients. Each step has a latency floor. Your **RTO (Recovery Time Objective)** is roughly the sum of those floors. This is why teams obsess over timeout tuning — shaving 10 seconds off leader election timeout might be the difference between an incident and an outage.

### Where This Shows Up in Practice

**Backend engineering**: When you add a read replica, you're implicitly designing failover. The question is: does your application know how to reconnect after a promotion? Many ORMs don't automatically re-resolve the primary endpoint. That's a failover bug waiting to happen in production.

**SRE**: Split-brain is the nightmare scenario — two nodes both believing they're the leader, both accepting writes, diverging state. Proper failover design uses fencing (STONITH, revocation tokens) to ensure the old leader is truly dead before promoting the new one.

**DevOps**: In Kubernetes, pod disruption budgets and readiness probes are failover primitives. A deployment rollout that doesn't respect readiness checks is a failover anti-pattern — traffic hits pods before they're ready.

### What Separates Senior Engineers Here

The naive assumption is that failover is automatic and free once configured. It isn't. Detection windows, consensus latency, client reconnection logic, and split-brain protection are all failure modes that appear only under load or during actual outages. Senior engineers ask: *what's the RTO under this design, and what breaks if the failover itself fails halfway through?*
