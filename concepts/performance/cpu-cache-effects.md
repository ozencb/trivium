---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## CPU Cache Effects

Modern CPUs are orders of magnitude faster than RAM. A cache miss to main memory costs ~100ns; an L1 hit costs ~1ns. This gap means your algorithm's theoretical complexity is often irrelevant — what dominates is whether your data is in cache when the CPU asks for it.

### The Mechanism

CPUs don't fetch individual bytes from RAM. They fetch **cache lines** — typically 64 bytes — on every miss. If you access `array[0]`, the CPU pulls bytes 0–63 into L1 cache. Accessing `array[1]` through `array[7]` (assuming 8-byte elements) is then "free." This is **spatial locality** — nearby memory tends to get loaded together.

The cache hierarchy is layered: L1 (~32KB, per-core) → L2 (~256KB, per-core) → L3 (~8–32MB, shared) → RAM. Each level is slower and larger. The CPU evicts lines from smaller caches using LRU-like policies.

Three things kill cache performance:

1. **Cache misses**: Accessing memory in unpredictable, non-sequential patterns. Linked lists are the textbook example — each node pointer dereference is a potential miss to an arbitrary address.

2. **False sharing**: Two cores write to different variables that happen to live on the *same* 64-byte cache line. The hardware sees it as a conflict and forces cache coherence traffic between cores — a performance cliff with no bug to show for it.

3. **Cache thrashing**: A working set larger than cache size, causing constant eviction and reload. An L3 miss on every iteration of a tight loop turns O(n) into O(n × 100ns).

### Mental Model

Think of cache as a CPU-managed FIFO prefetch buffer. The CPU *predicts* what you'll need next based on access patterns. Sequential array traversal is trivially predictable. A hash table lookup, or following pointer chains through a graph, is not.

### Backend

A service deserializes JSON into a nested object graph with scattered heap allocations. Under load, each request walks this graph — pointer chasing through ~20 allocations. The algorithmic complexity looks fine. But each traversal triggers L3 misses, and latency spikes at p99 in a way that doesn't correlate with CPU time. Flattening to a struct-of-arrays or an arena allocator can drop latency 3–5× without changing logic.

### SRE

You're profiling a Go or Java service that shows healthy CPU%, low GC pressure, reasonable throughput — but latency is higher than expected. `perf stat` reveals a high LLC (last-level cache) miss rate. This is often the actual bottleneck, not the code reviewers were focused on. Knowing to look at `cache-misses` alongside `instructions` and `cycles` changes what you reach for in a profile.

Cache effects are why data layout and access patterns matter as much as algorithm selection — and why understanding them unlocks reasoning about SIMD (which assumes contiguous, predictable data) and NUMA (where "close" cache now spans sockets).
