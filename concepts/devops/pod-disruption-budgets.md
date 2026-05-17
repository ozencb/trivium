---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Pod Disruption Budgets

A PDB is a Kubernetes policy that puts a floor on availability during *voluntary* disruptions — node drains, cluster upgrades, rolling deploys. Without one, Kubernetes will happily evict every pod in a Deployment simultaneously if it needs to free up nodes.

**The core mechanism**

A PDB doesn't prevent disruptions — it throttles them. You express availability as either `minAvailable` (at least N pods must stay up) or `maxUnavailable` (at most N pods can be down). The eviction API checks these constraints before proceeding. If evicting a pod would violate the budget, the API returns 429 and the drain waits.

This works because tools like `kubectl drain` and the cluster autoscaler use the eviction API rather than deleting pods directly. A PDB is essentially a contract with that API.

**Concrete example**

You have 3 replicas of a critical service. A node drain starts. Without a PDB, all 3 might get evicted before new pods schedule — your service goes dark. With `minAvailable: 2`, the eviction API only allows one pod to be evicted at a time, blocking until a replacement is running before touching the next one.

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: payment-service
```

**Practical patterns**

For **DevOps**, the main scenario is rolling cluster upgrades. When you're cycling nodes to update the kubelet or move to new instance types, PDBs are what keeps your services alive through the process. The common mistake: setting `minAvailable` equal to your replica count — now nothing can ever be drained and your upgrade stalls indefinitely.

For **SREs**, PDBs matter during incidents. If you're scaling down or evacuating a zone and your deployment has no PDB, an automated system (autoscaler, drain job) can unknowingly cause an outage while you're already fighting a fire. PDBs act as a secondary blast radius limiter.

**Common pitfalls**

- **PDB math doesn't update automatically**: You set `minAvailable: 3` when you had 5 replicas. You scale down to 3 replicas. Now nothing can be disrupted, ever.
- **Percentage vs. absolute**: `minAvailable: "50%"` scales with your replica count, which is usually what you want.
- **PDBs only cover voluntary disruptions**: A node going OOM and killing pods doesn't consult your PDB. This is a frequent misconception.
- **Single-replica deployments**: A PDB with `minAvailable: 1` on a 1-replica deployment makes that pod un-evictable. Either run 2+ replicas or don't set a PDB.

The rule of thumb: any stateless service with 2+ replicas that handles real traffic should have a PDB. The overhead is one YAML file; the downside of skipping it shows up at 2am during a cluster upgrade.
