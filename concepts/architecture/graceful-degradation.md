---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Graceful Degradation

When a dependency fails, returning *something useful* is almost always better than returning nothing. Graceful degradation is the practice of defining, upfront, what "something useful" looks like for each failure mode—and building the machinery to serve it.

### The core mechanism

The key shift is moving from binary thinking (up/down, success/error) to tiered thinking. Before you write a service call, you should be asking: "If this fails, what's the minimum viable response?" That question forces you to distinguish *core value* from *auxiliary value*.

This isn't just defensive coding—it's a design discipline. You're explicitly modeling your system's dependency graph and labeling edges as "required" or "degradable." A product page that pulls from an inventory service, a recommendations service, and a reviews service has one required dependency and two degradable ones. That distinction should live in your design docs, not just your catch blocks.

Common implementation patterns:
- **Stale cache reads** — serve cached data with an explicit staleness marker rather than blocking on a live fetch
- **Partial results** — return what succeeded, omit what failed, tell the caller which
- **Default/fallback values** — return sensible pre-computed defaults when personalization data is unavailable
- **Feature disabling** — drop non-critical features entirely rather than erroring on them

### Mental model

A car's dashboard versus its engine: a failing non-critical sensor triggers a warning light, not an engine shutoff. You still get home. Graceful degradation is building that distinction into your software intentionally.

### Practical connection

**Backend**: When aggregating microservices, separate response fields into "required" and "optional" contracts. Use something like a `errors[]` envelope field alongside `data`—callers can inspect whether the result is full or partial.

**SRE**: Your SLOs should model degraded states explicitly. Binary availability metrics lie—a service that's up but serving 100% stale cache looks "healthy" by uptime but may be hurting users. Define what degraded success looks like so you can measure it.

**Fullstack**: Frontend feature flags are a natural degradation layer. When a personalization API is slow, disable the personalized section and render the generic version. This is graceful degradation at the UI boundary.

### The pitfalls worth knowing

**Silent degradation is dangerous.** Serving stale inventory data without indicating staleness leads users to make decisions on wrong information. Degraded responses need to be *honest* about what they are.

**Degraded paths rot.** Because they're rarely exercised, they break silently. Inject failures in staging and chaos tests explicitly hit your fallback paths—otherwise you'll discover they don't work during an actual incident.

**Don't conflate "degraded" with "wrong."** If your fallback default is contextually incorrect for a user segment, you haven't degraded gracefully—you've just failed quietly. Make sure your fallbacks are genuinely safe to serve broadly.

Graceful degradation pairs naturally with Circuit Breaker (which decides *when* to stop calling a dependency) and Bulkhead (which contains blast radius). Circuit Breaker tells you the dependency is down; graceful degradation tells you what to do instead.
