---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## SSTables (Sorted String Tables)

An SSTable is an immutable, on-disk file of key-value pairs sorted by key — the persistent storage format that LSM-Trees flush their in-memory memtable into. The "sorted" part is load-bearing: it's what makes efficient reads, merges, and compaction possible without random I/O.

### Core mechanism

When a memtable fills up, it's flushed to disk as an SSTable. The file has two logical sections:

1. **Data block** — the actual key-value pairs, sorted by key, written sequentially
2. **Index block** — a sparse index (e.g., every 16th key) that maps keys to byte offsets in the data block

Because the data is sorted, you only need to store a sparse index rather than a full one. To look up a key, you binary-search the index to find the nearest smaller key, then do a short linear scan in the data block. Bloom filters are typically layered on top to avoid reading SSTables that definitely don't contain a key.

Since SSTables are immutable, "updating" a key means writing a new SSTable with a newer entry — compaction later reconciles duplicates by merging sorted files (a k-way merge, like merge sort), keeping the most recent version and discarding tombstoned deletes.

### Mental model

Think of each SSTable as a sorted, sealed envelope. You can read it, but you can't modify it. When you have multiple envelopes, finding a key means checking each one (newest first, for recency) until you find it. Compaction is the process of opening all envelopes, merging the contents into a new sorted envelope, and discarding the old ones.

### Practical scenarios

**Backend (key-value stores, metadata services):** If you're building something like a feature flag service or a session store with high write throughput, LSM + SSTables lets you absorb writes cheaply (sequential memtable appends) while reads stay reasonable via bloom filters + sparse indexes. The tradeoff vs. B-trees is write amplification during compaction vs. read amplification at query time.

**Data (columnar engines, analytics):** Parquet files are conceptually cousins — immutable, sorted (within row groups), with embedded statistics/indexes. Understanding SSTables helps you reason about why engines like ClickHouse or RocksDB-backed systems behave the way they do under heavy ingest: write performance stays flat because you're always appending new SSTables, never doing in-place updates.

### Why this matters for compaction

SSTables being sorted is what makes compaction cheap — merging N sorted files is O(N·k) where k is entries per file, using a simple heap-based merge. If the files were unsorted, you'd need to sort before merging, making compaction far more expensive. The entire compaction strategy in LevelDB, RocksDB, and Cassandra flows from this property.
