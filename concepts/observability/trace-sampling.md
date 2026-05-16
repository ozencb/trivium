---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Trace Sampling

Trace sampling is the practice of recording only a fraction of traces instead of every request — because storing and processing 100% of traces at scale is prohibitively expensive, and most of them tell you nothing new.

### The core mechanism

When a request enters your system, a sampling decision is made: record this trace, or discard it. This decision propagates through every service in the call chain via the trace context headers (`traceparent` in W3C Trace Context). The critical point is that the decision must be consistent — you can't have Service A record a span while Service B discards it for the same trace, or you get orphaned, useless fragments.

There are two broad strategies:

**Head-based sampling** — decide at the entry point (the root span). Simple and cheap: the decision is made once before you know anything about the request's outcome. Commonly implemented as a fixed-rate (1%) or probabilistic sampler.

**Tail-based sampling** — buffer spans and decide *after* the trace completes. This lets you keep 100% of slow or erroring traces and drop boring fast ones. It's more expensive (requires a collector that holds spans in memory) but far more useful in practice. Tools like Jaeger's sampling or OpenTelemetry Collector's `tailsampling` processor implement this.

### Mental model

Think of a security camera system for a warehouse. Head-based sampling is recording one frame per second no matter what — cheap, but you'll miss the exact moment something breaks. Tail-based sampling is motion-activated recording — you only keep the footage where something actually happened.

### Practical scenarios

**Backend:** You're running a high-traffic API at 50k RPS. At 1% head-based sampling, you still get 500 traces/sec — plenty for latency histograms and error analysis. But for debugging a rare race condition that only manifests on 0.01% of requests, you configure a tail sampler to keep 100% of traces where any span has `error=true` or `duration > 2s`.

**SRE:** During an incident, you want full fidelity. Dynamic sampling lets you crank sampling rate to 100% for a specific service or endpoint temporarily. Some systems support this via remote configuration (OpenTelemetry's OpAMP protocol, for example), so you can increase sampling without a deploy. After the incident, you dial it back to avoid drowning your trace storage.

### The gotcha

Sampling interacts badly with derived metrics. If you compute error rates from sampled trace data, your rates are only accurate if errors are sampled at the same rate as non-errors — which they won't be if you're doing intelligent tail sampling. Keep your metrics pipeline separate from traces; don't derive error rates from span counts.
