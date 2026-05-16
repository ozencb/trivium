---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Offline-First Design

Offline-first means designing your app so it works *fully* without a network connection, treating connectivity as an enhancement rather than a prerequisite. The motivation: networks are unreliable by default — flaky mobile connections, tunnels, airplane mode — and building for offline gives you resilience that also makes online performance better.

### The Core Idea

The mental shift is inversion of data flow. Traditional web apps do: *request → server → response → render*. Offline-first does: *read from local store → render → sync with server in background*. Every write goes to IndexedDB first, not the server first.

This means your UI never blocks on network. The user's actions are always immediately reflected locally, and a sync layer reconciles those changes with the server opportunistically.

### The Mechanism

Your Service Worker acts as a network proxy — intercepting fetch calls and returning cached responses when offline. IndexedDB serves as your local database, holding both cached server data and a queue of unsynced local mutations ("outbox"). Background Sync API fires a sync event when connectivity returns, at which point you drain the outbox and reconcile.

The hard part isn't the plumbing — it's **conflict resolution**. If two clients mutate the same record while offline, who wins on sync? Common strategies: last-write-wins (simple, lossy), operational transforms (complex, preserves intent), or CRDTs (converge automatically without coordination). Most apps use last-write-wins with a timestamp, which is wrong less often than it sounds.

### Concrete Example

A note-taking app. User edits a note with no signal in a subway. Your app:
1. Writes the edit to IndexedDB immediately
2. Marks the record as "dirty" (unsynced)
3. Registers a Background Sync tag
4. Service Worker returns the IndexedDB version on any fetch for that note

When the phone reconnects, Background Sync fires, you POST the dirty records to the server, and clear the dirty flag. The user never noticed a network call.

### Practical Scenarios

**Frontend:** PWAs and mobile-web apps are the obvious target. But even dashboards benefit — serve stale cached data from IndexedDB while a fresh fetch runs in parallel (stale-while-revalidate). Tools like Workbox abstract most of the Service Worker boilerplate.

**Fullstack:** Your API needs to support idempotent mutations (so replayed outbox requests don't double-apply), and ideally expose vector clocks or `updated_at` timestamps for conflict detection. This usually means rethinking endpoints: instead of `PATCH /resource/:id`, you're processing an ordered log of intent-based operations.

The hardest engineering is making the sync layer invisible to users — progress indicators, optimistic UI, and graceful conflict surfacing when you can't silently merge.
