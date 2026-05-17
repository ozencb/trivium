---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Prerendering

Prerendering means doing the work of rendering a page *before* the user requests it, so when they do navigate there, the response is instant—either already in cache, already in the browser, or already in memory. It's latency elimination, not latency reduction.

### The core idea

There are two distinct things called "prerendering," and conflating them causes confusion:

**Build-time prerendering (SSG):** You already know this one. At build time, a framework like Next.js or Astro renders routes to static HTML. When a user hits `/about`, they get a file, not a render.

**Speculative prerendering:** The browser (or a CDN/edge layer) *predicts* where the user is going and starts rendering that page *now*, while they're still on the current one. By the time they click, the page is ready. This is the newer, more interesting half.

The Speculation Rules API (Chrome 109+) is how you opt into speculative prerendering declaratively:

```json
<script type="speculationrules">
{
  "prerender": [{ "urls": ["/checkout", "/product/123"] }]
}
</script>
```

The browser fetches and fully renders those pages in a hidden context—executing JS, fetching data, everything—so navigation is effectively zero-latency. This is stronger than `<link rel="prefetch">`, which only fetches the HTML but doesn't execute it.

### Mental model

Think of it like a restaurant pre-plating the most commonly ordered meal before anyone orders it. If you order it, you're eating in 30 seconds. If not, they toss it. Speculative prerendering has the same tradeoff: you're burning CPU/network on a bet.

### Where it matters in practice

**Frontend:** Static marketing sites and docs are the easy win—build-time SSG handles this already. Speculative prerendering adds value on top: prerender the `/pricing` page for users browsing `/features`, or the product detail page when a user hovers over a product card.

**Fullstack:** Checkout flows are the classic target. Prerender the payment page while the user reviews their cart. The catch: pages with personalized content or auth-gated data can't safely be prerendered speculatively unless you're careful about what gets rendered versus fetched at runtime.

### Pitfalls to know

- **Side effects on load:** If your page fires analytics events or mutates state on mount, speculative prerender will fire them prematurely. Pages need to be "prerender-safe."
- **Cache invalidation on SSG:** Build-time prerendering is static—stale content is a real problem for anything with high update frequency.
- **Over-speculation:** Prerendering 20 pages on every route is wasteful. It works best when you have high-confidence signals (hover, likely navigation paths) or a small set of high-probability destinations.

The Speculation Rules API gives you `"eagerness"` controls (`immediate`, `eager`, `moderate`, `conservative`) to tune how aggressively the browser bets.
