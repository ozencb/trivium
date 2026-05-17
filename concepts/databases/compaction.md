---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## LSM Compaction

Because LSM-Trees are append-only, every overwrite and delete leaves dead data behind in immutable SSTables. Compaction is the background process that merges those files, discards stale versions and tombstones, and keeps the number of files from growing without bound—which would otherwise make reads arbitrarily expensive.

### The core mechanism

When you write to an LSM store, data flows: MemTable → L0 SSTables → compaction. Compaction takes a set of SSTables, merges them via a k-way merge (same as merge sort across sorted runs), and writes a new, consolidated file. During the merge it applies the log of mutations: if key `foo` appears in multiple SSTables, only the most recent version survives; if there's a tombstone, the key is dropped entirely. The input files are then deleted.

The critical design choice is *which* files to merge and *when*.

### Size-tiered vs. leveled

**Size-tiered** (Cassandra's default for most tables): Group SSTables by similar size; when you accumulate enough in one size bucket, merge them into a larger file. Simple and write-efficient—data moves through fewer compaction cycles. The downside: at any moment, multiple SSTables can hold overlapping key ranges, so a point read may touch several files. Space amplification is also high (you can briefly hold 2× the live data during a merge).

**Leveled** (RocksDB's default, Cassandra's `LeveledCompactionStrategy`): SSTables are organized into levels (L0–Ln). Within each level L1+, key ranges are non-overlapping—exactly one SSTable per level covers any given key. L0 files flow into L1 via compaction; L1 into L2, and so on, with each level ~10× larger than the previous. A point read touches at most one file per level, so read amplification is bounded (typically 4–6 levels). Trade-off: much higher write amplification—data gets rewritten level by level.

A useful mental model: size-tiered is like tossing papers into piles by size and consolidating piles occasionally; leveled is like a filing cabinet where each drawer has non-overlapping labeled folders.

### Where this matters in practice

**Backend:** If you're tuning a Cassandra cluster for a time-series or event-log use case (high write throughput, mostly sequential reads), size-tiered is usually the right default. If you're doing random reads across historical data, switch to leveled.

**Data systems:** RocksDB is the storage engine under TiKV, MyRocks, CockroachDB, and Pebble. When those systems exhibit high read latency under write load, compaction lag is usually the first suspect—write rate outpaced compaction throughput, and the L0 file count blew up.

### Common pitfalls

- **Compaction debt:** If writes consistently outpace compaction, L0 file count grows until RocksDB stalls ingestion (the `l0_stop_writes_trigger`). Monitor L0 file count.
- **Compaction storms:** A burst of compaction consuming all disk I/O starves foreground reads/writes. Rate-limit compaction I/O, but not so aggressively that debt accumulates.
- **Tombstone buildup:** In Cassandra, tombstones only disappear once they've been seen by compaction *and* their gc_grace_seconds have expired. Heavy deletes in size-tiered without enough compaction pressure leads to tombstone warnings and eventually read failures.
