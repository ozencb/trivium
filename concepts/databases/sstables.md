---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## SSTables (Sorted String Tables)

An SSTable is a file on disk where key-value pairs are stored in sorted order, written once, and never mutated. LSM-tree engines (LevelDB, RocksDB, Cassandra) use them as the durable layer: the in-memory memtable flushes to a new SSTable when full, and that file is sealed forever.

### The Core Mechanism

The invariant that makes everything else work is **immutability**. Because an SSTable is never modified after creation, multiple readers can scan it concurrently without locks — there's no write that could race them. Crash recovery is trivial: either a file exists and is complete (verified by a footer/checksum), or it doesn't exist and you replay from the WAL. There's no partial-write state to reason about.

Inside the file, keys are sorted. This enables:
- **Binary search for point lookups** — most SSTables also embed a sparse index (every Nth key) so you seek to a block, not the beginning of the file.
- **Efficient range scans** — sequential disk reads, which are fast on both HDDs and SSDs.
- **Merge operations** — two sorted files can be merged in O(n) with a single pass, which is exactly what compaction does.

A typical layout: a series of compressed data blocks, followed by an index block mapping key ranges to block offsets, followed by a Bloom filter (to short-circuit lookups for absent keys), followed by a footer pointing to the index and filter.

### Mental Model

Think of an SSTable as an immutable sorted array that got serialized to disk. The "sorted" property is what lets you merge N of them efficiently during compaction — it's just the merge step of merge sort, which is why LSM compaction can run as a background process without blocking writes.

### Practical Scenarios

**Backend:** When you query a key in RocksDB, it checks the memtable, then each level's SSTables newest-first, stopping at the first hit. Bloom filters make the "not found in this file" check O(1), so reads don't degrade catastrophically even with many files at L0. If your read latency is high, it's often because too many L0 SSTables exist (compaction is falling behind writes).

**Data:** In systems like Bigtable or HBase, SSTables are why range scans over row keys are fast — the storage layer materializes a sorted layout on flush. Your choice of row key design directly affects whether you get sequential SSTable reads or scattered seeks across files. Time-series data stored with a timestamp prefix gets locality for free.

---

SSTables are the reason LSM trees can make writes fast (sequential, append-only) without sacrificing read correctness — the sorting and immutability are what compaction uses to periodically restore read efficiency.
