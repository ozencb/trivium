---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Consistent hashing** distributes keys across nodes so that adding or removing a node only remaps a small fraction of keys — solving the catastrophic reshuffling that happens with naive modular hashing (`hash(key) % N`) on a changing cluster.

## Core mechanism

Picture a ring spanning the full hash space (say, 0 to 2³²−1). Each node is hashed to a position on this ring. Each key is also hashed to a position, then assigned to the first node clockwise from it.

When you remove a node, only the keys between that node and its counter-clockwise neighbor need to migrate — to the next node clockwise. Nothing else moves. Add a node, and only keys between the new node and its predecessor shift. You've gone from O(K) rehashing to O(K/N) — the theoretical minimum.

In practice, each physical node occupies multiple positions on the ring (**virtual nodes / vnodes**). This smooths out skewed distributions and makes failure or expansion more granular — a single node's departure spreads its load across many neighbors rather than dumping everything onto one.

## Mental model

Think of it like a circular waiting line. Keys are people; nodes are service windows distributed around the circle. Each person walks clockwise until they hit a window. Close one window — only the people just behind it need to find the next one. Everyone else stays put.

## Where it shows up

**Backend**: Cassandra and DynamoDB use consistent hashing as their partitioning foundation. When you add a node to a Cassandra ring, rebalancing is surgical — only affected token ranges move. The rest of the cluster is untouched.

**SRE**: If you're running a Redis cluster or Memcached pool, consistent hashing is why scaling the pool doesn't completely invalidate your cache. Libraries like `ketama` implement it for exactly this. It's also why replacing a failed cache node causes a targeted miss spike rather than a full-cluster stampede — load only shifts from the dead node's slice of the ring.

**Fullstack**: CDNs and sticky load balancers often use consistent hashing to pin a user to a backend node without a central session store. Adding capacity doesn't force a full re-hash of user→node assignments, so sessions don't break en masse.

The point isn't just even distribution — it's **stability under topology changes**. That's the property that makes it load-bearing in distributed systems design.
