---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Memory Allocator

When your code calls `malloc` or `new`, something has to decide *which* bytes on the heap you get and track what's free when you call `free`. That's the allocator. The choice of allocator — and how well it fits your allocation patterns — can be the difference between 50% CPU spent in allocation overhead versus 2%.

### The core mechanism

The OS hands memory to your process in large chunks (via `mmap`/`brk`). The allocator's job is to carve that up efficiently and recycle it. The naive approach — one global list of free chunks — creates a bottleneck the moment you have multiple threads competing for it.

Modern allocators solve this with **thread-local caches**: each thread gets a private pool of pre-sized free blocks to pull from without taking a lock. When a thread's local pool is exhausted, it refills from a shared arena. `tcmalloc` (Google) and `jemalloc` (Facebook/FreeBSD) are built around this architecture. The default Linux allocator, `ptmalloc2` (glibc's `malloc`), does something similar but with fewer arenas and historically more fragmentation under certain workloads.

The deeper problem is **fragmentation**. External fragmentation is when free memory exists but not in the right contiguous shape for a request. Internal fragmentation is when you request 17 bytes and get a 32-byte bucket — the 15 bytes are "allocated" but wasted. Allocators use **size classes** (fixed bucket sizes like 8, 16, 32, 48... bytes) to bound internal fragmentation and make recycling fast.

### Mental model

Think of a warehouse with shelves labeled by box size. Returning a box goes back to its shelf, not into a general pile. Finding a box for a new request is O(1) — grab from the right shelf. The tradeoff: if your requests cluster around sizes that don't align with the shelves, you waste space.

### Backend relevance

In a service doing heavy JSON parsing or maintaining a large object pool (think: per-request allocation of many small structs), allocator overhead shows up in profiling as a significant fraction of wall time. Switching from ptmalloc2 to jemalloc often requires nothing more than `LD_PRELOAD` and can yield 10-30% throughput gains on allocation-heavy paths. This is a real production lever, not theoretical.

Also worth knowing: **heap fragmentation accumulates over time**. A long-running process that allocates and frees objects of varying sizes can end up with a heap that's 2-3x larger than the live set, because free blocks exist but aren't contiguous with what the OS can reclaim. jemalloc exposes metrics for this (`stats.allocated` vs `stats.mapped`).

### SRE relevance

RSS (resident set size) growth that isn't matched by actual data growth is often fragmentation, not a leak. If a service's memory climbs steadily and then plateaus at some multiple of what you'd expect, suspect the allocator before spending hours hunting a leak. Tools like `jemalloc`'s built-in heap profiling (`MALLOC_CONF=prof:true`) let you see allocation sites without recompiling. For ptmalloc2, `malloc_info()` and `mallinfo()` give aggregate stats.
