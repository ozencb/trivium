---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## OpenTelemetry

Before OpenTelemetry, every observability vendor (Datadog, Jaeger, Zipkin, New Relic) required you to instrument your code against their specific SDK. Switching vendors meant rewriting instrumentation across every service. OpenTelemetry solves this by standardizing *how you emit* observability data, decoupled from *where it goes*.

### Core Mechanism

OTel has three layers you need to internalize:

**1. The API** — thin, stable interfaces your application code calls (`tracer.startSpan()`, `meter.createCounter()`). Libraries can instrument against this without taking a hard dependency on any implementation.

**2. The SDK** — the implementation that collects, processes, and exports. This is where sampling decisions happen, where you attach resource attributes (service name, version, env), and where you configure exporters.

**3. The Collector** — an optional but critical piece: a standalone proxy/pipeline that receives telemetry from your services, processes it (filtering, batching, enriching), and fans it out to one or more backends. Your app talks OTLP (OTel Protocol) to the Collector; the Collector speaks whatever the backend requires.

The key insight: your instrumentation code never changes when you swap backends. You reconfigure the Collector.

### Mental Model

Think of OTel as USB-C for observability. Your devices (services) expose a standard port. Your chargers (backends) plug into a universal hub (Collector). The device doesn't care what's on the other end.

### Where This Shows Up in Practice

**Backend:** Auto-instrumentation agents for Java, Python, Go handle HTTP clients, DB calls, and message queues without code changes. You add manual spans for business-critical paths — payment processing, inventory checks — giving you application-level context that infrastructure metrics can't provide.

**SRE:** The Collector's pipeline architecture lets you control cardinality explosions. You can drop high-volume debug spans at the Collector before they hit your expensive backend. You can route traces to Jaeger and metrics to Prometheus simultaneously.

**Fullstack:** Browser and mobile SDKs emit the same trace format, so a user-facing error in React can carry the same `trace_id` that surfaces in your backend logs — end-to-end correlation without custom plumbing.

**DevOps:** Infrastructure-as-code for observability becomes viable. One Collector config defines your entire telemetry pipeline, versioned in git, environment-aware via config overlays.

### What Trips People Up

OTel's context propagation is the part most engineers underestimate. Spans only form meaningful trees if the trace context (`traceparent` header) flows correctly across service boundaries — including async message queues, where you have to manually inject/extract headers. Miss this and you get disconnected spans that look like orphans in your tracing UI.

The other gotcha: the spec has "stable," "beta," and "experimental" signals. Logs were experimental until recently. Check stability before building on a feature in production.

In design discussions, knowing OTel signals that you're thinking about operational costs and vendor flexibility upfront — not as an afterthought.
