---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Kubernetes Scheduling** is the process by which Kubernetes decides which node runs each Pod. It matters because wrong placement kills performance, wastes money, and causes cascading failures at scale.

## The Core Mechanism

The scheduler is a control loop watching for Pods with no assigned node (`spec.nodeName` is empty). For each unscheduled Pod, it runs two phases:

**Filtering** — eliminates nodes that can't run the Pod. Hard constraints: does the node have enough CPU/memory, do node selectors match, are there taints the Pod doesn't tolerate, does the volume need to be in a specific zone?

**Scoring** — ranks surviving nodes. Soft preferences: spread Pods across zones for HA, pack tightly to free up nodes for scale-down, prefer nodes where the image is already cached.

The highest-scoring node wins, and the scheduler writes that node name into the Pod spec. The kubelet on that node sees the assignment and starts the container.

Critically, the scheduler only looks at *requested* resources (what you declare), not actual utilization. A node running at 5% CPU but with 90% of its CPU *requested* looks "full" to the scheduler. This is why resource requests are not optional configuration — they're the scheduler's only signal.

## Mental Model

Think of it like airline seat assignment. Filtering removes flights that don't go to your destination or are already full. Scoring picks the best option — maybe a window seat, maybe the one with extra legroom. The scheduler doesn't care what you actually do in the seat; it just committed capacity to you when it assigned it.

## Practical Scenarios

**SRE**: When a node goes down, the scheduler reschedules its Pods on remaining nodes. If you've set `podAntiAffinity` rules to spread replicas across nodes, the scheduler enforces that — but only if surviving nodes have enough unallocated (requested) capacity. Tight resource requests are what make rescheduling fast vs. Pods getting stuck in `Pending`.

**DevOps**: Node pools and taints/tolerations let you segment workloads — GPU nodes only run ML jobs, spot nodes run batch, on-demand nodes run stateful services. The scheduler enforces this via the taint/toleration system without you needing to manage placement manually.

**Backend**: If your service has spiky traffic and you're using Horizontal Pod Autoscaler, new Pods need to schedule quickly. Scheduling latency is often gated on whether nodes have headroom. Cluster Autoscaler provisions new nodes when Pods stay `Pending` — but that takes 2-4 minutes. Pre-warming node capacity or tuning requests/limits tightly is how you keep p99 autoscaling time under control.

Understanding scheduling is the prerequisite to reasoning about resource requests and limits meaningfully — they're not just quotas, they're the inputs the scheduler uses to make every placement decision.
