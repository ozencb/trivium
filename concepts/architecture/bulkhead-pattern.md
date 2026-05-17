---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Bulkhead Pattern

The bulkhead pattern prevents a failure in one part of your system from cascading into a total outage by partitioning shared resources into isolated pools. Where a circuit breaker stops *calling* a failing dependency, a bulkhead stops a slow dependency from *starving* everything else.

### The core idea

In a typical service, all requests share the same thread pool (or connection pool, semaphore count, etc.). When one downstream dependency—say, a payment service—starts responding in 8 seconds instead of 200ms, threads pile up waiting. Within seconds, your entire thread pool is saturated with payment requests, and calls to your user-profile service or auth service queue up behind them, even though those dependencies are perfectly healthy. The slow service has taken the whole application hostage.

A bulkhead says: give each consumer its own fixed resource allocation. Payment calls get 10 threads, max. Profile calls get 20. Auth gets 15. Now payment going slow only blocks the payment pool—the other two keep processing normally.

### How it's implemented

The two common shapes:

- **Thread pool isolation**: each downstream dependency gets a dedicated thread pool (Hystrix popularized this). Requests to that dependency execute on its pool; when the pool saturates, calls fail fast instead of queuing. Expensive because threads have memory overhead.
- **Semaphore isolation**: a counter limits concurrent in-flight requests per dependency. Lighter weight, but doesn't isolate thread-level blocking (a thread still blocks waiting).

You can also apply bulkheads at higher levels—separate Kubernetes deployments for critical vs. non-critical workloads, separate DB connection pools per consumer type, separate ingress routes for internal vs. external traffic.

### Backend in practice

When you have a service that handles both latency-sensitive user-facing requests and slower background/analytics requests, a single shared pool means a burst of expensive analytics queries can degrade user experience. A bulkhead gives each path its own pool and lets analytics degrade gracefully without affecting users.

### SRE perspective

Bulkheads are where you start thinking about **blast radius reduction** at the infrastructure level. If one tenant, one region, or one feature is misbehaving, you want it contained. This shows up in multi-tenant SaaS as per-tenant rate limits and resource quotas, and in SRE incident analysis as "why did service X get taken down by service Y's traffic spike?"

### The design discussion differentiator

Junior engineers know "add a timeout." Mid-level engineers add circuit breakers. What distinguishes senior engineers is understanding that circuit breakers protect *against* a bad dependency but don't protect *other* dependencies from the blast radius of one dependency going slow. Bulkheads address the partition problem circuit breakers don't. In design reviews, asking "what's the blast radius if this pool saturates?" is the kind of question that signals systems thinking.

The tradeoff worth naming: bulkheads add operational complexity and can lead to resource underutilization if pool sizes are misconfigured. Size them too small and you get unnecessary failures; too large and you've gained nothing.
