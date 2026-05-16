---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Stateless processes** treat each request as if the application has never seen the caller before — all state lives in an external store, never in process memory. This is what makes horizontal scaling trivial: any instance can handle any request.

## The Core Idea

A stateless process holds no in-memory data that needs to survive beyond a single request/response cycle. It reads what it needs from an external source (database, cache, object store), does work, writes results back, and discards everything. The process itself is disposable.

The contrast is a stateful process: one where session data, user context, or computed state lives in the application's heap. That process becomes a *snowflake* — routing logic has to pin users to specific instances (sticky sessions), and losing the process means losing data. Scale out to 10 instances and suddenly you have a distributed state consistency problem you didn't ask for.

## Concrete Mental Model

Think of a stateless process like a pure function at the infrastructure level. Given the same inputs (request + external state), it produces the same output, regardless of which physical machine runs it. You can spin up 50 of them, kill 40, and the survivors just pick up the load without needing to "catch up."

A stateful process is more like a closure that captured a reference to mutable data — correct while it lives, but brittle and non-portable.

## Practical Scenarios

**Backend:** The typical refactor is pulling session state out of `HttpSession` or in-process caches and pushing it into Redis or a DB. A common trap: JWT validation looks stateless (the token is self-contained), but if you're maintaining a token revocation list in memory, you've smuggled state back in. The revocation list belongs in Redis.

**SRE:** Stateless services are what make graceful rolling deploys low-drama. No instance carries unique data, so you can terminate pods mid-flight during a deploy without user-visible state loss — the next request hits a new pod and reconstructs context from the store. Incident response also gets easier: restart the pod, it's clean.

**DevOps:** Autoscaling policies are only safe when processes are stateless. A scale-in event (removing instances) on a stateful service risks data loss or orphaned sessions. With stateless services, you can aggressively scale down without ceremony — no drain logic, no graceful shutdown rituals beyond finishing in-flight requests.

## The Tradeoff to Know

Statelessness shifts complexity from the application tier to the data tier. Your external stores (Redis, Postgres, S3) now carry the load your app processes shed. They need to be highly available and fast, otherwise you've traded local latency for network latency on every request. This is worth it — external stores can be managed independently, replicated, and backed up — but it's not free.
