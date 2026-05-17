---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Horizontal Pod Autoscaling

HPA lets Kubernetes automatically scale your deployment's replica count up or down based on observed metrics. The practical value: you stop paying for idle capacity during quiet periods and stop paging on-call when traffic spikes faster than a human can react.

**How it actually works**

The HPA controller runs a reconciliation loop (default every 15 seconds) that queries the Metrics API, computes a desired replica count, and patches the deployment. The formula is straightforward:

```
desiredReplicas = ceil(currentReplicas × (currentMetric / targetMetric))
```

So if you have 4 pods running at 80% CPU and your target is 50%, it wants `ceil(4 × 1.6) = 7` pods. There's a stabilization window (default 5 minutes for scale-down, 0 for scale-up) that prevents thrashing — HPA won't scale down immediately after a spike recedes.

The metrics pipeline matters here: HPA reads from either the `metrics.k8s.io` API (CPU/memory, fed by metrics-server) or `custom.metrics.k8s.io` (any metric your adapter exposes — queue depth, RPS, latency percentiles). Without accurate resource requests on your pods, CPU utilization percentages are meaningless to the controller.

**Mental model**

Think of HPA as a thermostat, not an on/off switch. You set a target temperature (50% CPU), and it continuously adjusts to maintain it. The lag in the system — pod startup time, JVM warmup, connection pool establishment — is what you're fighting against when tuning it.

**Where it breaks down in practice**

- **Scale-up lag**: If pods take 90 seconds to become ready and you're under a flash traffic spike, HPA can't help you fast enough. Pre-warming with `minReplicas` or using KEDA with predictive scaling is the answer.
- **Wrong metric**: CPU is a poor proxy for many services. A Go service doing mostly I/O will sit at 5% CPU while drowning in requests. Custom metrics (queue depth, active connections, request rate) are usually more honest signals.
- **Conflict with VPA**: Vertical Pod Autoscaler and HPA both mutate pods, and running them on the same resource metric causes control loop interference. Use VPA for non-autoscaled workloads or restrict it to memory only.
- **Stateful workloads**: HPA works cleanly for stateless services. Applying it to something holding session state or a shard of a database requires careful thought about what happens when a pod disappears.

**When to reach for it**

For backend services with variable traffic (web APIs, async workers, stream processors), HPA is almost always the right default over static replica counts. SREs typically pair it with PodDisruptionBudgets to ensure scale-down doesn't violate availability guarantees. If your traffic patterns are predictable (daily peaks), KEDA's cron-based scaling or scheduled HPA via CronJobs can supplement reactive scaling with proactive capacity.
