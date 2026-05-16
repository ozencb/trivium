---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## LSM Compaction

LSM-Trees deliver fast writes by appending data sequentially and deferring organization. Compaction is the background process that pays that deferred cost — merging accumulated SSTables into fewer, cleaner ones to bound read costs and reclaim space.

### The Core Mechanism

Every flush from the MemTable produces a new immutable SSTable on disk. Without intervention, you'd eventually have thousands of them, and reading a key requires checking each one (mitigated by bloom filters, but not eliminated). Worse, the same key may exist in dozens of SSTables — each write or delete creates a new entry without touching older ones.

Compaction runs a multi-way merge sort across SSTables, emitting a new SSTable with only the latest version of each key. Tombstones (delete markers) are dropped once compaction confirms no older SSTables could still hold that key.

The two dominant strategies differ in *how* they organize levels:

**Size-Tiered (STCS):** Groups SSTables by size. When you accumulate N files of similar size, merge them into one larger file. Simple, write-efficient, but at any point multiple SSTables can cover the same key range, so reads remain expensive and space amplification is high (you may hold 2–3x the live data size during compaction).

**Leveled (LCS):** Files are organized into levels (L0, L1, L2…). L0 allows overlapping key ranges (it's just flushed MemTables), but L1 and beyond enforce non-overlapping ranges within each level. To move a file from L_n to L_{n+1}, it's merged with every L_{n+1} file whose key range it overlaps. This keeps reads fast (check at most one file per level) but causes significantly higher write amplification — one logical write may trigger cascading merges through multiple levels.

### Mental Model

Think of STCS like an inbox that you periodically batch-process: cheap to add, expensive to search. LCS is like a filing cabinet with strict alphabetical order per drawer — finding anything is fast, but filing requires reshuffling existing folders.

### Practical Implications

**Backend:** If your service has bursty writes followed by read-heavy periods (e.g., ingesting event logs, then querying), size-tiered compaction handles ingestion better. If you have mixed workloads with latency-sensitive reads (e.g., user-facing APIs on top of RocksDB), leveled compaction is worth the write amplification.

**Data:** For analytics pipelines writing time-series or append-only data, FIFO compaction is often enough — just drop the oldest SSTables when you hit a size cap. For OLTP-style data with frequent updates and point lookups, leveled compaction is the default in RocksDB and LevelDB for a reason.

The central tension is the **RUM conjecture**: you can optimize for at most two of read amplification, update (write) amplification, or memory/space overhead. Compaction strategy is essentially where you declare your priorities.
