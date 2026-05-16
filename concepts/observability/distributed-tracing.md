---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Distributed tracing gives you end-to-end visibility into a single request as it travels through multiple services, so you can answer "where did this 2-second request actually spend its time?"**

## Core Mechanism

A **trace** represents one logical request. It's a tree of **spans**, where each span is one unit of work — an HTTP call, a database query, a cache lookup. Every span carries:

- A `trace_id` shared across the entire request lifetime
- Its own `span_id`
- A `parent_span_id` pointing to whoever called it
- Start/end timestamps and arbitrary key-value metadata

The critical piece is **context propagation**: when Service A calls Service B, it injects the current `trace_id` and `span_id` into the request headers (W3C's `traceparent`, or Zipkin's B3 headers). Service B reads these headers, creates a child span, and continues the tree. Each service ships its spans asynchronously to a collector (Jaeger, Zipkin, an OTEL collector), which reassembles them into a timeline after the fact.

## Concrete Mental Model

User hits "checkout." The API gateway creates the root span. It calls the order service (child span), which fans out to inventory (grandchild) and payment (grandchild) in parallel. Payment calls a fraud-scoring service (great-grandchild). Every hop records its own latency. The collector stitches spans by `trace_id` into a waterfall view: total 820ms, breakdown shows payment took 760ms, fraud scoring took 700ms of that. You now have a directed path to the problem, not a haystack.

## Practical Scenarios

**Backend**: p99 latency regressed after a deploy. Logs say nothing. Traces show one specific span — a JOIN query in the recommendations service — taking 600ms on requests where `user_segment = 'enterprise'`. Missing index on a recently added column. You'd never find this from metrics alone.

**SRE**: Cascading failures are hard to attribute. Traces expose the propagation chain: Service C errored because B timed out because A was retrying aggressively against a downstream that D owns. Error attribution stops being a blame game and becomes a structural observation.

**DevOps**: During a canary rollout, trace span trees on new pods are unexpectedly deeper — new code is making an extra external call per request that wasn't there before. Catch behavioral regressions, not just performance regressions.

## What This Unlocks

Once the trace/span model clicks, two problems follow naturally: **trace sampling** (you can't keep every trace — how do you pick which ones matter?) and **span propagation** (what actually happens when you cross gRPC, async queues, or thread boundaries — where does context get lost?).
