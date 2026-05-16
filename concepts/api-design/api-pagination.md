---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## API Pagination

Pagination is how a REST API returns a bounded subset of a large result set, letting clients request data in manageable chunks rather than receiving (or waiting for) the entire collection at once.

### The Core Mechanism

The fundamental idea is that a client sends a request with parameters describing *which slice* of the total dataset it wants. The server executes a constrained query, returns that slice, and includes enough metadata for the client to request adjacent slices.

The simplest form is **offset/limit pagination**: the client says "give me 25 items, starting at position 50." In SQL terms, this maps directly to `LIMIT 25 OFFSET 50`. The response typically includes the page of results plus some combination of total count, current page, and links to adjacent pages.

```
GET /articles?limit=25&offset=50

{
  "data": [...],
  "total": 342,
  "limit": 25,
  "offset": 50
}
```

The subtle complexity is *where* the pagination contract lives. The client controls the window, but the server controls the sort order, filter application, and whether `total` is even calculated (it often requires a separate `COUNT(*)` query — expensive on large tables). You're negotiating a view into a moving dataset.

### Where It Gets Interesting

Offset pagination has a well-known pathology: if items are inserted or deleted between page requests, the client can see duplicates or skip items. Page 2 of a query sorted by `created_at DESC` will shift if new items arrive before the client fetches it. This is why offset pagination is described as *stateless but unstable*.

For a read-heavy list that rarely mutates (a product catalog, historical logs), this usually doesn't matter. For feeds, activity streams, or anything with high write volume, the instability becomes a real product problem — and that's exactly what cursor-based pagination solves, which you'll hit next.

### Practical Scenarios

**Backend:** When designing an endpoint over a large table, you choose between offset pagination (simple, SQL-native, allows jumping to arbitrary pages) and alternatives. The pagination strategy directly influences your query patterns, index design, and whether you expose `total` (often worth avoiding — it doesn't scale). You also need to decide what to paginate *by*: primary key, timestamp, or a compound key.

**Fullstack:** On the client side, you're either implementing "load more" / infinite scroll (append model, works well with cursor-based) or a page navigator (requires offset + total for rendering page numbers). The choice of pagination style upstream forces a UX pattern downstream. Infinite scroll with offset pagination is a common mistake — the dataset shifting mid-scroll produces subtle bugs that are hard to reproduce.

The pagination strategy is an API contract. Changing it after clients depend on it is a breaking change, so the decision deserves more upfront thought than it usually gets.
