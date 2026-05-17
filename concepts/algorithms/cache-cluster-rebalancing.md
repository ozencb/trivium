---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Cache Cluster Rebalancing

When you add or remove nodes from a cache cluster, you need to decide which node owns which keys — and doing that naively breaks everything. A simple modulo hash (`key % n`) remaps almost every key when `n` changes, causing a thundering herd of cache misses that hammers your database.

**The core mechanism**

Consistent hashing solves this by placing both nodes and keys on a virtual ring (typically 0–2³²). Each key is owned by the first node clockwise from its hash position. When you add a node, it only steals keys from its immediate clockwise neighbor — in an ideal ring with `n` nodes, roughly `1/n` of keys move. Remove a node, and its keys transfer to its successor. The rest of the ring is untouched.

In practice, real implementations use *virtual nodes* (vnodes): each physical node gets hundreds of positions on the ring. This prevents hot spots when physical nodes have different capacities or when you have small clusters (3–5 nodes) where raw consistent hashing gives uneven distribution.

**Concrete mental model**

Imagine your ring has 3 nodes at positions 0, 120, 240 degrees. Your key `user:42` hashes to 100°, so node at 120° owns it. Add a 4th node at 90°. Now `user:42` at 100° moves to the new node at 90°. Everything between 240° and 90° is unaffected. Only the slice between the new node's predecessor (0°) and the new node (90°) remaps.

**Backend context**

When you're running Redis Cluster or a consistent-hashing client (like Ketama with Memcached), rebalancing happens on topology change. If you're scaling up during a traffic spike, you'll take a miss storm on the remapped slice — size it right. Warm the new node if you can (read-through patterns help here, or explicit pre-warming scripts that backfill hot keys). Libraries like `twemproxy` or `envoy`'s ring hash load balancer handle this transparently but you still own the operational window.

**SRE context**

Rebalancing is a maintenance event, not a no-op. Track your miss rate in your cache monitoring dashboard; a topology change should show a short spike that decays as the new node warms. If the spike doesn't decay, you have a problem — either the node isn't getting traffic, or your TTLs are too long and you're not repopulating. Also watch for replication lag if you're using Redis Cluster: during a failover, the replica that takes over may not have flushed all writes from the primary, causing stale data on top of misses.

**When to reach for this**

If your cache layer is stateless (CDN, proxy cache), you don't manage this directly. You care about consistent hashing when you own the cache cluster — self-managed Redis/Memcached clusters, in-process sharded caches, or any system where you're routing keys to specific nodes. Any time you plan a scale-out event, this is the algorithm governing how painful it'll be.
