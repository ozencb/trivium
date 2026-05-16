---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

CAP Theorem says a distributed system can guarantee at most two of three properties: Consistency, Availability, and Partition Tolerance. Since network partitions are unavoidable in any real distributed system, the theorem collapses into a practical choice between C and A under partition.

## The Core Mechanism

The three properties:

- **Consistency (C):** Every read sees the most recent write, or gets an error. All nodes agree on the current state.
- **Availability (A):** Every request gets a response. No timeouts, no errors — though the data might be stale.
- **Partition Tolerance (P):** The system keeps operating when nodes can't communicate.

You can't opt out of P. Networks split. Nodes crash. So the real question is: *when a partition occurs, what do you sacrifice?*

## The Mental Model

Two database nodes, US-East and US-West. A network cut separates them. A write hits US-East. Then a read hits US-West.

- **CP system:** US-West refuses to answer (or blocks waiting). It won't serve data it can't confirm is current. You get an error or a hang.
- **AP system:** US-West serves its last known value. You get a response, but it might be stale.

There's no third option where US-West somehow returns fresh data — it's physically isolated.

## Practical Scenarios

**Backend:** Database selection is fundamentally a CAP decision. Cassandra and DynamoDB lean AP — they'll serve stale data during a partition and reconcile afterward. Good fit for user carts, preferences, activity feeds where a slightly stale read is acceptable. HBase, Zookeeper, and etcd lean CP — they'll reject requests if they can't maintain quorum. Required for distributed locks, leader election, anything where two nodes acting on conflicting state causes corruption.

**SRE:** CAP tells you what failure mode to expect during incidents. A CP database that loses quorum *stops accepting writes* — you need runbooks that handle read-only degradation and communicate "the system is refusing writes to protect data integrity." An AP system *silently serves stale data* — you need monitoring that detects replication lag and alerting on divergence, not just on availability. Getting this wrong means you're troubleshooting the wrong thing at 2am.

## The Part That Gets Oversimplified

"Consistency" in CAP means *linearizability* — the strictest form, where every operation appears instantaneous and globally ordered. That's not the C in ACID, which is about transaction validity. These are different things and people conflate them constantly.

Also, modern systems blur the binary. Cassandra's consistency levels let you dial from ONE (AP-ish) to QUORUM or ALL (CP-ish) per operation. DynamoDB offers strongly consistent reads as an option. You're not choosing a camp at system design time — you're often choosing per-query, which means you can accidentally mix guarantees and create subtle bugs.

CAP is less a hard theorem and more a forcing function: it makes you articulate *what you're willing to lose* when the network lies to you.
