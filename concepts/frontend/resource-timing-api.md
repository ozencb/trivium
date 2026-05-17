---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Resource Timing API

The Resource Timing API gives you precise, phase-by-phase timing data for every sub-resource your page loads—scripts, stylesheets, images, API calls—without touching those requests in code. Where Performance Observer tells you *that* something happened, Resource Timing tells you *where* the time went.

### The Core Mechanism

Every resource fetch goes through a fixed sequence of phases: redirect → DNS lookup → TCP connection → TLS negotiation → request sent → first byte received → transfer complete. The browser internally timestamps each transition, and the Resource Timing API exposes these as `PerformanceResourceTiming` entries on the performance timeline.

```js
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const dns = entry.domainLookupEnd - entry.domainLookupStart;
    const tcp = entry.connectEnd - entry.connectStart;
    const tls = entry.secureConnectionStart > 0
      ? entry.connectEnd - entry.secureConnectionStart
      : 0;
    const ttfb = entry.responseStart - entry.requestStart;
    const transfer = entry.responseEnd - entry.responseStart;

    console.log(entry.name, { dns, tcp, tls, ttfb, transfer });
  }
});
observer.observe({ type: 'resource', buffered: true });
```

One critical detail: cross-origin resources will have most timing fields zeroed out unless the server sends `Timing-Allow-Origin: *` (or your origin specifically). Without that header, you get `fetchStart` and `responseEnd` but nothing in between—you see duration, not breakdown.

### Practical Scenarios

**Frontend:** You're debugging why your CDN-served JS bundle feels slow on first load for users in certain regions. Network DevTools shows 800ms, but you can't reproduce it locally. Ship Resource Timing collection in your RUM (Real User Monitoring) setup, and you find DNS is eating 400ms for users on mobile carriers—CDN nameserver propagation issue, not your bundle size.

**Fullstack:** Your internal API calls from the browser take 200ms average, but p95 is 900ms. Resource Timing reveals the outliers have a 600ms TCP handshake—they're hitting a cold server instance that hasn't kept connections warm. You adjust your load balancer's connection draining settings.

**SRE:** After a deployment, page load regressions appear in your RUM dashboards. Resource Timing entries show TLS handshake time spiked—the new cert rollout included a longer chain. You catch it before most users notice because you're alerting on phase-level percentiles, not just total duration.

### What to Watch For

- `transferSize` is 0 for cache hits (not an error—means it came from disk/memory cache)
- `decodedBodySize` vs `encodedBodySize` lets you verify compression is actually being applied
- Waterfall gaps between `responseStart` and `requestStart` often reveal queueing, not network latency

The API shines when you stop treating network time as a black box and start attributing it to specific infrastructure layers.
