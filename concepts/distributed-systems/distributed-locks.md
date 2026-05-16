---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Distributed Locks** enforce mutual exclusion across processes running on separate machines — the same guarantee a mutex gives you in-process, but without shared memory to coordinate through.

## The Core Problem

A single-process mutex works because memory is shared and operations are atomic at the hardware level. Distributed systems have neither. Two services on different hosts can both believe they hold the lock simultaneously — either because of network partitions, clock drift, or a GC pause that caused one holder to stop responding without releasing.

The naive solution (write a "locked" flag to a database) fails because the write itself isn't atomic with the check. You need something that can atomically "set if not set" and automatically expire stale locks.

## The Mechanism That Actually Matters: Fencing Tokens

When you acquire a lock from a system like etcd or ZooKeeper, you get back a **fencing token** — a monotonically increasing integer. Every write to shared state must include this token. The storage layer rejects any write whose token is lower than the highest it's seen.

This matters because lock expiry alone isn't enough. Imagine: you hold the lock, then a long GC pause hits. Your lease expires, another process acquires the lock and gets token 34, starts writing. Then your GC pause ends — you still think you hold the lock and try to write with token 33. Without fencing, you'd corrupt state. With fencing, the storage layer rejects you.

Redis-based locking (Redlock) skips fencing tokens, which is why Martin Kleppmann argued it's unsafe for anything where correctness is critical. For "best effort" coordination it's fine; for financial operations it isn't.

## Mental Model

Think of it like a library checkout card with an expiry date stamped on it, where the librarian only accepts the card with the highest serial number they've seen. Even if you're still walking around with card #33, card #34 being issued invalidates you.

## Practical Scenarios

**Backend:** The canonical use case is preventing double-execution — only one instance should process a payment, run a migration, or consume a scheduled job. You acquire a lock keyed on the resource ID (e.g., `payment:{id}`) before processing, and release on completion. Combined with idempotency keys, this handles the "at-least-once delivery but exactly-once processing" problem.

**SRE:** Coordinating rolling restarts across a fleet — a lock ensures only N nodes drain at a time. Also useful during cache stampedes: when a cache key expires under high load, a lock lets one process rebuild it while others wait, rather than all hitting the database simultaneously.

## Connection to Consensus

Since you know consensus algorithms: a correct distributed lock *is* a consensus problem — all nodes must agree on one holder. etcd and ZooKeeper solve this properly using Raft/Paxos. Redis trades that correctness guarantee for lower latency and simpler ops. Choose based on whether you need the lock for coordination (Redis is fine) or for correctness guarantees in the presence of failures (use etcd).
