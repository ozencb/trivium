---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Real User Monitoring (RUM)

RUM is the practice of capturing performance and behavioral telemetry directly from real users' browsers in production. The point is simple: synthetic tests tell you what your app *should* do under controlled conditions; RUM tells you what it *actually* does across the full distribution of devices, networks, and geographies hitting your site.

### Core Mechanism

You inject a JavaScript snippet — either hand-rolled or via a library like `web-vitals`, Datadog RUM, or Sentry — that hooks into the browser APIs you already know: Performance Observer, Navigation Timing, Resource Timing, Long Tasks. The snippet collects events (Core Web Vitals, errors, custom marks) and batches them to a backend collector, usually via `sendBeacon` so it doesn't block unload.

The data you receive isn't a single score — it's a distribution. Your lab LCP might be 1.8s, but RUM shows P75 is 3.9s for mobile users in certain regions. That gap is invisible until you're measuring real sessions.

A useful mental model: think of RUM as distributed tracing, but for the browser. Instead of tracing a request through microservices, you're tracing user experience from navigation start through every meaningful interaction.

### Practical Scenarios

**Frontend**: You ship a new infinite scroll component. Lighthouse looks fine. But RUM shows INP spiking for users on mid-tier Android devices because your scroll handler is doing layout-triggering work on the main thread. You'd never catch that in a lab test run against a high-end MacBook. RUM lets you set alerts on metric regressions per-route, not just globally.

**Fullstack**: You make a backend change that increases DB query latency by 150ms. Server p99 is technically within SLO. But RUM shows that LCP for the product detail page — which depends on that query — jumped 400ms for real users, because server-think-time sits in the critical rendering path. RUM gives you the user-facing consequence of backend decisions that latency dashboards alone won't surface.

**SRE**: You can define frontend SLOs backed by RUM data — e.g., "P75 LCP under 2.5s for 95% of sessions per 28-day window." A deploy that keeps your servers green but degrades real user experience is still an incident. RUM feeds your error budget the same way server-side metrics do, just from a different vantage point.

### Implementation Detail Worth Knowing

Sampling is non-trivial. Shipping every event from every session doesn't scale, and your slow users — the ones you most need data on — are also the ones most likely to drop your beacon before it fires. Most production setups sample 1–10% overall but bias toward slower sessions or pages with known issues. Get this wrong and your P95 data will be systematically misleading.

The real power of RUM isn't any single metric — it's segmentation. Being able to filter LCP by browser, connection type, route, deploy hash, or A/B variant is where the observability value actually lives.
