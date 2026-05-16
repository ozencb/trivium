---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Optimistic locking is a concurrency strategy where you don't lock a resource when reading it — instead, you detect conflicts at write time and reject updates that would overwrite someone else's changes.**

The pessimistic approach holds a database lock for the duration of a transaction. Optimistic locking avoids that entirely: read freely, compute your change, then verify nothing changed before committing. The mechanism is typically a `version` column (or a timestamp). On read, you capture the version. On update, you include a `WHERE version = <what you read>` condition. If that row's version has since changed, zero rows are affected — conflict detected, transaction aborted, caller retries.

```sql
-- Read
SELECT id, balance, version FROM accounts WHERE id = 42;
-- Got: balance=1000, version=7

-- Write attempt
UPDATE accounts
SET balance = 900, version = 8
WHERE id = 42 AND version = 7;
-- If rowcount = 0, someone else updated it first
```

The version bump is done by the writer, not a trigger or database magic. Some ORMs (Hibernate, ActiveRecord, TypeORM) manage this automatically.

**Why this beats pessimistic locking in most cases:** reads never block each other. Conflicts only pay a cost when they actually happen. In typical web apps — users editing their own profile, processing their own orders — conflicts are rare. Holding DB locks for the duration of an HTTP request (which might involve network calls, user think time, etc.) is a bad trade.

**Backend scenario:** A payment service deducts from an account balance. Two requests hit simultaneously. Pessimistic locking serializes them via a row lock. Optimistic locking lets both read freely — the second writer detects the conflict and retries, now reading the updated balance. Same correctness, higher throughput under low-contention workloads.

**Fullstack scenario:** A CMS where multiple editors can open the same article. You track `version` in the document. When Alice saves, her `version=3` matches — success. When Bob saves 30 seconds later with `version=3`, the update fails because Alice already bumped it to `version=4`. You surface this as "conflict: someone edited this document while you were working" and present a merge UI. This is exactly how tools like Notion, Linear, and GitHub handle concurrent edits at the persistence layer.

**Where it falls apart:** high-contention scenarios. If 50 threads are racing to decrement a shared counter, optimistic locking degenerates into a retry storm. Inventory reservation during a flash sale is the canonical example — pessimistic locking or queuing wins there. The heuristic: if conflict probability is low, go optimistic; if contention is structural, go pessimistic or rethink the data model.
