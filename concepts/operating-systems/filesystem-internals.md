---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**Filesystem Internals**

A filesystem's core job is maintaining consistency — ensuring that even if power dies mid-write, the on-disk structure stays coherent. Three mechanisms carry the weight: journaling handles crash recovery, extent trees manage where data lives, and block allocation balances fragmentation against write amplification.

**The Core Mechanism**

Before writing actual data, a journaling filesystem writes intent to a circular log (the journal). Once that's fsync'd, the real write happens. On crash recovery, the kernel replays incomplete journal entries or discards them — either way, the filesystem lands in a known-good state. This is the same invariant as write-ahead logging in databases: commit the log before mutating state. The tradeoff is *write amplification*: every write is at least two writes. `ext4` defaults to `ordered` mode — only metadata goes to the journal, data writes happen before the journal commit. Full `data=journal` mode doubles every data write but gives stronger guarantees.

Extent trees replace the old block-pointer model (indirect blocks in `ext2/3`). Instead of storing a list of every block, an extent stores a (start\_block, length) pair. A 1GB file that's contiguous fits in a single extent rather than ~256K block pointers. `ext4`'s extent tree is a B-Tree embedded in the inode, giving O(log n) lookup and dramatically reducing metadata overhead for large sequential files. The cost: extents assume contiguous allocation, so fragmentation hurts more than with block lists.

Block allocation is where fragmentation is either created or prevented. `ext4`'s multi-block allocator tries to place new blocks near existing ones (locality) and delays allocation until flush time (delayed allocation), coalescing small writes into large extents. This is why `ext4` performs well for sequential workloads but can surprise you: delayed allocation means data exists in the page cache without a guaranteed disk location until writeback, so a crash after `write()` but before `fsync()` can lose data even with journaling.

**Practical Scenarios**

*Backend*: If you're writing a database on top of a filesystem, you're essentially reimplementing journaling. Postgres's WAL and `ext4`'s journal can interact badly — `fsync()` calls in Postgres are ensuring the filesystem journal has flushed, not just that Postgres's WAL is durable. This is why Postgres had the `fsync` bug where errors were silently swallowed.

*SRE*: Filesystem choice matters under write-heavy workloads. `xfs` handles large files and parallel writes better than `ext4` because its allocation groups allow concurrent allocation without a global lock — relevant if you're running high-throughput logging or object storage.

*DevOps*: `noatime` mount option eliminates a metadata write on every read. On containers with high inode churn (many small ephemeral files), `dir_index` (htree directories) and tuning inode count at mkfs time prevents "disk full" errors even when blocks remain.

The mental model: a filesystem is a database with a fixed schema (inodes, extents, bitmaps) where the journal is the WAL. Everything else is optimization around that core invariant.
