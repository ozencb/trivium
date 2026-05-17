---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Graceful Shutdown

When a process receives SIGTERM during a rolling deploy, any in-flight requests die mid-flight unless you handle the shutdown sequence deliberately. Graceful shutdown is that sequence: stop accepting new work, drain what's already in flight within a time bound, flush buffered state, then exit — turning a potentially lossy event into a clean one.

### The core mechanism

There are four distinct phases, and the ordering matters:

1. **Stop accepting new connections/work** — close the listening socket or set a flag that rejects new requests immediately
2. **Signal unhealthiness** — remove yourself from the load balancer rotation so upstream stops routing to you (health check returns 503, readiness probe fails, etc.)
3. **Drain in-flight requests** — wait for active requests to complete, bounded by a deadline you control
4. **Flush and close** — write buffered metrics/logs, commit pending DB transactions, close DB connections cleanly, then exit 0

The deadline in step 3 is where most bugs live. Too short and you're just doing a fast kill. Too long and deploys stall or Kubernetes's SIGKILL races your drain. A common rule: set your app's drain timeout to 80% of your orchestrator's termination grace period so there's buffer before the forced kill.

### The Kubernetes timing trap

In Kubernetes, SIGTERM arrives at the pod *concurrently* with endpoint removal from the Service. The endpoint removal propagates through kube-proxy asynchronously — iptables/IPVS rules don't update instantly. If your app stops accepting connections the moment it gets SIGTERM, it will reject live traffic that's still being routed to it.

The standard fix is a `preStop` lifecycle hook that sleeps 5–15 seconds before the container gets SIGTERM, giving the control plane time to drain routing. It's a hack, but it's the established pattern.

### Practical angles

**Backend**: HTTP servers need to handle keep-alive connections carefully. A connection can be "idle" but still open, keeping your drain phase alive indefinitely. Either set `Connection: close` on responses during shutdown, or track and close idle connections explicitly. In Go, `http.Server.Shutdown()` does this correctly. In Node, you typically need a library like `stoppable` or manual connection tracking.

**SRE**: If deploys show up as error spikes in your SLI dashboards, missing or broken graceful shutdown is usually the culprit. "Requests dropped per deploy" is worth tracking explicitly — a well-behaved service should have zero. This is also why canary deploys expose shutdown bugs: you see the errors from the canary before they hit the full fleet.

**DevOps**: `terminationGracePeriodSeconds` in Kubernetes is not your shutdown timeout — it's the ceiling before SIGKILL. Your app's internal drain timeout must be shorter. A common mistake is setting both to 30s, which means SIGKILL may arrive before the drain completes.

### Where it connects

Once you have graceful shutdown working at the process level, connection draining is the same idea applied at the load balancer layer — the LB stops sending new requests to a backend while letting existing connections finish. The mental model transfers directly.
