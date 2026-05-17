---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Leader Election

In a distributed system, leader election is the process by which a cluster of nodes agrees that exactly one node holds authority to make decisions — writes, coordination, lock grants — at any given time. Without it, you get split-brain: two nodes both believing they're the leader, both accepting writes, diverging state.

**The core mechanism**

Leader election is a specialization of consensus: nodes must agree on a single value (the leader's identity) even under partial failures. What makes it distinct from general consensus is the *ongoing* nature — leaders die, networks partition, and the cluster must re-elect without human intervention while preserving safety.

The key invariant is **at most one leader per term**. Raft enforces this through term numbers: each election attempt increments a monotonic term, and a node only votes once per term. A candidate wins if it collects a quorum (majority) of votes. Because any two quorums overlap by at least one node, two candidates can't simultaneously win the same term — they'd need the same voter to vote twice, which is prohibited.

The subtler safety property: a new leader must not be *behind* on log entries. Raft requires candidates to advertise their last log index/term and voters to reject anyone whose log is less up-to-date than their own. This ensures the new leader has all committed entries before it starts issuing new ones.

**Mental model**

Think of it like a parliamentary vote with an expiring mandate. A candidate campaigns (RequestVote RPCs), promises not to go back in time (log recency check), collects majority support, and holds office until it stops sending heartbeats. Any node that stops hearing heartbeats within the election timeout assumes the leader is dead and starts a new campaign.

**Practical relevance**

*Backend:* When you use etcd, Consul, or ZooKeeper as a distributed lock service or service registry, you're relying on their internal Raft leader to serialize decisions. If your service registers itself or acquires a lock against a follower, that follower proxies to the leader — or rejects outright. Understanding election timeouts tells you why `etcd` has a 1–10s default and what happens to your service discovery during a leader failover.

*SRE:* A 5-node cluster tolerates 2 simultaneous failures before losing quorum and becoming read-only (no leader can be elected without 3 votes). When you see a Kubernetes control plane go unavailable because 2 out of 3 `etcd` nodes are unhealthy, this is why — not a bug, but a deliberate safety property. Knowing this, you size etcd clusters at 3 or 5 nodes, never 2 or 4.

**Why it matters in interviews**

Senior engineers distinguish themselves by knowing *why* split-brain is dangerous (not just that it is), and by understanding that election safety comes from quorum overlap — not from timeouts or heartbeats, which are liveness mechanisms. That distinction — safety vs. liveness — is what separates a candidate who's read about Raft from one who understands it.
