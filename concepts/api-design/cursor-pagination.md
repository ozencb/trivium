---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Cursor-based pagination replaces page numbers with a pointer into your dataset — a stable, opaque marker that says "give me records after this one." It solves the fundamental problem with offset pagination: offsets lie as soon as the underlying data changes.

## The Core Problem with Offsets

`LIMIT 20 OFFSET 40` tells the database "skip 40 rows, return the next 20." That works until someone inserts or deletes a row before position 40 — now your offset drifts, and users see duplicates or skipped items. On high-write tables, this isn't theoretical; it happens constantly.

Offsets also have a performance cliff: `OFFSET 10000` still requires the database to scan and discard 10,000 rows before returning anything useful. Even with an index, that cost accumulates.

## How Cursors Work

Instead of "give me page 5," the client says "give me 20 records after the record with ID 8472" (or after a timestamp, or after some composite value). The query becomes:

```sql
SELECT * FROM posts
WHERE created_at < '2024-01-15 10:32:00'
ORDER BY created_at DESC
LIMIT 20;
```

The server returns the page plus a cursor encoding the last record's position. The client passes that cursor back for the next page — it never knows or cares about absolute positions.

The cursor itself is usually base64-encoded JSON of the sort fields (`{"created_at": "2024-01-15T10:32:00Z", "id": 8472}`) to handle ties. You encode it so clients treat it as opaque and don't try to construct their own.

## What This Requires

Your sort column must be indexed, and the combination you cursor on must be **stable and unique** — otherwise "after this record" is ambiguous. This is why `(created_at, id)` is common: timestamps cluster well for the index but need `id` as a tiebreaker.

You lose random access. You can't jump to page 50 — you must walk forward from your current cursor. This is a real tradeoff.

## Practical Scenarios

**Backend:** Feed APIs, audit logs, notification streams — any endpoint where the consumer walks forward through time-ordered data. Webhooks paginating delivery history. Admin tools listing background jobs.

**Fullstack:** Infinite scroll is the canonical use case. The client holds the last cursor; when the user scrolls to the bottom, it fires another request. No "page 3 of 47" UI, just "load more." Chat history (walking backwards with a `before` cursor) works the same way.

**The tricky part** most engineers miss: bidirectional cursor pagination — letting users scroll both forward and backward — requires returning both a `next_cursor` and a `prev_cursor`, and the backward query flips the inequality and re-reverses the results before returning them. Simple to describe, easy to get wrong in implementation.
