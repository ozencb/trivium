---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Span Propagation

When a request crosses a service boundary, the receiving service has no inherent way to know it's part of an ongoing trace. Span propagation solves this by encoding the current trace context into the outbound request — headers, message metadata, queue attributes — so the downstream service can adopt that context and parent its own spans under the same trace.

**The core mechanism**

A span represents a unit of work. It has a trace ID (shared across the entire request chain) and a span ID (unique to itself). When service A calls service B, A *injects* its current span context into the carrier — typically HTTP headers like `traceparent` (W3C standard) or `X-B3-TraceId`/`X-B3-SpanId` (Zipkin-style). Service B *extracts* that context, creates a new span with its own span ID but the same trace ID, and marks A's span ID as the parent. No central registry involved — just header passing.

The two operations are literally called `inject` and `extract` in OpenTelemetry's API, and this symmetry is the whole protocol.

**Concrete mental model**

Think of it like a baton in a relay race. The trace ID is the baton — it travels the entire race. Each runner (service) holds it briefly, adds their leg to the record, then passes it forward. Without propagation, each runner starts fresh with no baton, and you get a pile of disconnected sprints instead of one coherent race.

**Where this bites you in practice**

- **Async boundaries are the common failure point.** HTTP middleware often propagates automatically, but when you enqueue a job, publish to Kafka, or trigger a Lambda asynchronously, the context silently drops unless you explicitly serialize it into message metadata. You'll see a complete trace for the sync portion and a orphaned, unlinked trace for the async portion.

- **Third-party HTTP clients.** Auto-instrumentation covers popular clients (fetch, axios, requests), but custom or legacy clients won't inject headers unless you wire it up manually.

- **Sampling decisions must propagate too.** The `traceparent` header includes a sampling flag. If the upstream decided to sample this trace, downstream must respect that — otherwise you get partial traces where only some hops appear.

**For backend engineers**: check your messaging layer. gRPC and HTTP are usually handled by auto-instrumentation. SQS, Kafka, RabbitMQ — manually inject context into message attributes/headers at publish time, extract at consume time.

**For SREs**: when traces look truncated or disconnected at service boundaries, missing propagation is almost always the cause. Validate by checking whether the `traceparent` (or equivalent) header is present on the incoming request in the downstream service's logs. No header means the upstream isn't injecting — fix it there, not in the downstream.
