---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Database Buffer Pool

The buffer pool is the database engine's own managed page cache—distinct from the OS page cache—giving the engine full authority over eviction ordering, dirty-page flushing, and transactional pinning. Without this control, the engine can't enforce the write ordering invariants that durability depends on.

**Core mechanism**

The buffer pool is a fixed region of memory divided into frames, each the same size as a disk page (commonly 8 KB or 16 KB). A page table maps `(tablespace_id, page_id) → frame`. Each frame carries two critical bits of metadata: a **pin count** and a **dirty flag**.

When a thread needs a page, it checks the page table. On a miss, it selects a victim frame via the replacement policy (InnoDB uses a two-sublist LRU variant—"young" and "old" zones—to prevent large scans from evicting hot pages), evicts it after flushing if dirty, then loads the target page. The frame's pin count is incremented before the caller touches it and decremented on release. The eviction path cannot select a pinned frame.

The dirty flag means: the in-memory copy diverges from disk. Dirty pages are flushed either at checkpoint or under eviction pressure—but never arbitrarily. The engine controls exactly when and in what order pages hit disk, which is what makes durability possible.

**Mental model**

Think of it as a hash map of `page_id → frame` with an LRU eviction queue and a write queue for dirty frames. A B-Tree traversal pins the root, fetches a child (possibly evicting something else), unpins the root, pins the child, and so on down. The leaf write marks a frame dirty—that mutation lives only in memory until something forces a flush.

**In practice**

- **Backend**: Buffer pool hit rate (`Innodb_buffer_pool_reads` vs. `read_requests`) should be >99% under normal load. A drop signals either pool starvation or a scan polluting hot pages. Increasing `innodb_buffer_pool_size` is often the highest-ROI tuning action.

- **SRE**: After a crash or restart, the buffer pool is cold. Query latency spikes until the working set is reloaded—this is why warm-up scripts and slow traffic ramp-ups exist post-deploy. MySQL 5.7+ can persist the LRU list across restarts to accelerate recovery.

- **Data**: Analytical workloads do large sequential scans that churn through frames. InnoDB's old-sublist mechanism limits this, but on OLTP systems running ad-hoc analytical queries, buffer pool thrash is a real incident cause.

**Connection to WAL**

The buffer pool enforces the WAL invariant at eviction time: before a dirty frame can be written to its data file, the log records covering those changes must already be durable. This is the steal/no-force policy—the engine *can* evict dirty pages (steal) and *doesn't* have to flush them on commit (no-force)—but log-before-data ordering is never violated. That's why WAL only makes sense once you understand the buffer pool's eviction path.
