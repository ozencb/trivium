---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Real User Monitoring (RUM)

RUM captures performance metrics from actual user sessions in production and ships them to an analytics backend. The critical distinction from Lighthouse or synthetic testing: you're measuring what real people on real devices on real networks actually experience — which frequently diverges from lab results by 2–5x.

### The Core Mechanism

You attach a `PerformanceObserver` to watch for specific entry types (`largest-contentful-paint`, `layout-shift`, `first-input`, etc.) and accumulate them during the session. On page hide or unload, you beacon the payload using `navigator.sendBeacon()` — not `fetch` — because `sendBeacon` is specifically designed to survive tab close and page navigation without blocking.

```js
const vitals = {};
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    vitals.lcp = entry.startTime;
  }
}).observe({ type: 'largest-contentful-paint', buffered: true });

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    navigator.sendBeacon('/analytics', JSON.stringify(vitals));
  }
});
```

The `buffered: true` flag is easy to miss but essential — it lets you observe entries that fired before your observer was registered.

### What Separates Senior Thinking Here

Raw averages are useless. You want p75 and p95 distributions segmented by device class, connection type, geography, and route. An LCP of 2.1s average can mask a p95 of 8s on low-end Android — which is the reality for a significant user segment. Google's Core Web Vitals assessment uses p75 for exactly this reason.

Attribution matters too. Knowing LCP is slow tells you nothing actionable. You need the element that triggered it, the page/route, whether it was a cache hit, and the resource that blocked it. Libraries like `web-vitals` (from the Chrome team) surface `attribution` objects specifically for this.

Also: sample your data. At any meaningful scale, capturing 100% of sessions creates noise and backend costs with no marginal insight. 10–20% sampling is standard.

### Practical Scenarios

**Frontend:** When a product manager asks why conversion dropped after a deploy, RUM lets you correlate the INP regression on the checkout page with the deploy timestamp — something no synthetic test would catch because it only reproduced on mid-tier devices.

**Fullstack:** TTFB from RUM versus your server's p99 latency tells you whether slowness is server-side or in the network/DNS path. If server logs look fine but RUM TTFB is high, you're looking at a CDN or routing issue.

**SRE:** RUM is a leading indicator for incident impact. Server error rates spike immediately; RUM degradation sometimes precedes that or captures user-perceived slowness that server metrics miss entirely.

The reason this shows up in design discussions: most teams measure synthetic performance and ship confidently, then wonder why their Core Web Vitals field scores don't improve. RUM closes that loop.
