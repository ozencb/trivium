---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Network Partitions

A network partition occurs when nodes in a distributed system lose the ability to communicate with each other — not because they've crashed, but because the network path between them is severed. This is one of the core failure modes you must design around, because your system has to make decisions about data and availability even when it can't confirm what the other side knows.

### The core problem: ambiguity

The hard part isn't the partition itself — it's that nodes **cannot distinguish a partition from extreme latency**. When node A sends a message to node B and gets no response, A faces genuine uncertainty: is B dead? Is the network broken? Is B alive but slow? There's no way to know from A's perspective. This ambiguity is fundamental to distributed systems, not an implementation detail you can engineer away.

Partitions also come in non-obvious shapes:
- **Partial**: A↔C works, B↔C works, but A↔B is broken
- **Asymmetric**: A can send to B, but B's responses never reach A
- **Transient**: connectivity drops for 200ms, just long enough to break a consensus round

### Mental model

Two data centers connected by a single cross-region link. The link goes down. Both DCs are fully operational — serving requests, writing data, passing their own health checks. But they've lost coordination. Each one sees a normal-looking local world while silently diverging from the other.

### For backend engineers

If you run a primary/replica database and a partition isolates the replica, writes continue on the primary while the replica falls behind. When the partition heals, you have diverged state. How you reconcile that is a product decision disguised as an infrastructure problem — last-write-wins, manual intervention, CRDTs — and you need a policy *before* it happens.

If you're using distributed consensus (Raft, Paxos, etcd), a minority partition loses quorum and stops making progress by design. Your application code needs to handle `quorum unavailable` as a real case, not retry it indefinitely as if it were a transient timeout.

### For SRE

Partitions are deceptively quiet. Individual nodes look healthy — their local health checks pass, CPU/memory look fine. The signal lives in **cross-region error rates, replication lag, and consensus timeouts**. Alert on those, not just node liveness.

The other thing: most runbooks for partition scenarios are wrong until you've actually triggered one. `tc netem` lets you inject packet loss and latency at the kernel level. Running controlled partition drills is the only way to know whether your system stays consistent, degrades gracefully, or silently corrupts state — and you want to find out before your users do.

Understanding partitions is what makes CAP Theorem non-trivial: it's specifically asking what tradeoffs you accept *when a partition is active*, which is the only time the choice becomes forced.
