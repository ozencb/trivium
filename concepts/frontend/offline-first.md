---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**Offline-First Design** treats the local device as the primary source of truth and the server as a sync target — not a dependency. The shift matters because most apps fail silently on flaky connections; offline-first makes that failure mode a first-class design concern from day one.

## Core Mechanism

The pattern has three moving parts: a local store, a sync engine, and a conflict resolution strategy.

Reads always hit local storage (IndexedDB, SQLite via WASM, etc.). Writes go to local storage first, immediately, and get queued for eventual sync. The Service Worker and Background Sync API handle delivering that queue when connectivity returns — even if the user has closed the tab.

The piece most engineers underestimate is **conflict resolution**. When the server and client both have writes that happened during a disconnect, you need a strategy: last-write-wins (simple, lossy), CRDTs (complex, lossless), operational transforms (very complex, used in collaborative editors), or domain-specific merge logic. Most production apps use last-write-wins with a timestamp, which is usually fine but can silently clobber data.

## Mental Model

Think of it like Git. You commit locally, work offline, then push and pull. Merges happen. Most of the time there's no conflict; occasionally there is and you resolve it. The server is your remote — authoritative but not required to operate.

## Concrete Example

A field technician app for logging equipment inspections: the tech goes into a basement with no signal, fills out a form, hits submit. With a naive implementation: spinner, timeout, lost data. With offline-first: the write goes to IndexedDB immediately, the UI confirms success, and Background Sync delivers it to the server when the device resurfaces. The user never knew there was a problem.

## Frontend vs. Fullstack Considerations

**Frontend:** The main work is around the sync queue (how do you track pending mutations?) and cache invalidation (how do you know when local data is stale?). Libraries like RxDB, PouchDB, or TanStack Query's persistence plugins take the heavy lifting off you. You still own the conflict strategy.

**Fullstack:** The server API needs to be idempotent and accept out-of-order writes — a sync flush from a reconnected client might replay mutations from two hours ago. You also need per-row timestamps or vector clocks if you want meaningful conflict detection. This cascades into your DB schema and API contract.

## Where This Comes Up in Practice

Reach for it when: users operate in unreliable network environments (field tools, mobile-heavy apps, developing markets), or when perceived performance is critical enough that you'd rather commit optimistically and reconcile later.

The senior signal in design discussions: knowing *not* to reach for it. For most CRUD admin tools with stable connectivity, offline-first adds conflict complexity with no real benefit. The ability to articulate that tradeoff — rather than treating offline-first as always better — is what distinguishes the thinking.
