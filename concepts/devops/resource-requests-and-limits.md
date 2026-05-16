---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Resource Requests and Limits

Kubernetes needs to place pods on nodes without overcommitting hardware — requests and limits are how you tell the scheduler what a container needs and how much it's allowed to consume.

**The core mechanism**

These are two separate numbers on a container spec, and they do different things:

- **Request**: what the scheduler *reserves* on a node before placing the pod. A node with 4 CPU cores and three pods each requesting 1 CPU is considered 75% allocated — even if those pods are idling at 0.1 CPU. The scheduler won't place a new pod that requests 1.5 CPU on that node.
- **Limit**: a runtime enforcement ceiling. The kubelet and container runtime enforce this via cgroups. For CPU, a container hitting its limit gets *throttled* (slowed down, not killed). For memory, hitting the limit causes an OOM kill.

The key insight: requests affect *scheduling*, limits affect *runtime behavior*. They're orthogonal levers.

**Mental model**

Think of a node as a hotel. Requests are reservations — the hotel considers a room booked even if the guest hasn't arrived. Limits are the physical room size — you can't bring more people than the room holds. You can overbook in theory (set limits higher than requests), but the hotel can evict guests (OOM kill) if the building hits capacity.

**Why the split matters**

A container might need 256Mi memory to start reliably (request), but could spike to 512Mi under load (limit). Setting them equal is safe but wasteful — nodes fill up faster with fewer pods scheduled. Setting limits much higher than requests lets you pack more pods onto a node, but you risk a "noisy neighbor" situation where one container's memory spike triggers OOM kills on co-located pods.

**Practical scenarios**

*SRE*: When investigating a pod OOMKilled in production, check if the memory limit is undersized relative to actual usage. `kubectl top pods` vs. the configured limit tells you immediately whether you're chronically under-provisioned. CPU throttling is subtler — it shows up as latency spikes, not crashes. Check `container_cpu_throttled_seconds_total` in your metrics.

*DevOps*: Setting `LimitRange` objects at the namespace level gives you safe defaults so developers don't accidentally deploy containers with no limits (which can starve other workloads on the same node).

*Backend*: For a Java service, the JVM's heap doesn't map cleanly to container memory — the JVM also uses off-heap memory for metaspace, direct buffers, etc. A common footgun is setting the limit equal to `-Xmx`, then getting OOM kills because the total process RSS exceeds that limit. You typically need 20-30% headroom above `-Xmx` in your memory limit.

**QoS classes** fall out of this naturally: Guaranteed (request == limit), Burstable (request < limit), and BestEffort (neither set). The kubelet evicts BestEffort pods first under node pressure, so this isn't just accounting — it affects your pod's survival during resource contention.
