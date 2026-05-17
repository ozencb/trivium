---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## NUMA Architecture

In a multi-socket server, each CPU socket has memory physically attached to it — accessing that local memory is fast, but crossing the interconnect to reach another socket's memory costs 2-3x the latency. This is NUMA (Non-Uniform Memory Access), and most production servers with 2+ sockets exhibit it without anyone explicitly thinking about it.

**The core mechanism**

Modern multi-socket systems connect CPUs via an interconnect (Intel UPI, AMD Infinity Fabric). Each socket has its own memory controller, so RAM attached to socket 0 can only be directly fetched by socket 0's cores. If a thread running on socket 1 touches memory allocated on socket 0, the access crosses the interconnect — adding ~100ns on top of the ~80ns local DRAM latency. That's not catastrophic in isolation, but in tight loops processing large datasets it compounds.

The OS kernel models this as NUMA nodes. On Linux, `numactl --hardware` shows the topology and inter-node distances. Distance 10 = local, distance 20+ = remote.

**Mental model**

Think of it like L3 cache but at socket granularity. You already know L3 misses hurt because you fall through to DRAM. NUMA adds another tier: local DRAM vs. remote DRAM. The penalty is smaller than an L3 miss but it affects every memory access that crosses nodes, not just cache misses.

**Where this bites in practice**

*Backend services:* A JVM process or database instance started without NUMA affinity lets the OS schedule threads freely across sockets. Memory allocated during startup ends up on one node; threads migrate to the other socket later. You see it as inconsistent tail latencies — the p99 is bad and moves around, but averages look fine. `jvm -XX:+UseNUMA` or `numactl --interleave=all` (for interleaved allocation) are the two main levers.

*SRE/infra:* When you're colocating services on a bare-metal host or tuning a database (Postgres, Redis, Kafka), NUMA node binding matters. A Kafka broker pinned to a NUMA node with `numactl --cpunodebind=0 --membind=0` will have meaningfully lower and more consistent read latencies than one let loose across the topology. This shows up in benchmarks but often gets attributed to "noisy neighbors" in production.

**When to reach for this**

If you're investigating latency variance on multi-socket hardware, or tuning throughput-sensitive services (databases, JVMs, in-process caches), NUMA locality is worth auditing. `numastat` and `perf stat -e node-loads,node-load-misses` give you the signal. For most stateless services behind a load balancer, it's rarely the bottleneck — but for anything doing heavy memory-bound work with large working sets, the cross-node penalty is real and fixable.
