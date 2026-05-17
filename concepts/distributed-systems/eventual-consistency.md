---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Eventual Consistency

When you choose AP over CP in CAP terms, you're accepting that replicas can diverge temporarily — eventual consistency is the guarantee that they *will* converge, given no new writes and enough time. It's not a weak guarantee so much as a different contract: trading synchronous coordination cost for availability under partition.

**The core mechanism**

Strong consistency requires coordination before acknowledging a write — typically a quorum or leader commit. Eventual consistency skips that: writes land on any available replica immediately and propagate asynchronously. The convergence happens through *anti-entropy* processes: background reconciliation that gossips state between nodes, detects divergence, and resolves it.

The critical question is *how* conflicts resolve. Most systems pick one of three strategies:
- **Last-Write-Wins (LWW)**: highest timestamp wins. Simple, lossy — concurrent writes from two clients silently discard one.
- **Vector clocks**: track causal history per key. Detect true conflicts (concurrent writes with no causal relationship) vs. stale reads. Shifts resolution burden to the application.
- **CRDTs** (Conflict-free Replicated Data Types): data structures mathematically guaranteed to merge commutatively and associatively. No conflicts by design — counters, sets, registers. The convergence is built into the type.

**Mental model**

Think of DNS. You update an A record; it propagates over minutes or hours across resolvers worldwide. During propagation, different clients see different IPs. Eventually everyone agrees. No coordinator gates the update — availability is prioritized, and the system converges through TTL expiry and cache refresh. DNS is eventually consistent and mostly nobody cares, because the staleness window is acceptable.

**Where it matters in practice**

*Backend*: Cassandra and DynamoDB default to eventual consistency. Read at `ONE` consistency level and you might get a stale replica. If you're building a counter, inventory system, or anything where concurrent writes conflict, you need to consciously pick a conflict model — or you'll silently lose data under concurrent load.

*SRE*: Replication lag in Postgres streaming replication is eventual consistency. Replica reads during high-write periods return stale data. The failure mode isn't errors — it's silently returning old rows. Monitoring replication lag as a SLI matters more than most teams realize until an incident forces it.

*Fullstack*: "Like" counts, view counters, feed rankings — all typically eventually consistent. The pattern is optimistic UI: apply the update client-side immediately, fire the request, accept that the server-side count might lag. Users tolerate this. What they don't tolerate is losing a cart item or a financial transaction — which is where you need to step back to stronger guarantees.

**The real pitfall**

"Eventual" has no time bound in the formal definition. It converges *if* writes stop. In practice, under continuous write load, replicas can stay diverged indefinitely. This is where understanding your system's anti-entropy rate and replication topology matters — and why "eventually consistent" is a starting point for reasoning, not the end of it.
