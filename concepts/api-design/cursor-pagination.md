---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Cursor-Based Pagination

Offset pagination is a lie you tell yourself until you hit production. `LIMIT 20 OFFSET 100` works fine in tests, but under real traffic—where rows are being inserted and deleted—you get page drift: items appear twice or vanish entirely as the offset shifts under you. Cursor-based pagination fixes this by encoding *where you are* in the result set as a pointer to a specific row, not a position number.

### The Core Mechanism

Instead of "give me rows 101–120," you ask "give me 20 rows after the row with ID `abc123`." The cursor is typically the value of the sort key (often a timestamp or primary key) of the last item the client received, base64-encoded to make it opaque. On the server, this translates to a `WHERE` clause:

```sql
SELECT * FROM posts
WHERE created_at < '2024-11-01T10:23:00Z'
ORDER BY created_at DESC
LIMIT 20;
```

Because this hits an index directly rather than scanning and skipping rows, it's O(log n) instead of O(n). At page 500 of an offset query, you're asking the DB to read and discard 9,980 rows. With a cursor, you're seeking straight to the position.

### Concrete Mental Model

Think of a bookmark vs. a page number. A page number becomes wrong the moment someone inserts a chapter. A bookmark stays exactly where you left it regardless of what gets added around it.

The cursor is the bookmark. It's stable because it references an immutable property of a row (its ID or creation timestamp), not its position relative to other rows.

### Practical Scenarios

**Backend:** Any feed, activity log, or event stream with frequent writes needs this. If you're building an audit log API or a Slack-style message history endpoint, offset pagination will silently corrupt the client's view under concurrent writes. Cursor pagination also pairs naturally with Kafka/event-stream semantics where you're always consuming "from offset X" — same concept, different layer.

**Fullstack:** Infinite scroll is the canonical client-side use case. The client holds onto the last cursor and passes it with each "load more" request. No page numbers to manage, no state synchronization issues. The tricky part: you can't jump to page 50. Cursor pagination is inherently sequential — you can't seek arbitrarily without traversing. If your UI needs "jump to page N," you're stuck with offsets or need a hybrid.

### Common Pitfalls

- **Non-unique sort keys**: if two rows share the same `created_at`, your cursor is ambiguous. Fix it by making the cursor a composite of `(created_at, id)`.
- **Leaking internals**: don't expose raw IDs as cursors — base64 encode them so clients treat them as opaque blobs, letting you change the encoding scheme later.
- **Backward pagination**: reversing cursor direction requires storing both the "before" and "after" cursor and flipping the comparison operator. It's doable but adds complexity most teams underestimate upfront.

Reach for cursor pagination any time you have a high-write dataset and sequential traversal — which is most real-world feed or log APIs.
