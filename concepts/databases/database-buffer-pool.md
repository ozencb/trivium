---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Database Buffer Pool**

The buffer pool is a chunk of memory the database engine manages itself to cache disk pages — separate from and more powerful than the OS page cache because the database controls exactly when and how data moves in and out.

---

**Core mechanism**

Database files are divided into fixed-size pages (8KB in MySQL InnoDB, 8KB default in Postgres). The buffer pool holds a subset of these pages in memory as *frames*. When a query needs a page, the engine checks the pool first (buffer hit); on a miss, it reads from disk and loads the page into an available frame.

The key distinction from a dumb cache: the buffer pool tracks *dirty pages* — pages modified in memory but not yet written back to disk. The engine decides when to flush them, not the OS. This is non-negotiable for correctness: the database must control flush order to maintain durability guarantees (which is exactly why this is a prerequisite for understanding WAL).

Eviction uses LRU or a clock-sweep variant, but with a twist: sequential full-table scans get special treatment. Without scan resistance, a single `SELECT *` on a large table would evict every hot OLTP page. Databases handle this by putting scan pages at the tail of the LRU list immediately, so they're evicted first.

---

**Mental model**

Imagine the buffer pool as a whiteboard. Disk is a filing cabinet. When you need a document, you photocopy it onto the whiteboard. When the whiteboard fills up, you erase the least recently used section — but if you scribbled on it (dirty page), you copy those changes back to the filing cabinet first. The critical part: *you* decide when to copy back, not whoever cleans the room.

---

**Practical scenarios**

**Backend**: That slow query after a deployment or failover? Cold buffer pool — every page is a disk read. InnoDB can persist the buffer pool across restarts (`innodb_buffer_pool_dump_at_shutdown`); Postgres can't natively. This is why some teams artificially warm the pool post-restart.

**Data**: Running heavy analytical queries on an OLTP primary will trash its buffer pool by flooding it with scan pages, causing latency spikes on concurrent transactional queries. This is the mechanistic reason to route analytics to a replica, not just "don't stress the primary."

**SRE**: `innodb_buffer_pool_size` (MySQL) and `shared_buffers` (Postgres) are the highest-leverage tuning knobs in the database. Buffer hit ratio (hits / total reads) should be above 99% for OLTP workloads. If it's not, you're I/O-bound not CPU-bound, and adding memory will help more than query tuning.

---

The reason this unlocks WAL: before the buffer manager can flush a dirty page, it must guarantee the WAL record for that change is already on disk. That ordering constraint — log before data — is the WAL protocol, and the buffer pool is where it's enforced.
