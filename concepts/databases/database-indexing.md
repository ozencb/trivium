---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**Database Indexing**

An index is a separate data structure that maps column values to row locations, letting the database jump directly to matching rows instead of scanning the entire table. Without it, every `WHERE` clause is O(n); with one, it's typically O(log n) or O(1).

**The mechanism**

Most indexes are B-Trees (which you already know). The key insight is that the index stores a *copy* of the indexed column(s) alongside a pointer to the heap tuple (the actual row). When you query `WHERE email = 'foo@bar.com'`, the planner traverses the B-Tree in O(log n) to find the leaf node containing that value, reads the tuple pointer, and fetches the row directly from the heap — two I/Os instead of a full sequential scan.

For composite indexes like `(last_name, first_name)`, the leftmost-prefix rule governs usability: an index on `(a, b, c)` satisfies filters on `a`, `a+b`, or `a+b+c`, but *not* `b` alone. The B-Tree is sorted by `a` first, so skipping it destroys the sorted-order property the traversal relies on.

**Covering indexes** take this further: if all columns needed by a query are *in* the index, the engine never touches the heap at all — the index itself is the answer. This is sometimes called an index-only scan.

**Concrete mental model**

Think of a phone book. The directory is sorted by last name — that's a B-Tree index on `last_name`. To find "Smith, John" you binary-search to the S section, then scan a small range. But to find everyone with phone number `555-1234`, you read every entry: no index for that column. Adding a reverse directory (index on phone number) solves it.

**Practical patterns**

- *Backend*: Foreign key columns almost always need indexes. Without one, every `JOIN` or cascade delete triggers a sequential scan on the child table. Postgres doesn't auto-create these; MySQL InnoDB does.
- *Fullstack*: Pagination queries like `ORDER BY created_at DESC LIMIT 20 OFFSET 1000` degrade badly without an index on `created_at` — the planner has to materialize 1020 rows to discard 1000. A covering index on `(created_at, id)` keeps this fast even at depth.
- *Data*: Partial indexes (`WHERE deleted_at IS NULL`) keep the index small and tight when your queries consistently filter on a condition, avoiding index bloat from rows you'll never scan.

**The tradeoff nobody mentions early enough**

Every index is maintained on every write. A table with 8 indexes pays 8 B-Tree update costs per `INSERT`/`UPDATE`/`DELETE`. Write-heavy tables with speculative indexes are a common source of unexpected throughput degradation.
