---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

A hash table achieves O(1) average-case lookup by converting a key into an array index via a hash function, trading memory for time. The reason this matters: most data structures force you to choose between fast access (arrays, by index) or flexible keys (linked lists, trees) — hash tables give you both.

## The Mechanism

The core idea: given a key like `"user:42"`, a hash function deterministically maps it to an integer, which is then reduced to an array index via modulo (`hash(key) % capacity`). You store the value at that index. Lookup is the same operation — compute, mod, read. No traversal, no comparison chain.

The hash function has one job: distribute keys uniformly across the array. A bad hash function that clusters keys in a few buckets turns your O(1) into O(n) because every lookup degrades into a linear scan within that bucket.

**Collisions are inevitable** (pigeonhole principle — infinite keys, finite slots), so every hash table needs a collision strategy:

- **Chaining**: each slot holds a linked list. Collisions append to the list. Lookup walks the list. Works well with high load factors but has pointer overhead and cache unfriendliness.
- **Open addressing** (linear/quadratic probing): on collision, probe adjacent slots. Better cache locality, but degrades faster as load factor increases. Deletion is tricky (can't just clear a slot — it breaks probe chains).

The **load factor** (elements / capacity) is the key invariant. Most implementations resize (rehash everything) when load exceeds ~0.7 to preserve O(1) amortized behavior.

## Mental Model

Imagine a library with 1000 shelves. Instead of cataloguing books alphabetically and searching linearly, a librarian applies a formula to each title that directly outputs a shelf number. Finding a book is one step: apply the formula, go to that shelf. The catalog *is* the formula. The problem: two books might hash to shelf 47 — that's a collision.

## Practical Scenarios

**Backend**: Redis keys, database index hash partitioning, routing tables in load balancers. When you do `O(1)` session token lookup in-memory rather than a DB query, that's a hash table. Collision strategy affects memory under pathological key distributions — adversarial inputs can force worst-case behavior (see: hash-flooding DoS attacks on PHP/Ruby around 2011).

**Frontend**: JavaScript objects and `Map` are hash tables. React's reconciler uses key-based hashing to diff component trees efficiently. Webpack's module registry is hash-keyed.

**Fullstack**: Content-addressable storage (Git objects, CDN cache keys) hashes content to a key — the hash *is* the address. This requires collision resistance at a cryptographic level, which is a different constraint than performance hashing.

Understanding hash tables unlocks consistent hashing (how to resize without rehashing everything — critical for distributed caches) and bloom filters (probabilistic set membership using multiple hash functions).
