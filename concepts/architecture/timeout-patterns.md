---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Timeout Patterns

Without explicit timeouts, a slow or unresponsive dependency holds your thread/connection open indefinitely—one degraded upstream silently exhausts your thread pool and turns latency into a full outage. Timeouts are how you bound the blast radius of dependency failures before they become your failure.

### The Three Distinct Timeouts

Most HTTP clients expose at least two, often three:

**Connect timeout** — how long to wait for the TCP handshake to complete. If the host is unreachable or the server's accept queue is full, your SYN sits unanswered. This should be short (1–3s). You either connect fast or you don't.

**Read timeout** — how long to wait for the *next chunk of data* once connected. Critical subtlety: this is *not* a total elapsed time limit. It resets with each received byte. A server that trickles 1 byte/sec can technically hold a connection open for minutes without ever tripping a read timeout set to 10s.

**Total (deadline) timeout** — an absolute wall-clock limit from request start to final byte received. This is the one most engineers forget to set, and it's the one that actually enforces your latency budget. gRPC calls this a "deadline" and propagates it across hops.

### Mental Model

Three guards at different phases: connect timeout guards the handshake, read timeout guards the data stream, total timeout guards the clock. You need all three because each covers a failure mode the others miss.

### For Backend Engineers

Your per-call timeout must fit inside your service's own latency budget. If you have a 500ms SLO and make two serial downstream calls, each needs a hard cap well under 250ms—leaving room for your own processing. The common mistake is being "generous" with timeouts to reduce errors. What you actually get is thread pools filling with waiting-but-not-failed requests, and your service becoming the bottleneck.

Also: retrying on timeout without jitter or a retry budget is a thundering herd waiting to happen. A slow dependency that trips timeouts across your fleet triggers a synchronized retry storm at exactly the moment the dependency is already struggling.

### For SREs

Timeout misconfiguration produces specific observable signatures. Read timeouts set too low on endpoints that return large payloads show up as intermittent errors correlated with response size—not request rate. Connect timeouts set too high during a network partition create a slow thread leak instead of immediate circuit-breaker trips, making incidents harder to detect.

When tuning, look at p99.9 latency of the upstream, not p99. Your timeout should be above the normal high-percentile latency (so you're not timing out valid slow requests) but below the threshold where holding the connection hurts you more than failing fast.

### What Separates Senior Engineers Here

The senior engineer asks: *what's my total latency budget across the full request chain, and how does each hop's timeout fit into it?* They propagate deadlines so each downstream call inherits a shrinking budget rather than resetting to its own independent timeout. That's the bridge to Circuit Breaker—once you're measuring and enforcing per-call time budgets, you have the signal you need to trip a breaker before exhausting resources entirely.
