---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Span Propagation

Span propagation is how trace context crosses process boundaries — it's the mechanism that lets a single logical request stay connected as it hops through multiple services. Without it, you'd have isolated spans in each service with no way to stitch them into a coherent trace.

### The Core Mechanism

When service A calls service B, A *injects* its current trace context into the outbound request — typically as HTTP headers or message metadata. Service B *extracts* that context on arrival, creates a child span with A's span as parent, and continues building out the trace tree. The trace ID stays constant. The parent-child relationship is established via the span ID that was injected.

Two header formats dominate:
- **W3C Trace Context** (`traceparent: 00-{trace-id}-{parent-span-id}-{flags}`) — the modern standard
- **B3** (`X-B3-TraceId`, `X-B3-SpanId`, `X-B3-ParentSpanId`) — Zipkin's format, still common in older Java stacks

The sampling decision also propagates. If service A decided to sample this request (1% of traffic, say), that flag travels downstream. Service B doesn't flip a coin independently — it honors the upstream decision. This prevents the situation where A samples a trace but B doesn't, leaving you with a broken chain.

**Baggage** is the lesser-known sibling: arbitrary key-value pairs that ride alongside the trace context. If you inject `user.id=abc123` into baggage at the API gateway, every downstream service can read it without re-extracting it from a database. It's powerful but has overhead — baggage travels in every request header, so keep it small.

### Mental Model

Think of it like a relay race baton. Each runner (service) carries the baton (trace context) forward. The baton doesn't change — same trace ID throughout. Each runner adds their own span to the record (their leg of the race), but everyone shares the same race ID. If a runner drops the baton (fails to propagate), the race record breaks from that point forward.

### In Practice

**Backend:** Most instrumentation libraries (OTel SDKs, Sleuth, etc.) handle inject/extract automatically for common transports — HTTP, gRPC, Kafka. Where you actually need to think about propagation is async boundaries: when you push a job onto a queue, you need to serialize the trace context into the message payload manually, or your worker's spans will have no parent.

**SRE:** Broken propagation is often the first thing to check when traces look fragmented in Jaeger/Tempo. If you see orphaned root spans from internal services that should clearly be children of something else, a middleware is probably dropping headers — common culprits are load balancers stripping non-standard headers, or an SDK configured with the wrong propagator format (B3 vs W3C mismatch between services).
