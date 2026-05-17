---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Resource Requests and Limits

Kubernetes needs two separate answers to the question "how much CPU/memory does this container use?": what it needs to *start* (requests) and what it's *allowed to consume* at peak (limits). Treating them as the same value is one of the most reliable ways to create subtle production problems.

### The Mechanism

**Requests** are consumed by the scheduler before the pod ever runs. The scheduler sums all requests across pods on a node and compares against node capacity — if a node is "full" by requests, no new pods land there, even if actual utilization is 20%. Once scheduled, requests act as a guaranteed floor: your container won't be starved below that amount under normal conditions.

**Limits** are enforced at runtime by the kubelet via cgroups. This is where the two resources diverge sharply:

- **CPU** is compressible. Exceeding your limit doesn't kill the process — the kernel throttles it via CFS quota. The container keeps running but gets slower. This is silent and often missed until p99 latency spikes show up in traces.
- **Memory** is incompressible. Exceeding your limit triggers the OOM killer immediately. The container dies with exit code 137, restarts, and if the underlying pressure is continuous, you get a crash loop.

### QoS Classes

The ratio between requests and limits determines your pod's eviction priority when a node is under pressure:

- `requests == limits` → **Guaranteed** (last to be evicted)
- `requests < limits` → **Burstable**
- Neither set → **BestEffort** (first to die)

### Where This Bites People

**For backend engineers:** An app that does fine in staging starts OOMKilling in prod under load. The usual cause: limits were set based on idle memory, not peak (GC pressure, connection pools warming up, caches filling). Set limits based on profiled peak usage, not average.

**For SREs:** CPU throttling is the silent killer. A service can be "healthy" by CPU utilization metrics while being heavily throttled — `container_cpu_cfs_throttled_seconds_total` is the metric you actually want. Some teams drop CPU limits entirely and rely on requests + node autoscaling to handle burst, accepting that a runaway container costs money instead of latency.

**For DevOps/platform teams:** Namespace resource quotas are enforced against requests, not limits. A team can set absurdly high limits and still fit under quota while over-committing the node. If you're running a multi-tenant cluster, enforce LimitRanges to bound the requests/limits ratio.

### The Practical Rule

Set requests to your container's steady-state usage with a small buffer. Set memory limits to your realistic peak (profile under load). For CPU limits, consider whether you'd rather have throttle-induced latency or no ceiling — both are valid positions, but make the choice deliberately rather than copying a number from a tutorial.
