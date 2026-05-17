---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Optimistic Locking

Optimistic locking bets that concurrent writes to the same row are rare — so instead of blocking readers and writers with a lock, it lets transactions proceed freely and only checks for conflict at commit time. If a conflict is found, the transaction fails fast and retries. You trade lock contention for occasional retries.

**The mechanism**

Every row carries a version counter (or timestamp). A transaction reads the row and captures that version. When it writes back, it adds a `WHERE version = <captured_value>` predicate to the `UPDATE`. If another transaction modified the row in between, the version won't match, the update affects 0 rows, and your application detects the conflict and retries. The check-and-increment is atomic — the database handles that.

```sql
-- Read phase
SELECT id, balance, version FROM accounts WHERE id = 42;
-- → balance=1000, version=7

-- Write phase (after computing new balance)
UPDATE accounts SET balance = 900, version = 8
WHERE id = 42 AND version = 7;
-- If rows_affected = 0, someone else modified it — retry
```

**Mental model**

Think of it like an edit on a wiki page. You load the page (version 7), make changes, and submit. If someone else submitted first (version is now 8), your submit is rejected and you reconcile. Pessimistic locking would instead lock the page the moment you opened it for editing — blocking everyone else until you're done.

**When to reach for it**

Optimistic locking shines when reads far outnumber conflicting writes and you can't afford long-held locks — classic examples: shopping cart checkout, seat reservation on read-heavy inventory, or any record-editing form where users spend minutes reading before submitting. If users rarely edit the same row at the same time, you gain throughput without ever blocking.

It becomes a problem when conflict rates are actually high — retries pile up and you end up with worse throughput than pessimistic locking would give you. High-contention counters (inventory decrement during a flash sale, account balance under heavy load) tend to fight optimistic locking. Use pessimistic locking or atomic operations (`UPDATE ... SET count = count - 1`) there.

**Practical patterns**

- **ORMs**: Hibernate, ActiveRecord, and most mature ORMs have built-in optimistic locking — usually a `lock_version` or `@Version` column. It's one annotation/config line away.
- **Fullstack**: REST APIs often expose this as an `ETag` header. The client reads a resource, gets an `ETag`, and must send `If-Match: <etag>` on update. The server rejects with `412 Precondition Failed` if the resource changed. Same pattern, HTTP-native.
- **Retry budget**: Always cap retries (2–3 is typical). Infinite retry loops under contention degrade to a spin-lock and can starve other requests.

The key insight: locking is a coordination cost. Optimistic locking defers that cost to the rare case where you actually need it.
