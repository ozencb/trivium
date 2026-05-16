---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## IndexedDB

IndexedDB is a low-level, transactional key-value store built into the browser that lets you persist structured data client-side at scale — unlike `localStorage`, which tops out at ~5MB and only handles strings.

### Core Mechanism

IndexedDB is an actual database engine running in the browser. It's asynchronous, transaction-based, and supports indexes (hence the name). Data is organized into **object stores** (analogous to tables), and you interact with it via a request/event model — or more practically, via Promises with a wrapper library.

The key architectural point: every read/write happens inside a **transaction** scoped to one or more object stores, with a mode (`readonly` or `readwrite`). Transactions auto-commit when they go idle, which trips people up — you can't do async work mid-transaction unless it keeps the transaction alive.

Indexing is what makes it genuinely useful beyond a glorified cache. You can define indexes on any property of your stored objects and query by them efficiently, not just by primary key.

### Mental Model

Think of it as SQLite embedded in the browser. You have a database per origin, schemas with versioned migrations (`onupgradeneeded`), indexed tables, and ACID-ish transactions. It's not SQL — it's a document store — but the conceptual weight is similar.

Contrast with `localStorage`: that's a synchronous string map you'd use to stash a token or a flag. IndexedDB is for when you need to store 10,000 product records, query them by category, and do it without blocking the main thread.

### Practical Scenarios

**Frontend:** A note-taking app that works offline. You write notes to IndexedDB immediately on user input, then sync to the server when connectivity is available. The user never waits on a network round-trip for local CRUD.

**Fullstack:** A dashboard app with heavy read queries. Instead of hitting your API on every filter/sort interaction, you hydrate IndexedDB with a dataset on page load, then handle all the filtering client-side. The server becomes the source of truth on load; IndexedDB handles the interaction layer.

**Common patterns:**
- Offline queues: buffer mutations locally, flush when online
- Client-side caching with expiry metadata stored alongside records
- Large asset storage (blobs, files) — IndexedDB handles binary data, `localStorage` doesn't

### In Practice

Nobody writes raw IndexedDB in production — the API is verbose and callback-heavy. [`idb`](https://github.com/jakearchibald/idb) (Jake Archibald's thin Promise wrapper) is the standard utility. Service Workers + IndexedDB together are the backbone of offline-first PWAs.

The main gotcha: IndexedDB is async by nature but migrations (`onupgradeneeded`) are synchronous within the version upgrade transaction, so schema changes require careful versioning logic.
