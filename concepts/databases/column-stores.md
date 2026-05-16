---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Columnar storage reorganizes how a database physically lays out data on disk — instead of storing all fields for a row together, it stores each column's values contiguously. This makes analytical queries over large datasets dramatically faster because you only read the columns you actually need.

## The Core Mechanism

In a traditional row-oriented store (Postgres, MySQL), a table row is a contiguous block on disk: `[id, name, age, salary, department, ...]`. To compute `AVG(salary)`, the engine reads every row in full, even though it only cares about one field.

Columnar storage flips this. All salary values live together: `[50000, 72000, 91000, ...]`. Now `AVG(salary)` reads only that column's pages — potentially 10-100x less I/O depending on table width.

Two additional properties compound this:

**Compression**: Values in a column are often the same type and have similar cardinality. A `department` column with 5 distinct values across 10M rows compresses extremely well (run-length encoding, dictionary encoding). Row stores compress poorly because adjacent bytes are from different types.

**Vectorized execution**: Modern columnar engines (DuckDB, Snowflake, ClickHouse) process columns in batches — feeding tight loops of integers directly to SIMD instructions. No per-row dispatch overhead.

## Concrete Mental Model

Think of a spreadsheet. Row-oriented = reading across rows. Columnar = reading down columns. If you need column D of 1M rows, row-oriented means skipping columns A, B, C for every single row. Columnar means one sequential read.

## Where This Matters

**Analytics / OLAP**: Any "give me aggregates over this dimension" query benefits enormously. Filter by country, group by product, sum revenue — each step touches 2-3 columns out of 50. Columnar makes this the fast path, not the slow one.

**Backend data pipelines**: If you're writing ETL jobs that read Parquet files (columnar format), projection pushdown means your file reader literally skips byte ranges for unneeded columns before anything hits memory. A 200-column wide Parquet file read for 3 columns costs roughly what a 3-column file costs.

**The tradeoff**: Writes and point lookups are more expensive. To insert one row, you must append to N column files. To read a full row, you reassemble from N locations. This is why OLTP databases stay row-oriented — writes and primary key lookups dominate their workload.

Most production analytics systems today use columnar formats at rest (Parquet, ORC, Arrow) even when queried through SQL abstractions — the storage format is the performance lever, independent of the query interface.
