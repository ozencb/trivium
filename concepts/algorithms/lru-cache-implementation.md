---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**LRU Cache** solves the cache invalidation problem of *which entry to drop* when capacity is full: evict whatever was accessed least recently. The insight is that recent access predicts future access, making LRU a practical approximation of optimal caching.

## The Mechanism

The data structure that makes O(1) eviction possible is a hash map wired to a doubly-linked list. Neither alone is sufficient: a hash map gives O(1) lookup but no ordering; a linked list gives ordering but O(n) lookup.

The invariant: the linked list is ordered by recency, with the most recently used (MRU) at the head and least recently used (LRU) at the tail. The hash map stores `key → list node` pointers.

On **get**: look up the node via the hash map, move it to the head (O(1) because you have a pointer to it), return the value.

On **put**: if the key exists, update the value and move it to the head. If at capacity, splice out the tail node, delete it from the hash map, insert the new node at the head and into the hash map. All O(1).

The doubly-linked list is necessary (not singly) because node removal requires updating the predecessor, which you can't do in O(1) with a singly-linked list.

## Mental Model

Imagine a rack of folders. Whenever you pull a folder out to read it, you put it back at the front. When the rack is full and you need to add a new folder, you throw out whatever is at the back. The hash map is the index that tells you which position in the rack any given folder is at.

## In Practice

**Backend:** This is the algorithm behind most in-process caches — Guava's `CacheBuilder`, Python's `functools.lru_cache`, Go's `groupcache`. Knowing the structure explains why these caches have a capacity parameter and why you shouldn't set it arbitrarily large (you're bounding the linked list, not just a map). Database buffer pools use the same eviction concept: PostgreSQL's shared buffer pool is essentially an LRU variant, which is why a large table scan can thrash your cache and evict hot index pages — a known pitfall called a "cache flood."

**Fullstack:** When you're caching API responses or rendered pages in-process (think Next.js route cache, or a Node API caching expensive DB reads), you're almost certainly using an LRU under the hood. The practical consequence: if two endpoints share a cache and one has much higher traffic, it will starve the other's entries out. Sizing the cache per data type (separate caches, separate capacities) is the fix.

**Common pitfall:** LRU performs poorly under sequential scans — each new entry evicts the previous one, yielding a 0% hit rate. Databases handle this with variants like LRU-K or ARC. In application code, if you see a cache miss rate that should be lower, scan access patterns for sequential or infrequent-but-large reads poisoning your working set.
