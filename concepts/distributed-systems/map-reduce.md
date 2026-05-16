---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## MapReduce

MapReduce is a programming model for processing large datasets in parallel across a cluster by breaking computation into two phases: **map** (transform records independently) and **reduce** (aggregate results). It exists because a single machine can't process terabytes of logs or billions of records in reasonable time, and writing distributed code from scratch is error-prone — MapReduce handles fault tolerance, data locality, and coordination for you.

### The Core Mechanism

The framework does three things:

1. **Map**: Each worker receives a chunk of input and emits `(key, value)` pairs. Workers run entirely independently — no coordination, no shared state.
2. **Shuffle**: The framework groups all emitted pairs by key and routes each group to a reducer. This is the expensive network step.
3. **Reduce**: Each reducer receives a key and the full list of values for that key, then collapses them into a final output.

The key insight is that the map phase is **embarrassingly parallel** — you can run as many mappers as you have data partitions. The reduce phase is parallel too, but bounded by key cardinality. Consistent hashing (which you know) is often what determines which reducer owns which key during the shuffle.

### Concrete Example: Word Count

Input: 3 files, each on a different machine.

- **Map phase**: Each machine reads its file and emits `("word", 1)` for every word.
- **Shuffle**: All `("the", 1)` pairs get routed to reducer #1, all `("cat", 1)` pairs to reducer #2, etc.
- **Reduce phase**: Reducer #1 receives `["the", [1,1,1,1,...]]` and sums to `("the", 47)`.

The programmer writes ~10 lines. The framework handles retrying failed mappers, re-routing when a machine dies mid-shuffle, and writing final output to distributed storage.

### Practical Scenarios

**Backend**: Log analysis pipelines are the canonical use case — counting error rates by endpoint, computing p99 latencies per service, or aggregating user events for billing. If you've used Spark SQL or AWS Athena, those engines compile queries down to MapReduce-style execution plans.

**Data**: ETL jobs transforming raw event streams into analytics tables use this model constantly. Joining two datasets is map-then-reduce: map emits `(join_key, row)` from both sides, reduce sees all rows for a key and performs the join. Most batch ML feature engineering — computing per-user aggregates across months of data — is MapReduce in practice, even when you're writing pandas on Spark.

### Why It Matters Now

Newer systems (Spark, Flink, Beam) generalize MapReduce with DAGs of operations and in-memory state, but the underlying model is the same. Understanding MapReduce makes those systems predictable — you know why a shuffle is expensive, why cardinality affects reducer parallelism, and why map-side joins exist as an optimization.
