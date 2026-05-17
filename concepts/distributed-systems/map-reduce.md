---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## MapReduce

MapReduce is a programming model for processing datasets too large to fit on a single machine, by decomposing computation into two composable phases that can execute in parallel across a cluster. The core insight is that a huge class of data problems can be expressed as: *transform each record independently*, then *combine records with the same key*.

**The mechanism**

The map phase takes an input split and emits zero or more `(key, value)` pairs. Critically, the mapper has no visibility into other records — it's a pure function over a local partition. After mapping, the framework performs a shuffle: all pairs sharing the same key are routed to the same reducer node. This is where consistent hashing becomes relevant — key-space partitioning determines which reducer owns which keys, and a well-distributed hash function avoids hot spots.

The reduce phase receives `(key, [values])` — a key and an iterator over all values mapped to it — and emits aggregated output. The invariant that matters: by the time a reducer sees a key, it has *all* values for that key. This guarantee is what makes aggregations (counts, sums, top-K) correct without coordination between reducers.

Fault tolerance is mechanical: the framework reruns failed map tasks (since mappers are pure and input is immutable), and re-routes shuffle data. Reducers can also be retried because the map output is persisted to local disk before shuffle begins.

**Mental model**

Think of a word-count job across 10TB of logs. You have 1,000 mappers, each reading 10GB. Each emits `("error", 1)` for every error line. The shuffle routes all `"error"` pairs to the same reducer. The reducer sums the list. No mapper needed to know the global error count — it just labeled records. The reducer only needed to sum one key's values.

**Backend**

When you have a multi-tenant system and need to compute per-tenant billing aggregates over a month of event data, MapReduce gives you a framework where tenant ID is the key. The shuffle naturally partitions work by tenant, so each reducer handles one tenant's full event stream without cross-reducer communication. This is why Hadoop jobs often replace what would otherwise be a series of expensive GROUP BY queries.

**Data engineering**

Spark's RDD model and even SQL engines with hash aggregation implement a MapReduce-like shuffle internally. Understanding the shuffle boundary — where data moves across the network — is what separates engineers who write fast Spark jobs from those who write slow ones. Skewed keys cause one reducer to receive disproportionate data, becoming the bottleneck for the entire job. Salting (appending a random suffix to the key, then doing a second-pass reduce) is the canonical fix, and you can only reason about it if you understand what the shuffle is doing.

The senior-engineer insight: MapReduce isn't just a framework — it's a contract. Any computation that can be expressed as map + shuffle + reduce is horizontally scalable and fault-tolerant by construction. Knowing whether your problem fits that contract is the design skill.
