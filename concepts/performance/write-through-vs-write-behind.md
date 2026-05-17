---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Write-Through vs Write-Behind Caching

Both strategies address the same core problem: when you write data, the cache and the backing store are momentarily out of sync. The question is *who bears the cost* of resolving that inconsistency, and when.

**Write-Through**

Every write goes to the cache and the backing store synchronously before the write is acknowledged to the caller. The invariant this buys you: cache and store are never diverged. If the process crashes after the write completes, nothing is lost. The cost is latency — every write now has the round-trip to the database in its critical path.

The mental model: write-through treats the cache as a read-optimization layer, not a write-optimization layer. Reads get fast; writes don't.

**Write-Behind (Write-Back)**

Writes are acknowledged after hitting the cache only. The cache marks the entry as "dirty" and flushes it to the backing store asynchronously — either on eviction, on a timer, or when a watermark is hit. The invariant you *lose*: between the write acknowledgment and the flush, that data exists only in memory. If the cache node dies, those writes are gone.

The throughput gain is substantial: you can coalesce many writes to the same key into a single store write, and you decouple write acknowledgment latency from disk/database latency entirely.

**Concrete example**

A user updates their profile 5 times in 30 seconds. Write-through sends 5 separate `UPDATE` queries. Write-behind accumulates all 5 in the cache, then flushes once — the database sees one write per 30s window. At scale, this difference is enormous.

**When to reach for each**

*Write-through* is the right default whenever data loss is unacceptable: financial records, user-generated content, audit logs. It's also simpler operationally — you don't need logic to flush dirty entries on shutdown or handle partial flushes.

*Write-behind* makes sense when writes are high-frequency and bursty, data has natural coalescing (counters, metrics, last-seen timestamps), and losing a few seconds of data is acceptable. Real-time analytics pipelines and session stores are common fits. Redis's `appendfsync everysec` mode is effectively write-behind — it trades one second of potential data loss for a significant I/O reduction.

**The real pitfall with write-behind** isn't the crash scenario most engineers think of first — it's consistency under concurrent reads. If node A has a dirty write and node B handles the read before the flush, B hits the store and returns stale data. You need to either route reads through the same cache node or accept that reads can be stale until flush time.

Write-through composes cleanly with cache-aside patterns you already know. Write-behind requires you to reason about flush ordering, partial failures during flush, and what "acknowledged" actually means to your clients.
