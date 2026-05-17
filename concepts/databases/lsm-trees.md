---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## LSM-Trees

LSM-Trees solve a fundamental storage problem: random writes to disk are slow, but your data still needs to be queryable. The core insight is to convert all writes into sequential I/O by buffering in memory and flushing sorted immutable files, accepting that reads become more expensive as a result.

### The Mechanism

Every write hits an in-memory sorted structure called the **MemTable** (typically a red-black tree or skip list). Simultaneously, it's appended to a **Write-Ahead Log** (WAL) for durability — sequential I/O, essentially free. When the MemTable fills, it's flushed to disk as an **SSTable** (Sorted String Table): an immutable, sorted, sequential file. This flush is also sequential.

The problem is that reads now require checking the MemTable plus potentially every SSTable on disk. This is read amplification. The solution is **compaction**: a background process that merges SSTables, deduplicates (keeping the latest version of each key), and removes tombstones for deleted keys. LevelDB/RocksDB use a leveled approach where L0 allows overlapping key ranges but L1+ enforce the invariant that SSTables within a level have non-overlapping ranges — this bounds how many files you scan per read.

This is where your bloom filter knowledge matters directly: each SSTable carries a bloom filter so reads can skip files that definitely don't contain the key. Without this, read amplification would make LSM-Trees impractical for point lookups.

### Mental Model

Think of it as the difference between writing in a scratch pad (MemTable) and periodically organizing notes into sorted filing cabinets (SSTables), with a librarian (compaction) periodically consolidating cabinets and discarding duplicates. You never erase anything in-place — you only append and merge.

Contrast with B-Trees, which update pages in-place on disk. B-Trees are well-suited for read-heavy or mixed workloads because the tree structure gives O(log n) point lookups. LSM-Trees win when write volume is high enough that random I/O becomes the bottleneck.

### Where This Shows Up

**Backend:** Any time you're choosing a storage engine for a write-heavy service — event ingestion, audit logging, time-series data — you're implicitly making this tradeoff. Cassandra, RocksDB (used inside MySQL MyRocks, TiKV, CockroachDB), and InfluxDB all use LSM-Trees. When you hear "write amplification factor of 10x" in a database tuning conversation, that's the compaction overhead being quantified.

**Data:** Column stores used in analytics pipelines (like Parquet on top of object storage) share DNA with SSTables — immutable sorted files that get merged. Understanding LSM-Trees makes the design of Hudi, Delta Lake, and Iceberg's merge-on-read vs. copy-on-write strategies immediately intuitive.

The senior-engineer differentiator here is knowing *why* the tradeoff exists — not just "LSM for writes, B-Tree for reads," but that you're trading write amplification during compaction for eliminating random-write I/O on the hot path, and that compaction tuning (level multiplier, compaction strategy) is where most production performance problems live.
