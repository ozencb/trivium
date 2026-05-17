---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Kubernetes Scheduling

The kube-scheduler decides which node runs each pod. Getting this wrong doesn't fail loudly at deploy time — it silently degrades production through OOMKills, evictions, and noisy-neighbor contention that's hard to trace back to a misconfigured resource request.

### Core Mechanism

Scheduling happens in two phases:

**Filtering (predicates):** eliminates nodes that can't run the pod. Checks include available CPU/memory *requests* (not actual usage), node selectors, taints/tolerations, and affinity rules. A node is removed from consideration if it can't satisfy any single constraint.

**Scoring (priorities):** ranks the remaining nodes. Default scoring favors spreading pods across nodes (`LeastRequestedPriority`) and balancing resource utilization. The highest-scoring node wins.

The critical subtlety: the scheduler works off *requested* resources, not *actual* usage. A node running pods that collectively request 80% CPU is "full" to the scheduler even if actual CPU usage is 20%. This is intentional — requests are the contract the kubelet uses to guarantee quality of service.

### The OOMKill Trap

Limits cap what a container can use. Requests are what the scheduler accounts for. When you set requests too low:

- Scheduler happily packs many pods onto a node
- Under load, actual usage exceeds the node's physical capacity
- Kubelet starts evicting pods (lowest-priority first, or those exceeding limits)
- Your app gets OOMKilled, and the alert fires with no clear explanation

The insidious part: this only manifests under traffic. A service that looks healthy in staging explodes in production because staging never stressed the actual memory path.

### Mental Model

Think of requests as the space a tenant *reserves* in an apartment building. Limits are the absolute max they can use. The building manager (scheduler) decides occupancy based on reservations, not how much furniture people actually own. If tenants lie about needing less space than they use, the building gets overbooked.

### Practical Scenarios

**SRE:** When investigating a wave of pod evictions, the first thing to check is `kubectl describe node` — specifically the `Allocated resources` section. If requests are near capacity but `top` shows low actual usage, you have a request inflation problem (or the inverse). Eviction priority is controlled by QoS class: pods with no requests/limits get `BestEffort` and are killed first.

**DevOps/Platform:** Setting `LimitRange` defaults in namespaces prevents teams from deploying pods with no resource specs, which would otherwise get `BestEffort` QoS and become eviction targets during any memory pressure event.

**Backend:** If your service has variable memory usage (e.g., large batch jobs vs. normal requests), `VPA` (Vertical Pod Autoscaler) can tune requests based on observed usage — but it requires pod restarts to apply, so it's not a live fix.

### Why This Matters in Interviews

Most engineers know "set requests and limits." Senior engineers know *why*: requests affect scheduling and QoS class, limits affect runtime behavior, and the gap between them is where production incidents live. Being able to trace an OOMKill through scheduler decisions to a misconfigured deployment manifest is the kind of end-to-end reasoning that separates operational depth from surface knowledge.
