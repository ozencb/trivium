---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Compression Algorithms

Compression finds repeated patterns in data and replaces them with shorter references, then reconstructs the original on read. The tradeoff is always the same: CPU time now vs. bytes on wire or disk.

### Core Mechanism

Most modern compressors use some variant of **LZ77**: scan a sliding window of recent bytes, and when you see a sequence you've seen before, emit a (distance, length) pointer instead of the literal bytes. "The the the" becomes "the " + pointer(4 back, 4 bytes) + pointer(4 back, 4 bytes). Entropy coding (Huffman or ANS) then compresses the token stream further by assigning shorter codes to more frequent symbols.

The algorithms differ mainly in how aggressively they search for matches and how sophisticated the entropy stage is:

- **LZ4/Snappy**: shallow match search, no entropy stage. Compress/decompress at memory bandwidth speeds (~500MB/s+). You're barely doing work.
- **Zstd**: deep match search + dictionary support + ANS entropy. Gets 30-50% better ratios than LZ4 at maybe 3-5x the CPU cost — still fast enough for most hot paths.
- **Brotli/gzip**: tuned for static assets. Brotli has a built-in dictionary of common web tokens. You pay high compression cost once at build time, serve forever.

### Mental Model

Think of it as a spectrum with speed on one axis and ratio on the other. LZ4 sits at one corner — you're almost just memcpy'ing. Brotli sits at the other — you'd never use it for a streaming database WAL. Zstd occupies the pragmatic middle and has made gzip largely obsolete for anything you're compressing at runtime.

### Where You'll Actually Use This

**Backend:** Kafka and gRPC both support Snappy/Zstd natively. Zstd is the right default for message queues — at 100K events/sec, a 40% size reduction meaningfully affects broker disk I/O and replication bandwidth. LZ4 makes sense when you're already CPU-bound.

**Data:** Columnar formats (Parquet, ORC) compress per-column, not per-row. A column of timestamps compresses dramatically better than mixed-row data. Snappy is the default in most Spark configs; switching to Zstd often cuts file sizes 20-30% with negligible query impact.

**SRE:** nginx/CDN-level Brotli for static assets is a one-time config change that shrinks JS bundles 15-25% vs. gzip. For logs shipped to S3 or Loki, Zstd is the current best practice — better ratio than gzip, faster decompression when you actually need to query something.

### Common Pitfalls

Compressing already-compressed data (JPEG, MP4, zip) wastes CPU and often increases size slightly. Mixing compression schemes across a pipeline (Snappy at ingest, gzip at rest, uncompressed in-memory) adds invisible overhead at each boundary. And decompression speed matters as much as compression — LZ4 decompresses at ~4GB/s, which is why it's preferred for read-heavy caches even when write compression is slower.
