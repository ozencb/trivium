---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Hash Tables**

A hash table gives you O(1) average-case lookups by trading memory for the ability to jump directly to where a value lives, instead of searching. It's the data structure behind almost every "instant" lookup you've ever implemented.

**The core mechanism**

The trick is deterministic transformation: a hash function maps an arbitrary key to a fixed-size integer (the hash), which is then used as an index into an underlying array. Given the same key, you always get the same index — so insertion and retrieval follow the same path without any scanning.

The hard problem isn't hashing, it's **collisions**: two different keys producing the same index. The two dominant strategies:

- **Chaining**: each array slot holds a linked list. Collisions just append to that list. O(1) average, O(n) worst case if everything hashes to one bucket.
- **Open addressing**: on collision, probe neighboring slots (linear, quadratic, or Robin Hood probing). Cache-friendlier, but load factor matters more — tables typically resize at ~70% capacity to keep probe chains short.

The hash function itself matters more than people think. A poor function (like summing ASCII values of a string) clusters keys and degrades to O(n). Good ones — MurmurHash, xxHash, SipHash — distribute uniformly and are fast to compute.

**Mental model**

Think of a coat check: you hand over your coat, get a numbered ticket. Retrieval is O(1) because the ticket tells you exactly which hook to walk to. Collisions are like two people getting the same number — the attendant now has to check both coats on that hook.

**Practical connections**

*Backend*: Every in-process cache (Redis internally, your `Map<string, T>` in Node) is a hash table. Database query plan caches, session stores, rate-limiter state — all hash tables. Understanding load factor and rehashing explains why Redis can spike CPU during key expiry or why a HashMap pre-sized to expected capacity avoids costly resizes under load.

*Frontend*: JavaScript objects and `Map` are hash tables. When you reach for `Map` over an object for frequent add/delete cycles, you're making a conscious hash table tradeoff — `Map` maintains insertion order and handles non-string keys without prototype pollution risks.

*Fullstack*: HTTP routing in most frameworks resolves route handlers via a hash table keyed on method + path pattern. Content-addressable storage (git objects, asset fingerprinting, CDN cache keys) uses hashes as keys. Understanding this makes it obvious why two files with identical content produce the same cache key.

**Why this unlocks what's next**

Consistent hashing extends this to distributed systems — when nodes join/leave, you want minimal key remapping, which requires rethinking how you assign keys to buckets. Bloom filters borrow the multi-hash idea to answer "definitely not in set" with zero false negatives using far less memory than storing actual keys. Both are direct consequences of pushing hash table mechanics into new constraints.
