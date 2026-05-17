---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Quorum Reads

Quorum reads guarantee you see the latest committed write by contacting a majority of replicas — exploiting the fact that any two majorities must overlap. The overlap node is your proof that you've reached someone who witnessed the most recent commit.

### The core mechanism

The invariant driving this: if you write to W nodes and read from R nodes in a cluster of N, setting W + R > N ensures at least one node in your read set participated in the last write quorum. That shared node is the witness.

In practice for a 5-node cluster (quorum = 3):

1. Fan out the read to 3+ replicas
2. Collect responses with their version vectors or log indices
3. Return the value with the highest version
4. Optionally write that value back to stale replicas (read repair)

The partition-tolerance property falls out naturally. During split-brain, the minority partition (say, 2 nodes) cannot satisfy a majority read — your request blocks or fails rather than returning stale state. The majority partition is the only one that can respond, and it has the latest committed value by definition.

### Mental model

Think of it like a distributed notary. A document (write) is only legally binding once the majority signs it. To verify a document is real, you ask a majority of notaries. You're guaranteed at least one of them signed it — or would refuse to confirm a forgery.

### Backend

Cassandra's `QUORUM` consistency level is exactly this. You trade roughly 2x read latency (fan-out + wait for slowest quorum member) for linearizable reads without a single leader. The common misconfiguration: teams set reads to `ONE` for performance, then get burned during rolling restarts or AZ failures when replicas lag behind. If "read your own writes" is a correctness requirement, you need `QUORUM` on both sides, or at minimum `LOCAL_QUORUM` within a region.

One subtle pitfall: quorum reads block on the *slowest* responding node in the quorum set, not the fastest. A single degraded replica drags your p99. Hedged requests (fire to N, return after quorum confirms) mitigate this.

### SRE

When you see intermittent stale reads in a distributed store, the first question is always: what consistency level is configured, and did someone quietly downgrade it for performance? That's the most common incident pattern. Quorum reads eliminate that failure class but create a new observable: availability degrades proportionally as nodes go down. Below majority, reads fail rather than return stale data — which is correct behavior, but alarms need to be set accordingly. A cluster at N/2 nodes is effectively read-unavailable under quorum semantics.

**The invariant to internalize:** write quorums and read quorums always share at least one node. That overlap is not a coincidence — it's the entire proof.
