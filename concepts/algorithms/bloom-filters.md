---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Bloom Filters

A Bloom filter answers one question—"have I seen this before?"—using a fraction of the memory a hash set would require. The tradeoff is asymmetric: it can say "definitely not" with certainty, but "yes" means "probably yes, with some false positive rate you control at construction time."

### The mechanism

Underneath, it's a bit array of size `m` and `k` independent hash functions. To insert an element, you run it through all `k` hashes, each producing an index into the array—set those bits to 1. To query, run the same `k` hashes: if *any* bit is 0, the element was never inserted (guaranteed). If all bits are 1, it was *probably* inserted—another element could have set those same bits.

There's no delete in the basic structure. Once a bit is set, you can't unset it without invalidating other elements that share it. (Counting Bloom filters extend this, replacing bits with counters, but at a memory cost.)

The false positive rate is deterministic given `m`, `k`, and the number of elements inserted `n`. The optimal `k` is `(m/n) * ln(2)`. At 10 bits per element with optimal `k`, you get roughly 1% false positives. At 1 byte per element, it's ~0.3%. A hash set storing the same data might use 50–200 bytes per element.

### Mental model

Picture a concert venue stamp check. The stamp proves you paid, but two guests could theoretically have identical stamps (collision). The bouncer can definitively say "no stamp, no entry" but occasionally lets through a gate-crasher with an accidentally matching stamp. You accept that rare false admission to avoid maintaining a massive guest list.

### Where this matters in practice

**Backend:** API rate limiting and deduplication at scale. Before hitting Redis or Postgres to check if a request ID was already processed, a Bloom filter in memory eliminates the I/O for the ~99% of requests that are clearly new. LinkedIn and Cassandra use this pattern extensively.

**Data:** This is the foundational concept behind LSM-tree read optimization. In RocksDB or LevelDB, each SSTable file has an associated Bloom filter. When you read a key, the engine checks the filter before doing any disk I/O. If the filter says "definitely not here," skip the file entirely—this is what makes point lookups on write-optimized storage tolerable.

**Content deduplication:** Crawlers (Googlebot, Common Crawl) use Bloom filters to avoid re-crawling URLs. The dataset is billions of URLs; a hash set would require terabytes.

### The invariant to hold onto

The false positive rate increases as you insert more elements than the filter was sized for. Bloom filters aren't magic—they're a deliberate, tunable tradeoff. Size them at construction time based on expected cardinality and your acceptable FP rate, and they're one of the most practical data structures in systems work.
