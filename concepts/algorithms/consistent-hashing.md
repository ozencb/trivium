---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**Consistent Hashing**

Standard hash tables assign keys via `hash(key) % n`. When `n` changes, nearly every key remaps — fine for in-process data, catastrophic for a distributed cache where a full rehash triggers a thundering herd of misses. Consistent hashing redesigns the hash space so topology changes only disturb ~1/n of keys.

**The mechanism**

Treat the hash output space (0 to 2³²-1) as a ring. Each node is placed on the ring by hashing its identifier. To locate a key, hash it to a ring position, then walk clockwise until you hit a node — that node owns it.

Add a node: it claims keys between itself and its predecessor. Remove a node: its keys migrate to the next clockwise node. Either way, only keys in the affected arc move. Everything else is undisturbed.

**Virtual nodes**

Raw consistent hashing gives uneven load — nodes land at arbitrary ring positions, some owning far more arc than others. The fix is virtual nodes (vnodes): hash each physical node multiple times under distinct labels (`node1-0`, `node1-1`, ...) so it owns many small arcs. Load distributes more uniformly, and node weighting becomes trivial — a larger machine gets more vnodes.

**Mental model**

Four servers on a clock face. A key hashes to "4 o'clock" and lives on the next clockwise server. Add a fifth server at "3 o'clock" — only keys between "2 o'clock" and "3 o'clock" migrate. Everyone else is unaffected.

**Where this shows up**

*Backend*: Cassandra, DynamoDB, and Riak partition data using consistent hashing with vnodes. Capacity additions trigger incremental migration, not full reshuffles.

*SRE*: Memcached and Redis clusters use it (Ketama is the classic client-side implementation) to limit cache cold-start blast radius during horizontal scaling. Without it, every scale event means a full miss storm.

*Fullstack*: Sticky session routing, multi-tenant data sharding, request fan-out — anywhere you're mapping a key to a backend server and expect the topology to change, consistent hashing prevents wholesale reassignment.

**The invariant**: keys that move when topology changes are proportional to the *size of the change*, not the dataset. That's what makes elastic scaling practical at any scale.
