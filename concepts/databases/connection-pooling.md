---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Connection pooling keeps a set of pre-established database connections alive and reuses them across requests, instead of paying the TCP handshake + auth cost on every query.

## The Core Mechanism

Opening a database connection is expensive: TCP handshake, TLS negotiation, authentication, session setup. On Postgres this can cost 20–50ms. For an app handling 500 req/s, that overhead becomes the bottleneck, not the queries themselves.

A pool solves this by maintaining N open connections. When your app needs to query, it **checks out** a connection from the pool, runs the query, then **returns** it. The connection stays open and authenticated. The next request grabs the same connection without paying setup costs.

The pool also acts as a concurrency governor. If all connections are checked out, new requests wait in a queue rather than hammering the database with unlimited parallelism. Databases have their own connection limits (Postgres defaults to 100) and degrade under too many concurrent connections due to lock contention and memory pressure.

**Key pool parameters:**
- `min` / `initial`: connections kept alive even at idle
- `max`: hard cap; requests queue or fail beyond this
- `idle timeout`: how long an idle connection stays open before being closed
- `acquire timeout`: how long a request waits for a connection before erroring

## Mental Model

Think of it like a taxi stand. A single taxi (connection) can only take one passenger (query) at a time. Without pooling, every passenger calls a taxi from scratch — waits for it to arrive from the depot. With pooling, taxis sit at the stand ready to go. If all taxis are occupied, passengers queue. The stand size is your `max` pool size.

## Practical Scenarios

**Backend service (e.g., Node/Go API):** Your pool is typically per-process. With a max of 10 and 4 replicas, you're holding 40 connections open against Postgres. When you scale to 20 replicas, you hit 200 connections — close to the default limit. This is where tools like **PgBouncer** (a connection pooler that sits in front of Postgres) become necessary. It multiplexes thousands of app-side connections into a smaller set of real database connections.

**Fullstack (e.g., Next.js + Prisma/Drizzle):** Serverless and edge functions are the painful case. Each cold-started function creates its own pool. With 50 concurrent Lambda invocations, you get 50 × pool_size connections — pools that are mostly idle. Prisma's `connection_limit=1` recommendation for serverless exists for exactly this reason. PgBouncer or Supabase's connection pooler (which uses PgBouncer under the hood) solves this by sitting in front of the database and doing the real multiplexing.

The underlying lesson: pool size isn't "bigger = better." It's a dial that balances connection overhead against database concurrency limits. Getting it wrong in either direction degrades throughput.
