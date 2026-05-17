---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

The OS treats free RAM as a transparent cache layer between your process and the disk — every file read goes through it, and the kernel manages population and eviction automatically without any application awareness.

**Mechanism**

When you call `read()` on a file, the kernel checks if those file blocks are already mapped into the page cache (backed by physical RAM pages). On a miss, it reads from disk into cache pages, then copies to your buffer. On a hit, it copies directly from RAM — no disk I/O. Writes in write-back mode update the cache page and mark it dirty; the kernel flushes to disk asynchronously via `pdflush`/`writeback` threads.

The critical invariant: cache pages are indexed by `(inode, offset)`, so two processes reading the same file share the same physical pages. The OS doesn't double-buffer.

Free RAM is just unused cache. On Linux, `free` showing near-zero "free" memory with high "buff/cache" is not memory pressure — it's the system working correctly. The kernel will evict clean cache pages under actual memory pressure with zero cost (dirty pages require a flush first).

**Concrete model**

Think of it as a hash map keyed by file block address, stored in RAM. First read = cache miss → disk read + populate. Every subsequent read = cache hit → memcpy speed (~10GB/s vs ~500MB/s for NVMe, orders of magnitude worse for spinning disk).

**Backend**

This is why cold-start latency on a fresh deploy or after a restart differs dramatically from steady-state. A Go or Java service reading config files, templates, or static assets pays full disk cost once, then operates at memory speed. If your benchmark shows "slow first request, fast subsequent" — you're seeing cache warm-up. Applications that `mmap` files (common in databases) exploit this directly: the OS page fault mechanism *is* their caching layer.

**SRE**

`/proc/meminfo`'s `Cached` field tells you how warm your cache is. After a host restart or failover, services that read large datasets (logs, config, ML model weights) will have cold caches — expect elevated latency until they warm. This is why rolling restarts in stateful clusters need careful pacing. Tools like `vmtouch` let you explicitly warm or evict specific files, useful for pre-warming before a traffic shift or verifying what's actually cached. `sar -B` and `page-cache-hit-rate` from `bcc-tools` give you miss rates in production.

**Connection forward**

Database buffer pools (Postgres `shared_buffers`, InnoDB buffer pool) are essentially application-managed page caches. They exist because the kernel's LRU eviction policy doesn't understand query access patterns — a sequential scan shouldn't evict hot index pages. Understanding the OS page cache makes it clear why databases tune their own buffer pools rather than relying on the kernel's.
