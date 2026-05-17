---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Document Stores

Document stores persist data as self-contained JSON-like objects rather than normalized rows across tables. The pitch is that when your "record" is naturally hierarchical — a product with variable attributes, a user profile with nested preferences — you stop fighting the relational model and just store the shape you already have.

**Core mechanism**

Each document gets a unique `_id` and lives in a collection (MongoDB) or collection/sub-collection tree (Firestore). The database stores the raw document plus indexes you define on any field path, including nested ones (`address.city`, `tags[0]`). There's no schema enforced at the storage layer — two documents in the same collection can have completely different fields. Atomicity is per-document by default; the whole document write succeeds or fails, which is why the modeling advice is "embed what you always need together."

Horizontal scaling works by sharding: you pick a shard key and documents are distributed across nodes. This is why joins are absent — at query time, a document might live on a different machine than a related one.

**Mental model**

Think of a relational DB as a spreadsheet: rigid columns, every row looks the same. A document store is a filing cabinet of envelopes — each envelope can hold whatever you need, and you index by writing labels on the outside.

**The core modeling decision** is embed vs. reference. Embed when data is always fetched together and has bounded growth. Reference (store an ID and look it up separately) when data is shared across many documents or can grow unboundedly. Getting this wrong is the most common mistake — an array of embedded comments that grows to thousands of entries will eventually hit MongoDB's 16MB document limit and destroy read performance long before that.

**Practical scenarios**

*Backend:* REST endpoints that return a single complex resource — a product with its images, variants, and metadata — map naturally to a single document fetch. No N+1 joins, no ORM object graph traversal.

*Fullstack:* Firestore's real-time listeners let you subscribe to document changes, which makes collaborative features (live dashboards, shared state) easy without a separate WebSocket layer.

*Data:* Semi-structured event logs or user activity where each event type has different fields. Forcing that into a relational schema means nullable columns everywhere or an EAV table (both are painful).

**When not to reach for it**

If your workload is heavily relational — think financial ledgers, inventory with foreign-key constraints, anything where referential integrity matters — the lack of cascading deletes and enforced relationships becomes a liability. Document stores push data consistency responsibility into your application code, and that debt compounds as the codebase ages.
