---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Leader Election

In a distributed system, leader election is the process by which a cluster of nodes autonomously agrees on exactly one node to act as coordinator — so writes, scheduling, or state mutations flow through a single authoritative source without manual intervention.

### The Core Mechanism

Leader election is consensus applied to a specific question: "who's in charge right now?" The elected leader isn't special by nature — it's just whichever node won a round of consensus. What makes it interesting is *what happens when that node dies*.

Most production implementations use a lease model: the leader holds a time-bounded token (a lease) and must renew it by writing a heartbeat to shared storage before expiry. If it fails to renew, the lease expires, followers detect the absence, and they race to claim leadership by atomically writing a new lease entry. Only one wins — because the underlying operation (compare-and-swap or a distributed transaction) is atomic.

This is why consensus algorithms are the prerequisite. Etcd uses Raft; ZooKeeper uses ZAB. The election itself is just a consensus round on a small piece of state: "current leader = X, term = 42."

### Mental Model

Think of a town with one mayor. The town can function fine with one mayor issuing decisions. The problem is when the mayor goes missing — the town needs a reliable way to elect a new one without ending up with two mayors simultaneously (split-brain), which causes conflicting decisions.

The "lease" is the mayor's term in office. They must check in regularly. If they miss check-in, the town holds a new election. The check-in itself is the heartbeat.

### Practical Scenarios

**Backend:** You're running a distributed job scheduler — say, a cron-like system across 5 pods. Only one pod should fire each job at a given time. Rather than building external locking logic, you implement leader election so only the leader pod schedules jobs. When it crashes, a new leader takes over within seconds. Kubernetes controller-manager and scheduler work exactly this way, using etcd leases.

**SRE:** You're investigating why a scheduled task ran twice, causing duplicate emails. The root cause is often a failed leader election or an expired lease that wasn't detected fast enough — two nodes both believed they were leader briefly (the "dual-leader window"). This is the gap between lease expiry and the new election completing. Tuning lease duration vs. election timeout is a classic SRE tradeoff: shorter leases = faster failover but higher false-positive elections under network blips.

### The Hard Part

The failure mode isn't election itself — it's the window where the old leader is still running but has lost its lease. If it doesn't check the lease before acting, you get split-brain. Correct implementations always re-validate lease ownership before any write. "Am I still the leader?" is a question that must be answered immediately before every consequential action, not assumed from cached state.
