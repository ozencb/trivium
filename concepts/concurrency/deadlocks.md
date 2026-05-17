---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Deadlocks

A deadlock occurs when two or more transactions are each waiting for a lock held by the other, forming a cycle where no one can proceed. Unlike a slow query or a contention spike, a deadlock never resolves on its own—something external must intervene.

### The mechanism

Databases maintain a wait-for graph: nodes are transactions, edges point from "waiting" to "holding." When a cycle appears in this graph, the engine picks a victim (usually the cheapest-to-abort transaction) and kills it, surfacing an error to the application. Your code *must* catch this and retry; the database did you a favor by not leaving you hung indefinitely.

The cycle typically forms when two transactions acquire locks in opposite orders:

```
T1: LOCK orders → wait for inventory
T2: LOCK inventory → wait for orders
```

Each holds what the other needs. Neither can advance.

### Concrete example

Two users simultaneously place orders that affect the same inventory rows and order rows:

```sql
-- T1
BEGIN;
UPDATE orders SET status = 'processing' WHERE id = 1;  -- locks order row
UPDATE inventory SET qty = qty - 1 WHERE product_id = 42;  -- waits

-- T2 (concurrent)
BEGIN;
UPDATE inventory SET qty = qty - 1 WHERE product_id = 42;  -- locks inventory row
UPDATE orders SET status = 'processing' WHERE id = 2;      -- waits
```

Deadlock. The database aborts one transaction with something like `ERROR 1213: Deadlock found when trying to get lock`.

### Why lock ordering matters

The canonical fix is consistent lock ordering: if every transaction always locks `orders` before `inventory`, the cycle can't form. This sounds obvious until you're coordinating across three microservices that each own one table and acquire locks in whatever order their ORM feels like.

### Backend patterns

In APIs, deadlocks commonly surface under load when you have multiple write paths touching the same rows. A retry loop with exponential backoff is table stakes. More importantly, design your write operations to touch tables in a fixed canonical order, and keep transactions short—long-running transactions increase the window for cycle formation.

### Data patterns

ETL pipelines and bulk operations are deadlock hotspots. A pipeline that processes records in arbitrary order while another process reads and re-ranks them is a deadlock factory. Solutions: process in sorted primary-key order, use `SKIP LOCKED` to avoid contention entirely, or shift contended updates into a queue processed serially.

### The pitfall most engineers miss

Deadlocks aren't just a database problem. Application-level mutexes, Redis `SETNX` locks, and queue systems can all form the same wait-for cycles. The database at least detects and breaks them—your custom distributed lock implementation probably doesn't. If you're building multi-resource locking outside of a database, you need explicit cycle detection or a global ordering convention baked into the design.
