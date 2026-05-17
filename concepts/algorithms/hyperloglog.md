---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## HyperLogLog

You need to count distinct user IDs across a billion-event stream, but storing every ID you've seen blows your memory budget. HyperLogLog lets you answer "how many distinct things?" using kilobytes instead of gigabytes, with typically ±2% error.

**The core idea**

The trick starts with a hash function. Hash each element to a uniform bit string. The probability that a random bit string starts with exactly *k* leading zeros is 1/2^k — so if the maximum leading-zero run you've ever seen is *k*, you've probably observed around 2^k distinct elements.

That single-register estimate is too noisy to be useful alone. HyperLogLog fixes this by splitting the hash space into *m* buckets using the first few bits of each hash, then running the max-leading-zeros tracker independently per bucket. To combine them, it uses the harmonic mean of 2^(per-bucket max), plus a small bias correction. The harmonic mean specifically suppresses the influence of outlier buckets that got lucky with a freakishly long zero run.

With m=2048 buckets (2KB), you get ~1.6% standard error. You can tune the tradeoff: double the buckets, halve the relative error.

**Mental model**

Think of it like estimating crowd size at a concert by asking a sample of attendees "what's the highest coin-flip streak you've gotten today?" One person might have flipped 10 heads purely by luck, but averaging across 2000 people gives you a stable signal about how many people were actually flipping.

**Where you'll actually use this**

*Backend:* Redis has `PFADD`/`PFCOUNT` built in. Use it for DAU/MAU counters, unique visitor counts per page, or rate-limiting by distinct IPs without exploding your memory. The mergeable property is huge — you can shard HLL state across servers and union them with bitwise OR, which is something you can't do with exact sets.

*Data:* Warehouse query planners (Redshift, BigQuery, Presto) use HLL internally for `COUNT(DISTINCT ...)` estimates in query optimization. If you're building data pipelines and need approximate cardinality in a streaming aggregation (Flink, Spark Structured Streaming), HLL lets you maintain running distinct counts without unbounded state.

**Pitfalls**

The error guarantee is *relative*, not absolute — 2% of 10 is 0.2, but 2% of 10 billion is 200 million. It's not suitable when you need exact counts or when cardinality is very low (below ~100, direct counting is fine). And unlike Bloom Filters, you can't ask "have I seen this specific element" — HLL only answers "how many distinct things total."
