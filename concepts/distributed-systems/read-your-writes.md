---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Read-Your-Writes Consistency

After you write data, any subsequent read you make will reflect that write — even in a replicated system where other clients might still see stale data.

### The Mechanism

In a replicated database (primary + replicas), writes go to the primary and propagate to replicas with some lag. Read-your-writes (RYW) consistency is a guarantee scoped to a *single client session*: that client will never read data older than what it last wrote, but there's no such promise for other clients.

The implementation usually takes one of two forms:

**Sticky routing** — route all reads for a session to the primary, or to a specific replica known to have caught up. Simple, but you lose the load-distribution benefit of replicas.

**Timestamp/LSN-based fencing** — on write, the server returns a position marker (e.g., a log sequence number). On subsequent reads, the client passes that marker, and the replica refuses to serve the read until it has caught up past that position. More complex but preserves horizontal read scaling.

### Mental Model

Think of it as a personal guarantee, not a global one. You post a comment on a social platform and immediately refresh — you see your comment. Someone else refreshing at the same time might not see it yet. The system guarantees your view is self-consistent, not that all views are synchronized.

### Practical Scenarios

**Backend:** You write a new user record and immediately query it to return in an API response. Without RYW, you might read from a lagging replica and get a 404 on something you just created. This shows up in auth flows constantly — create user, then fetch user to build a session token. Solutions: route post-write reads to primary for the duration of the request, or use a synchronous replication step for reads within the same transaction boundary.

**Fullstack:** A user updates their profile and the UI re-fetches to show the updated state. If your API reads from a replica, you get the old data back and the UI flashes the previous value before eventually catching up. The common fix is either optimistic UI updates (bypass the read entirely) or a short primary-read window after mutations. GraphQL mutation resolvers often return the updated object directly for this reason — sidestep the read-your-writes problem by not doing a separate read at all.

### Where It Sits in the Consistency Landscape

RYW is weaker than linearizability (which gives everyone a consistent view) but stronger than pure eventual consistency (which gives no session-level guarantees). It's a pragmatic middle ground — cheap enough to implement at scale, strong enough to prevent the most jarring user-facing anomalies.
