---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Zero-downtime deployments ensure that at no point during a release does a user hit an instance that's either not yet ready or in the middle of shutting down. The goal isn't just "keep the service up" — it's maintaining consistent behavior throughout the transition.

## Core Mechanism

The fundamental requirement is that your load balancer or orchestrator only routes traffic to instances that are explicitly healthy, and that instances finish in-flight work before dying. That sounds obvious, but the failure modes are subtle:

**The startup gap**: New instances take time to warm up — JVM JIT, connection pool establishment, cache warming. If your health check passes before the instance is truly ready, you'll route traffic to a cold instance that responds slowly or errors under load. The fix is a readiness probe that validates actual workload capacity, not just "process is running."

**The termination gap**: When a SIGTERM fires, you need to (1) stop accepting new connections, (2) wait for existing requests to finish, (3) then exit. If your app just dies on SIGTERM, in-flight requests get dropped. Kubernetes gives you `terminationGracePeriodSeconds` and a `preStop` hook precisely for this — use them. A `preStop: sleep 5` is often enough to let the load balancer drain connections before shutdown begins.

**The replica math**: During a rolling update with `maxUnavailable: 1`, if you only have 2 replicas, you temporarily operate at 50% capacity. If baseline load is at 60% capacity, you just caused an outage. You need enough replicas that losing `maxUnavailable` pods still leaves you above your peak traffic threshold.

## Concrete Example

Say you're rolling out a Node.js service. Pod A gets a SIGTERM. Node's HTTP server keeps the event loop alive for existing requests, but you've registered a `close()` handler that stops accepting new connections. Meanwhile, your readiness probe on Pod B (the replacement) hits `/health/ready`, which checks that your DB connection pool is fully established and a warm-up query has succeeded — not just that the process started. Only then does traffic shift.

## Practical Scenarios

**DevOps**: The biggest footgun is misconfigured health check timings. `initialDelaySeconds` that's too short causes the orchestrator to kill a slow-starting pod in a restart loop, making the deployment worse than a simple restart.

**SRE**: Zero-downtime deployments don't eliminate incidents — they shift them. Instead of a hard outage, you get error rate spikes during rollout. Your SLO burn rate alerting needs to catch these partial degradations, not just total failures.

**Backend**: Stateful protocols (WebSockets, gRPC streaming, SSE) don't drain cleanly. A graceful shutdown that waits "until all HTTP requests finish" won't account for a WebSocket that's been open for 10 minutes. You need explicit client reconnection logic and server-side connection limits on long-lived streams.

The pattern is reliable once you internalize that "zero-downtime" is a contract enforced by three separate systems — health checks, graceful shutdown, and replica headroom — and all three have to be correct simultaneously.
