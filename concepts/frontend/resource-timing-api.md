---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Resource Timing API

The Resource Timing API exposes per-resource network timing breakdowns for everything a page fetches — scripts, stylesheets, images, XHR/fetch calls. It's the programmatic equivalent of DevTools' waterfall chart, available at runtime.

### Core mechanism

Every loaded resource generates a `PerformanceResourceTiming` entry, which extends `PerformanceEntry`. Each entry records the full lifecycle of a request as high-resolution timestamps:

```
startTime → fetchStart → domainLookupStart/End → connectStart → secureConnectionStart
→ connectEnd → requestStart → responseStart → responseEnd
```

`responseStart - requestStart` is effectively client-side TTFB. `responseEnd - responseStart` is download time. The gap between `startTime` and `fetchStart` captures redirect time.

You access these via `PerformanceObserver` (preferred, streaming) or `performance.getEntriesByType('resource')` (snapshot):

```js
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.initiatorType === 'fetch') {
      console.log(entry.name, entry.responseStart - entry.requestStart); // TTFB
    }
  }
});
observer.observe({ type: 'resource', buffered: true });
```

`buffered: true` catches entries that fired before the observer was registered — important for resources loaded during parse.

Each entry also exposes `transferSize` (bytes over the wire, 0 if served from cache), `encodedBodySize`, and `decodedBodySize`, letting you distinguish cache hits from actual transfers.

One gotcha: cross-origin resources return zeroed-out timing fields unless the server sends `Timing-Allow-Origin: *` (or your specific origin). You can detect this — `transferSize` will be 0 and timing fields will be 0 even for non-cached requests.

### Practical scenarios

**Frontend:** Instrument your Real User Monitoring (RUM) pipeline. Instead of guessing whether your CDN is degraded for users in a specific region, you collect `domainLookupEnd - domainLookupStart` and `connectEnd - connectStart` in the field. Slow DNS + fast connect suggests a DNS issue; fast DNS + slow connect suggests routing or TLS overhead.

**Fullstack:** Your API might respond in 80ms server-side, but users report slowness. Resource Timing reveals the gap — maybe `requestStart - connectEnd` is high (connection reuse isn't happening), or `responseEnd - responseStart` is the culprit (slow response body streaming). Neither shows up in your server metrics.

**SRE:** Aggregate `responseStart - fetchStart` (total wait time excluding download) across your fleet to build client-perceived latency percentiles for each resource. This catches CDN or edge proxy issues that never surface in origin server logs because the request never reaches origin.

The key distinction from server-side APM: this measures what the browser actually experienced, including network topology, ISP routing, and protocol negotiation — all invisible from your backend.
