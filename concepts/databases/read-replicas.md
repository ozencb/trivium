---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Read Replicas

A read replica is a copy of your primary database that serves read-only queries, letting you scale read throughput horizontally without overloading the node that handles writes.

**The core mechanism**

Standard replication gives you durability and failover. Read replicas take that further: instead of keeping replicas idle until the primary fails, you actively route queries to them. The primary still handles all writes (INSERT, UPDATE, DELETE), and changes propagate to replicas via the replication log — the same WAL-based or binlog-based stream you already know. The key insight is that most production workloads are heavily read-skewed. Separating reads from writes lets each tier scale independently.

Because replicas consume the same replication stream, replication lag is your main constraint. A replica might be 50ms to several seconds behind the primary depending on write volume, replica count, and network. Reads from a replica are *eventually consistent* with the primary — this isn't a flaw you work around, it's the tradeoff you design for.

**Mental model**

Think of the primary as a single cashier who also manages inventory (writes). Adding read replicas is like hiring staff who can answer customer questions ("what's in stock?") by checking a copy of the inventory sheet that's updated every few seconds. Most questions get answered correctly; occasionally someone asks about something that changed 3 seconds ago.

**Practical scenarios**

*Backend:* Route your application's read queries (product listings, user profile fetches, search) to replicas, and writes to primary. Most frameworks and ORMs support this via a database connection router. The main footgun: after a write, immediately reading from a replica may not reflect that write yet. Session-consistency patterns — routing post-write reads to primary for a short window — exist for this.

*SRE:* Read replicas are leverage during traffic spikes. You can scale read capacity by adding replicas without touching the primary, and you can offload long-running analytics queries to a dedicated replica so they don't compete with OLTP traffic. Replica lag is a key SLI to monitor; sustained lag often signals the primary is write-saturated or a replica is falling behind.

*Data:* Running heavy analytical queries on the primary kills OLTP latency. A dedicated analytics replica — sometimes with looser lag tolerance — lets you run expensive aggregations, reports, or ETL extractions without affecting application users. Some teams use this as an entry point before committing to a full data warehouse.

**The connection to connection pooling**

Read replicas multiply your database endpoints. Instead of pooling connections to one host, you're now managing pools per replica plus the primary. This is where connection pooling strategy gets meaningfully more complex — each replica needs its own pool, and your router needs awareness of which pool to target per query type.
