---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Write-Through vs Write-Behind Caching

Both strategies define *when* a write to cache propagates to your backing store — and that timing decision drives everything about consistency, throughput, and failure behavior.

---

**Write-Through**

Every write hits both the cache and the database before the operation is acknowledged. The cache and DB are always in sync by construction.

The cost is write latency: you're doing two sequential writes per operation, and the slower one (the DB) sets your ceiling. The benefit is zero divergence — if the cache node dies, no data was lost; the DB has everything.

This pattern makes sense when reads vastly outnumber writes (reads are fast; writes paying the extra round-trip is acceptable), and when stale data would be costly — think user account state, inventory counts, or anything tied to billing.

---

**Write-Behind (Write-Back)**

Writes go to cache immediately and are acknowledged. The flush to the backing store happens asynchronously — either on a timer, on eviction, or when a batch threshold is hit.

This unlocks much higher write throughput. You can absorb bursts, coalesce redundant writes (if the same key is written 100 times in a second, you might flush once), and keep your DB from being the bottleneck on hot write paths.

The tradeoff is durability risk. There's a window — potentially seconds or minutes — where cache holds data the DB doesn't. If the cache host crashes before flushing, those writes are gone. In practice, mitigations include write-ahead logs in the cache layer, replication, or restricting write-behind to data where loss is tolerable (metrics, event counters, session activity timestamps).

---

**Concrete model**

Think of it like a text editor. Write-through is auto-save on every keystroke — always durable, slightly annoying latency. Write-behind is saving to an in-memory buffer and flushing every 30 seconds — fast to type, but if power dies you lose recent work.

---

**In practice**

*Backend services:* Write-through is the safe default for transactional data. Write-behind shows up in high-throughput pipelines — leaderboards, like counts, analytics event accumulation — where eventual consistency is fine and you want to protect the DB from write storms.

*Data systems:* Most databases implement write-behind internally (write to buffer → WAL → disk). Redis in AOF mode gives you a knob for exactly this: `appendfsync always` (write-through equivalent) vs `appendfsync everysec` (write-behind with 1-second durability window). Knowing this helps you tune durability vs throughput at the infrastructure level, not just the application level.

One underappreciated risk with write-behind: cache eviction. If a dirty (unflushed) entry gets evicted under memory pressure before it's been persisted, it's silently gone. Good write-behind implementations track dirty state and either prevent eviction of unflushed entries or flush them on eviction.
