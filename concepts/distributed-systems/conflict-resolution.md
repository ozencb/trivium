---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Conflict Resolution in Distributed Systems

When two replicas accept writes independently and then sync, they may hold different values for the same key. Conflict resolution is how a system decides what the merged state should be — without having coordinated those writes in the first place.

### The Core Problem

Eventual consistency guarantees convergence, but *doesn't say how*. Once you accept that replicas can diverge, you need a deterministic rule for reconciling them. The strategies differ in what invariants they preserve and what they sacrifice.

**Last-Write-Wins (LWW):** Attach a timestamp to each write; highest timestamp survives. Simple to implement, but timestamps are untrustworthy across nodes (clock skew, leap seconds, NTP drift). DynamoDB and Cassandra default to this. It silently drops writes — if two clients update a shopping cart simultaneously, one update vanishes with no error. Often the right call when the data is idempotent or low-stakes; wrong when every write matters.

**Vector Clocks:** Instead of wall-clock time, each node maintains a logical counter per replica. A vector `{A:3, B:2}` means "I've seen 3 writes from A and 2 from B." This lets you detect true causality — if one version's vector dominates the other's component-wise, it's a descendant; if neither dominates, you have a genuine concurrent conflict. DynamoDB's original Dynamo paper used this. The tradeoff: you can detect conflicts precisely, but resolution still requires application-level logic or user intervention. The vector itself doesn't tell you which value is "right."

**CRDTs (Conflict-free Replicated Data Types):** Design the data structure so all concurrent operations commute — merge is always defined and always produces the same result regardless of order. A G-Counter (grow-only counter) takes the max per node and sums them. A LWW-Register uses a per-element timestamp. An OR-Set (observed-remove set) tracks unique tags per element so concurrent add+remove resolves predictably. CRDTs shift the burden from "how do we reconcile?" to "how do we model the data so reconciliation is automatic?" Redis, Riak, and most modern edge databases lean heavily on these.

### Practical Anchors

**Backend:** If you're building a distributed counter (likes, inventory), reach for a CRDT — specifically a PN-Counter. For user profile fields where the last edit wins semantically, LWW is fine, but make sure your timestamps are from a single source or use hybrid logical clocks. For anything where concurrent edits must both survive (collaborative docs), you need operational transforms or a CRDT like RGA.

**SRE:** Conflict resolution failures are almost always silent — they don't throw exceptions, they just lose data or surface stale reads. When debugging "phantom writes" or inconsistent reads after a partition heals, check whether your reconciliation strategy matches your application's expectations. Cassandra's `QUORUM` reads reduce conflicts but don't eliminate them; last-write-wins can still drop writes that arrived in the same millisecond window.

The key mental shift: conflict resolution is a *data modeling decision*, not just an infrastructure knob. Choosing LWW for mutable user data is implicitly accepting data loss under concurrency.
