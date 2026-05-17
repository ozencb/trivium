---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Trace Sampling

Collecting every trace in a high-traffic system is economically unworkable — a service handling 10k RPS generates millions of spans per minute. Sampling lets you retain enough signal to be useful while keeping storage and ingestion costs sane.

### The Core Tension

There are two fundamentally different points where you can make the keep/drop decision:

**Head-based sampling** decides at the start of a request, before any spans are collected. A sampling rate (e.g., 1%) is applied at the entry point, and that decision propagates downstream via the trace context header (`traceparent` in W3C Trace Context, or `X-B3-Sampled` in Zipkin). Every downstream service respects the decision — if it's not sampled, they don't bother recording. This is cheap and stateless, but blind: you're deciding before you know whether the request will be slow, erroring, or otherwise interesting.

**Tail-based sampling** buffers the complete trace first, then decides at the end. A collector (like the OpenTelemetry Collector with the tail sampling processor) holds spans in memory until the root span closes, then applies rules: keep all traces with errors, keep all traces over 2 seconds, sample 1% of everything else. This catches the rare-but-important failures that head-based sampling statistically misses.

### Mental Model

Think of head-based as a coin flip at the door of a nightclub — fast, fair, but sometimes the interesting people get turned away. Tail-based is a bouncer who watches everyone dance for the whole night and then decides who gets a VIP wristband — much more accurate, but requires watching everyone.

### In Practice

**Backend:** Head-based works well when your error rate is high enough to be statistically visible at low sample rates. If you're seeing 0.1% error rates and sampling 1%, you'll get a reasonable number of error traces. But if errors are 0.01% — a rare race condition, a specific user segment hitting a bad code path — they'll slip through. The fix is layered sampling: head-sample at 5%, then tail-filter to always keep errors from that 5%.

**SRE:** Tail sampling introduces a stateful collector into your pipeline, which creates real operational challenges. The collector needs to buffer spans in memory across all services for the full duration of a request window. Collector restarts drop in-flight traces. Span arrival order isn't guaranteed — child spans often arrive before the root span, so the collector needs timeout logic and span reassembly. This is a genuine reliability concern to design around, not just an implementation detail.

### What Separates Senior Engineers Here

Most engineers know head vs. tail exists. The senior-level insight is understanding the failure modes: head-based sampling creates survivorship bias in your trace data (you only see the requests you decided to watch), while tail-based creates operational complexity and a potential bottleneck. The practical answer is almost always hybrid — head-sample to control volume, tail-filter to guarantee critical traces are retained. Knowing that trade-off, and how trace context propagation actually works at the header level, is what makes the difference in a design review.
