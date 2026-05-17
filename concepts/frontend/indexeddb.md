---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## IndexedDB

IndexedDB is a transactional, NoSQL object store built into the browser — the right tool when localStorage's string-only, synchronous, ~5MB ceiling stops being enough. It handles structured data at scale with real querying support, making it the foundation for any serious client-side persistence strategy.

### Core mechanism

The data model centers on **object stores** (roughly analogous to tables), each holding arbitrary JS objects keyed by a primary key. You define **indexes** on object stores at schema creation time, which lets you look up records by fields other than the primary key. All reads and writes happen inside **transactions** — you open one on one or more stores with a mode (`readonly` or `readwrite`), issue requests against it, and it auto-commits once all pending work drains. For large result sets, **cursors** let you iterate through records one at a time without pulling everything into memory.

The API is fully async and event-driven at its core, though modern usage almost always goes through a thin promise wrapper like [`idb`](https://github.com/jakearchibald/idb) rather than the raw callback surface.

### Mental model

Think of it as a browser-local SQLite with a document store personality: you're storing JS objects (not typed rows), indexes are explicit rather than inferred, and schema changes are versioned and handled in an `onupgradeneeded` callback when you bump the database version number.

### Practical scenarios

**Frontend:** Pre-load and index a large product catalog so filtered search runs entirely offline. Cache API responses keyed by request URL with a timestamp, and invalidate stale entries on the next load. Persist complex form drafts — including nested objects and blobs — across page refreshes without serializing to JSON in localStorage.

**Fullstack:** Build the mutation queue for an offline-first app. When the user is offline, writes go into IndexedDB with a "pending" flag. A service worker with background sync picks them up and replays them against the server when connectivity returns. This is the pattern behind apps like Figma, Linear, and most PWAs that need to work disconnected.

### Common pitfalls

**Transaction auto-commit is subtle**: a transaction commits as soon as its request queue empties, which means you cannot `await fetch(...)` inside an open transaction — it will close before the response arrives. Fetch first, then open the transaction.

**Storage is evictable by default**: browsers can clear IndexedDB under storage pressure. Call `navigator.storage.persist()` to request durable storage (user or browser grants it).

**Raw API verbosity**: the native API is deeply callback-oriented and cumbersome for anything beyond toy examples. Use `idb` — it's a thin, well-maintained wrapper with zero lock-in.

**Schema migrations are your responsibility**: unlike most ORMs, there's no auto-migration. You handle every version upgrade explicitly in `onupgradeneeded`, which becomes important the moment your app is deployed to real users with existing data.

Once you understand IndexedDB, offline-first architecture — where the local store is the source of truth and the server is a sync target — becomes the natural next concept.
