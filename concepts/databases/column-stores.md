---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Columnar Storage

Row-oriented databases store each record contiguously on disk—all fields of a row together. Columnar storage inverts this: each column is stored contiguously, so scanning a column means sequential reads with no wasted I/O on fields you don't need.

**The core mechanism**

When a query like `SELECT AVG(revenue) FROM orders WHERE year = 2024` runs on a row store, the engine reads every row into memory—including `customer_id`, `shipping_address`, `notes`, and everything else—then discards all but `revenue` and `year`. On a table with 50 columns, you're reading ~50× more data than necessary.

In a column store, `revenue` and `year` live in separate byte arrays. The engine fetches only those two columns, reads them sequentially (friendly to prefetchers and OS page cache), and never touches the other 48. The I/O reduction is the entire point.

**Two invariants that make this work**

1. **Compression is dramatically more effective per column.** A column of integers or a low-cardinality string column (e.g., `status` with 5 possible values) compresses at ratios impossible for mixed-type rows. Run-length encoding, dictionary encoding, and delta encoding all exploit this. Parquet files, for instance, often achieve 5–10× compression on real data.

2. **SIMD and vectorized execution.** Because a column is a typed, densely packed array, the CPU can apply operations across many values per instruction. Aggregations and filters become tight loops on homogeneous memory—fundamentally different from row-by-row tuple processing.

**Mental model**

Think of a spreadsheet. A row store is like reading the file row by row. A column store is like reading the entire column A, then column B—except the file is physically laid out that way, so it maps directly to sequential disk reads.

**Where this matters in practice**

*Data/analytics:* This is why Redshift, BigQuery, Snowflake, and ClickHouse are fast for OLAP workloads. The query `GROUP BY region, month` over a billion rows is feasible because you're reading ~2 columns, not 30.

*Backend:* If you're designing a service that needs to answer aggregation queries over large append-only event logs, choosing columnar format (Parquet on S3, ClickHouse, DuckDB) versus a general-purpose RDBMS isn't just a performance choice—it's a 100× cost and latency difference at scale.

**The tradeoff that matters in interviews**

Columnar storage is hostile to point lookups and writes. Fetching a single row requires reading from N separate column files and reconstructing it. Updates are expensive because changing one field touches one column's file. This is why hybrid approaches exist (like Snowflake's micro-partition clustering or Delta Lake's row group caching)—they amortize the write cost while preserving read efficiency. Knowing *why* the tradeoff exists, not just that it does, is what distinguishes an architectural answer from a trivia answer.
