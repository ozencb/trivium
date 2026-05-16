---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Timeout Patterns** are explicit deadlines you set on operations so a slow dependency can't hold your system hostage indefinitely — they turn unbounded waits into predictable failures.

## The Core Mechanism

Without timeouts, a call to a downstream service that never responds blocks the thread (or event loop slot) waiting for it. At scale, enough of these pile up and exhaust your connection pool, thread pool, or request queue — not because the downstream is fully down, but because it's *slow*. Slow is often worse than down.

The key insight is that timeouts are not just about "giving up." They're about preserving your system's capacity to serve other requests. A thread blocked waiting is a thread that can't do useful work.

There are two distinct timeout types worth distinguishing:

- **Connection timeout**: how long to wait while establishing a connection (TCP handshake). Short and aggressive is fine here — if a peer can't complete a handshake in 200ms, something is fundamentally wrong.
- **Read/request timeout**: how long to wait after the connection is established for the response to arrive. This is harder to tune because legitimate processing times vary.

A third pattern, **deadline propagation**, is what separates naive timeouts from robust ones. When service A calls B which calls C, A's 500ms timeout doesn't automatically flow to B and C. If B uses its own 2s timeout internally, it'll keep working long after A has already given up and returned an error to the client. The request becomes "orphaned" — consuming resources on B and C with no one waiting for the result. gRPC and HTTP headers like `X-Request-Deadline` exist specifically to propagate these deadlines end-to-end.

## Mental Model

Think of it like a restaurant kitchen. You place an order (request). If the kitchen takes 45 minutes and you've already left (timeout at 10 minutes), the table is now free for someone else — but the kitchen is still cooking your meal. Deadline propagation is telling the kitchen "if I'm not here in 10 minutes, throw the food away."

## Backend Context

When you're writing a service that calls a database or third-party API, set *both* connection and read timeouts explicitly. Most HTTP clients default to no timeout or absurdly long ones (e.g., Java's `HttpURLConnection` defaults to infinite). A database query that occasionally takes 30s under load will cascade into request queue saturation fast.

For idempotent operations, a timed-out request can be retried. For non-idempotent ones (payments, writes), a timeout means you genuinely don't know if the operation succeeded — you need idempotency keys to retry safely.

## SRE Context

Timeouts are the first line of defense before circuit breakers kick in. When tuning, p99 latency of the dependency under normal load is your floor — set timeouts below that and you'll manufacture errors. A common heuristic: timeout at 2–3× the p99. Track timeout rate as a signal; a spike means your dependency is degrading before it fully fails, which is your early warning to investigate or shed load.
