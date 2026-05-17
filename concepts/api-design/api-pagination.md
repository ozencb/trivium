---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## API Pagination

When a collection endpoint returns thousands or millions of records, sending them all in one response is both impractical and dangerous — it blows memory budgets, kills latency, and can take down clients that aren't expecting the payload size. Pagination is how you expose large datasets incrementally, letting clients fetch what they need without either side drowning.

### The core tension: where does "page N" start?

**Limit/offset** is the intuitive approach: `GET /posts?limit=20&offset=40` fetches rows 41–60. The database maps this almost directly to `LIMIT 20 OFFSET 40`. Simple to understand, easy to implement, and completely stateless on the server.

The problem surfaces under real usage. If someone inserts or deletes a row between page 1 and page 2, the offset shifts — you either skip a record or show a duplicate. At high offsets (`OFFSET 500000`), the database still scans and discards all preceding rows, so performance degrades linearly. And on busy tables, this scanning behavior can cause lock contention.

**Cursor-based pagination** (also called keyset pagination) sidesteps both problems by encoding *position* rather than row count. Instead of "skip 40 rows," you say "give me 20 rows after the row with `id = 83221`." The server returns an opaque cursor token with each page — the client passes it back as a parameter to get the next page.

```
GET /posts?limit=20
→ { data: [...], next_cursor: "eyJpZCI6IDgzMjIxfQ==" }

GET /posts?limit=20&after=eyJpZCI6IDgzMjIxfQ==
→ { data: [...], next_cursor: "eyJpZCI6IDgzNDQxfQ==" }
```

The cursor typically encodes the sort key(s) of the last seen row. The query becomes `WHERE id > 83221 LIMIT 20` — which uses the index directly and doesn't care how many rows came before it.

### When to reach for each

**Limit/offset** is fine when the dataset is small (under ~10k rows), the collection is relatively static, or users genuinely need arbitrary page jumps ("jump to page 47"). Admin dashboards, search results with total counts, or anything where "page X of Y" is part of the UX.

**Cursor pagination** is the right call for feeds, activity streams, real-time data, or anything that updates frequently. Mobile infinite-scroll is the canonical case — the user just wants "more," and they'll never ask for page 47.

### Practical notes for backend and fullstack

On the **backend**: cursor pagination requires a stable sort key. Using `created_at` alone fails if two rows share a timestamp — combine it with `id` to make it unique. The cursor should be opaque to clients (base64-encode the underlying values) so you can change the implementation without breaking callers.

On the **fullstack** side: limit/offset lets you render "Page 3 of 14" easily; cursor-based doesn't give you a total count by default (counting is expensive). If the product requires total counts, you'll either query them separately on a delay, cache them, or accept an approximation.

The choice is ultimately a product question: "can the user seek to an arbitrary page?" If yes, offset. If no, cursors.
