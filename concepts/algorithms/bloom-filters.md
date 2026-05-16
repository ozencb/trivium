---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

A Bloom filter answers the question "is this element in the set?" with a guarantee on one side: if it says **no**, it's definitely right. If it says **yes**, it might be wrong. That asymmetry — no false negatives, possible false positives — is the whole point.

## The Mechanism

Under the hood: a bit array of size *m* (all zeros initially) and *k* independent hash functions.

**Inserting** an element: run it through all *k* hash functions, each producing an index into the array. Set those *k* bits to 1.

**Querying** an element: run it through the same *k* functions, check all *k* bit positions. If *any* bit is 0 → the element was never inserted (a zero can't have been set by this element). If *all* bits are 1 → the element *probably* was inserted, but those bits may have been set by different elements colliding.

This is why false negatives are impossible: insertion always sets bits, so a real member will always see all its bits as 1. False positives happen when hash collisions conspire to make an absent element look present.

The false positive rate is tunable — it's a function of *m* (array size), *k* (number of hash functions), and *n* (elements inserted). Larger array = lower collision probability. There's a sweet spot for *k* given *m* and *n*.

## Concrete Mental Model

Ten bits, two hash functions. You insert "alice" — bits 3 and 7 flip to 1. You insert "bob" — bits 1 and 7 flip. Now query "charlie": its hashes land on positions 1 and 3, both already 1. False positive — Charlie's never been seen, but the bits were set by Alice and Bob. Query "dave": lands on 2 and 5, bit 2 is still 0. Definitely absent. Correct.

## Where This Actually Shows Up

**Backend services**: Before hitting a database or cache to check existence (does this user ID exist? has this idempotency key been seen?), a Bloom filter can short-circuit the lookup entirely when the answer is "no." At high QPS, eliminating even 90% of "definitely not there" DB calls is significant.

**Data systems — the LSM-Tree connection**: This is exactly why LSM-Trees (RocksDB, Cassandra, LevelDB) are read-viable despite storing data across many sorted files (SSTables) on disk. Each SSTable has a Bloom filter. On a read, the engine checks each file's filter before doing any I/O. If the filter says the key isn't there, skip the file entirely. Without this, a read would scan potentially dozens of files. With it, most files are eliminated in microseconds, making the read path O(1) amortized in the common case.

The tradeoff you're always making: a small, fixed memory budget (often just a few bits per element) buys you probabilistic membership testing at near-zero cost per query.
