---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Distributed tracing gives you a single coherent view of a request as it flows through multiple services — without it, you're left correlating logs across systems by timestamp and hoping for the best. It's the difference between watching a relay race live versus reconstructing it from each runner's personal diary.

## The Core Mechanism

Every request gets a **trace ID** at its origin point (typically your API gateway or the first service that touches it). As that request fans out — auth service, user service, database calls, downstream APIs — each service creates a **span**: a timed unit of work that records what it did, how long it took, and any relevant metadata.

The critical piece is **context propagation**: the trace ID (and parent span ID) travel *with* the request, typically as HTTP headers (`traceparent` in W3C Trace Context, or `X-B3-TraceId` in older Zipkin-style). Each service reads these headers, creates its child span, does its work, and passes the context forward. The result is a tree of spans that reconstructs the full execution path.

## Concrete Mental Model

Imagine a request to `POST /checkout` takes 2.3 seconds. Your metrics tell you it's slow. Your logs tell you each service "completed successfully." Tracing tells you: 1.8s of that was spent waiting on the inventory service, which was waiting on a Redis lock that had been held for 1.6s by a batch job.

That diagnosis goes from "unknown" to "actionable" in minutes instead of hours of log archaeology.

## Practical Scenarios

**Backend**: Service A calls Service B calls Service C. Latency spikes intermittently. Without traces, you instrument each service independently and try to correlate by timestamp. With traces, you filter on high-duration traces, click into one, and immediately see which span is the outlier — and what that span's attributes say (e.g., `db.query`, row count, connection pool saturation).

**SRE**: During an incident, you need to know whether slowness is in *your* service or a dependency. Flame graphs from traces answer this instantly. You also get error propagation chains — when Service C throws, you see exactly which upstream calls were affected.

**DevOps**: Traces expose where your service mesh is adding overhead. An mTLS handshake that takes 50ms on every cross-service call is invisible in metrics but obvious when you see it as a recurring span in every trace.

## Common Pitfalls

- **Broken propagation**: One service in the chain doesn't forward the trace headers (often a message queue or async worker), and the trace splits. Always instrument producer/consumer boundaries explicitly.
- **Missing spans**: Not every library auto-instruments. Database clients, HTTP clients, gRPC stubs — verify each one is traced.
- **Over-sampling in prod**: Tracing every request at high traffic is expensive. This is why Trace Sampling exists: you collect a statistically useful subset, with bias toward errors and high-latency requests.
