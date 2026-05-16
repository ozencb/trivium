---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## LSM-Trees (Log-Structured Merge-Tree)

LSM-Trees solve a fundamental bottleneck: random writes to disk are orders of magnitude slower than sequential writes. Instead of updating data in-place like a B-Tree, LSM-Trees convert all writes into sequential appends, trading read complexity for dramatically higher write throughput.

### Core Mechanism

Writes never go directly to disk structures. Instead:

1. **MemTable** — every write lands in an in-memory sorted structure (usually a red-black tree or skip list), plus a WAL for crash recovery.
2. **Flush** — when the MemTable hits a size threshold, it's written to disk as an **SSTable** (Sorted String Table): immutable, sorted, compact. This is one sequential write.
3. **Levels** — SSTables accumulate in levels (L0, L1, L2...). L0 is raw flushes; deeper levels are progressively larger and denser after compaction.
4. **Compaction** — background process merges SSTables, deduplicates keys (later version wins), and removes tombstones. This is where write amplification actually lives.

**Reads** check MemTable first, then each SSTable level newest-to-oldest. This is where Bloom filters come in — each SSTable carries one so you can skip files that definitely don't contain the key, avoiding most unnecessary disk reads.

### Mental Model

Imagine writing to a notebook instead of directly editing a sorted binder. When the notebook fills, you sort it and file it as a pamphlet. Periodically, you merge pamphlets to eliminate duplicates and keep the archive manageable. Finding something means checking your notebook first, then the pamphlets in order — more steps than a binder, but writing is vastly faster.

### Practical Connections

**Backend:** RocksDB (Meta, TiKV, CockroachDB's storage layer), LevelDB, Cassandra, and ScyllaDB all use LSM-Trees. When you hear "Cassandra is write-optimized," this is why — it never does in-place updates, so it handles write-heavy workloads without the random-I/O penalty B-Trees pay. The flip side is read latency is higher for cold data, and compaction can cause latency spikes.

**Data engineering:** Time-series DBs (InfluxDB, RocksDB-backed Kafka log compaction) lean heavily on LSM because data arrives in high-volume sequential bursts. Understanding compaction strategies (leveled vs. size-tiered) matters when tuning these systems — leveled compaction reduces read amplification, size-tiered optimizes write throughput.

### The Key Tradeoffs

| | LSM-Tree | B-Tree |
|---|---|---|
| Write | Sequential, fast | Random, slower |
| Read | Multiple SSTables to check | Single tree traversal |
| Space | Temporary duplicates until compaction | In-place, compact |

Understanding LSM-Trees is the prerequisite for reasoning about SSTable layout and why compaction strategies exist — those aren't implementation details, they're how you control the write/read amplification tradeoff at runtime.
