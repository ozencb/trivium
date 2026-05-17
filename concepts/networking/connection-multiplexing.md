---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Connection Multiplexing

HTTP/1.1 treated connections as single-lane roads: one request travels, then the next. Browsers worked around this by opening 6-8 parallel TCP connections per origin, but that's just multiplying the overhead, not eliminating it. Connection multiplexing lets you send many independent streams over one TCP connection simultaneously, with each stream tracked by a numeric identifier.

**The core mechanism**

Each request/response pair gets assigned a stream ID. Frames (the unit of transmission) carry that ID, so the receiver can reconstruct which bytes belong to which stream. This is distinct from pipelining—which HTTP/1.1 attempted and largely abandoned—because multiplexing doesn't require responses to arrive in request order. Stream 7 can complete before stream 3. The connection itself handles ordering at the TCP level; the application layer handles per-stream sequencing.

Flow control, which you already know, applies at two levels here: per-stream and per-connection. That's the part that makes concurrent streams viable rather than chaotic—each stream has its own receive window so a slow consumer on one stream doesn't stall others.

**Mental model**

Think of a single highway with many lanes, each lane identified by its stream ID. TCP ensures bytes arrive in order on the highway, but lanes can move at different speeds and finish independently. HTTP/1.1 was a single-lane road where you had to wait for the car ahead to reach its destination before yours could depart.

**Practical scenarios**

*Backend:* When your service fans out to multiple downstream APIs—say, hitting a user service, permissions service, and preferences service before assembling a response—multiplexing means those three calls share one connection to each dependency. Under HTTP/1.1 with connection pools, you're managing pool sizes, waiting for available connections, and absorbing TCP handshake latency on pool exhaustion. With multiplexing (gRPC does this over HTTP/2), you tune stream concurrency instead of pool size, and you avoid the thundering-herd behavior when a dependency restarts and your connection pool needs to rebuild.

*SRE:* The failure mode to watch is head-of-line blocking at the TCP layer—it didn't disappear, it moved. If a packet is lost, all streams on that connection stall waiting for retransmission. HTTP/3 (QUIC) addresses this by moving to UDP and isolating packet loss per stream. So if you're seeing latency spikes under packet loss that don't correlate with request volume, the underlying transport's HOL blocking is a likely culprit. Also watch for misconfigured `MAX_CONCURRENT_STREAMS` settings—set too low, they negate the benefit; too high under high concurrency, they create server-side memory pressure.

The main reason not to reach for multiplexing: it adds complexity without payoff if your requests are naturally sequential or if you're already bottlenecked on compute rather than connection overhead.
