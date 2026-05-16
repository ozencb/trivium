---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Page Cache

The kernel caches file I/O in RAM so repeated reads skip the disk entirely. This happens automatically, transparently, and consumes all available "free" memory — by design.

### The mechanism

When you call `read()` on a file, the kernel checks an in-memory index keyed by `(inode, byte offset)`. On a hit, it copies from RAM. On a miss, it reads from disk, stores those pages in the cache, then copies to your buffer. Writes go to the cache first (marking pages "dirty"), and a background kernel thread (`writeback`) flushes them to disk asynchronously.

The critical insight: the page cache isn't a separate layer bolted onto virtual memory — it *is* virtual memory. The kernel uses the same physical pages for both. When you `mmap()` a file, you're mapping page cache pages directly into your address space. No copy. That's the entire reason mmap can outperform `read()` for large files.

### Mental model

Treat RAM as a transparent LRU cache for the disk, managed entirely by the kernel. The kernel will greedily fill all available RAM with cached file pages. On Linux, `free -h` shows this as "buff/cache" — that memory isn't wasted, it's working. The OS evicts pages under memory pressure, prioritizing resident application data over cached file data.

### Practical implications

**Backend**: When Postgres says a query is fast despite low `shared_buffers`, the OS page cache is often the reason — the kernel has those table/index pages cached from a prior scan. You're getting two cache layers: Postgres's buffer pool (userspace, smarter eviction policy) sitting on top of the kernel's page cache (kernel space, LRU). Over-sizing `shared_buffers` relative to your working set can actually *hurt* if it crowds out page cache for other processes.

**SRE**: Post-deploy slowness isn't just JIT warmup — it's cold page cache. After a restart, every file read goes to disk until the OS repopulates the cache. If you're capacity-planning and see "free" RAM on a production box, check `/proc/meminfo`'s `Cached` field — that RAM is load-bearing. Shrinking it (e.g., adding a memory-hungry sidecar) has a real latency cost on the first traffic wave. Tools like `vmstat 1` and `iostat` will show the disk reads spike during warmup in ways that don't show up in app-level metrics.

### Why this unlocks what comes next

Database buffer pools exist because the kernel's LRU eviction is access-pattern-agnostic — it can't distinguish a one-time sequential scan from a hot index page. A DB can pin critical pages and implement smarter policies. And `mmap` performance makes sense once you see that it's just removing the copy step between the page cache and your address space.
