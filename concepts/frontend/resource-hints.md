---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Resource hints are declarative directives you embed in HTML (or HTTP headers) to tell the browser about resources it will need before it would otherwise discover them. The payoff is eliminating the latency gap between when the browser *could* start fetching something and when it *actually* does.

## The Core Mechanism

Browsers process HTML top-to-bottom. They learn about a font inside a CSS file only after fetching and parsing that CSS—which they only learned about from a `<link>` tag in the HTML. By then, multiple round-trips have already happened. Resource hints short-circuit this discovery chain.

There are four main hints, each with a distinct scope:

- **`preload`** — "I *will* use this resource on the current page, fetch it now at high priority." The browser fetches it and holds it in a preload cache until your HTML/JS requests it normally.
- **`preconnect`** — "I'll be hitting this origin soon, warm up the connection." Handles DNS lookup, TCP handshake, and TLS negotiation upfront. Saves 100–300ms on the first request to a cold origin.
- **`dns-prefetch`** — Cheaper version of preconnect: just resolve the DNS. Good when you're unsure whether you'll actually need the connection.
- **`prefetch`** — "I'll probably need this on the *next* page." Low-priority fetch, stored in HTTP cache for future navigation.

```html
<link rel="preconnect" href="https://api.example.com">
<link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin>
<link rel="prefetch" href="/js/dashboard-chunk.js">
```

The `as` attribute on `preload` is not optional ceremony—it sets request priority and the correct `Accept` header, and prevents the browser from double-fetching when the resource is actually used.

## Mental Model

Think of it as giving your build crew a materials list before they start reading blueprints. Without hints, workers call for supplies only when they encounter a need mid-construction. With hints, supplies are already on-site.

## Practical Scenarios

**Frontend:** Google Fonts injects a stylesheet which then declares the actual font files. Two redirects deep before the browser knows about the font binary. A `preload` on the `.woff2` URL—placed in your `<head>`—collapses that discovery chain and eliminates layout shift caused by late-loading fonts.

**Fullstack/SSR:** Your server renders HTML that triggers API calls to `api.yourservice.com`. Add a `preconnect` to that origin in the initial HTML response (or better, as an HTTP `Link:` header so the browser sees it before parsing HTML at all). First API call skips connection setup entirely.

**SPA routing:** Attach a `prefetch` for the next route's JS chunk when the user hovers a nav link. By the time they click, the chunk is already cached.

## The Trap to Avoid

`preload` competes for bandwidth with everything else. Preloading resources you don't use on the current page actively hurts performance—you're front-loading bandwidth consumption for nothing. Treat it as a scalpel for your critical rendering path, not a bulk optimization.
