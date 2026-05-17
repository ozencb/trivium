---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Index Selection

Every index you add speeds up reads that use it but slows down every write to that table and consumes storage. Index selection is the discipline of deciding which of those tradeoffs are worth making, given your actual query patterns — not the ones you imagine you'll have.

### The core mechanism

When you add an index, the database maintains a separate data structure (typically a B-tree) that's updated on every insert, update, and delete. The optimizer consults statistics to decide whether using an index is cheaper than a sequential scan. Critically, the optimizer can be wrong, and it sometimes ignores indexes you'd expect it to use — usually because the selectivity estimate is off or the table is small enough that a scan wins.

The real depth here is in **composite index design**. An index on `(user_id, status, created_at)` supports queries filtering on `user_id` alone, `user_id + status`, or all three — but not `status` alone. The leftmost prefix rule is well-known, but the less-obvious move is choosing column order to maximize reuse: put equality filters before range filters, and high-cardinality columns first.

### Concrete mental model

Think of a composite index as a sorted phonebook. `(last_name, first_name)` lets you find all Smiths efficiently, then all John Smiths within that. Searching by first name only means scanning the whole book. Same structure, totally different utility depending on your lookup pattern.

### Backend context

An API endpoint like `GET /orders?user_id=X&status=pending` benefits from `(user_id, status)`. But if you also need `created_at` in the `SELECT`, adding it as a third column creates a **covering index** — the database never touches the main table (heap) at all. That's a significant speedup at scale. The pitfall: if you also have `(user_id)` and `(user_id, status)` separately, you're paying triple write cost for what one index could cover.

### Data/analytics context

Wide analytical queries often benefit from **partial indexes** — indexing only rows matching a condition, like `WHERE status = 'active'`. If 95% of your rows are archived, a partial index on active rows is dramatically smaller and faster. Knowing this separates engineers who reach for "just add an index" from those who reason about the data distribution first.

### Where engineers get this wrong

Low-cardinality columns (boolean flags, enum status with 3 values) rarely benefit from a plain index — the optimizer often skips it. Over-indexing is also common: tables with 12 indexes see noticeably degraded write throughput, and the query planner's job gets harder, not easier.

In design discussions, asking "what's the write-to-read ratio on this table?" and "what does the query distribution actually look like?" signals you understand that indexes aren't free — they're a bet on your workload.
