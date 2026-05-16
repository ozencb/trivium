---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Streaming SSR sends HTML to the browser incrementally as it's generated on the server, rather than waiting for the full page to be ready. This matters because it decouples time-to-first-byte from time-to-full-render — the browser can start parsing, load subresources, and display content while the server is still working.

## The Core Mechanism

Traditional SSR is synchronous: the server renders the entire component tree, produces a complete HTML string, then ships it. If a component deep in the tree awaits a slow database query, everything waits.

Streaming SSR works by breaking the response into chunks, using HTTP's chunked transfer encoding (or HTTP/2 streams). The server flushes HTML as soon as parts of the tree are ready. React 18's implementation uses Suspense boundaries as the unit of deferral — everything outside a `<Suspense>` boundary renders immediately; everything inside waits for its data, then streams the resolved HTML (plus a small inline `<script>` that tells the browser where to slot it in the DOM).

The key insight: the browser receives a `<template>` placeholder first, then the real content arrives later and is swapped in client-side via that script — all without a client-side data fetch or a second round-trip.

## Mental Model

Think of a restaurant that seats you and immediately brings bread while your entrée is being prepared, rather than making you wait outside until everything is plated. You're in your seat earlier, bread is on the table, and the main course arrives when it's ready — same total kitchen time, better perceived experience.

## Practical Scenarios

**Frontend engineer building a product page:** The header, nav, and above-the-fold content stream immediately. The reviews section, which hits a slow recommendations service, is wrapped in `<Suspense>` with a skeleton fallback. LCP improves because the hero image loads sooner — the browser received that HTML before reviews finished.

**Fullstack engineer building a dashboard:** You can prioritize critical data (user identity, permissions) to render first, stream it, and defer expensive aggregations (analytics charts, activity feeds). Each deferred section resolves independently — a slow analytics query doesn't block the permission-gated sidebar from rendering. This also means you can start hydration on already-streamed portions while the rest arrives, which is what React 18's selective hydration enables.

## What Changes in Practice

- Error boundaries matter more — a thrown error mid-stream, after headers are sent, can't change the HTTP status code. You need `<Suspense>` + error boundaries to handle component-level failures gracefully.
- CDN/edge caching gets more complex — streaming responses are harder to cache fully; you typically cache the outer shell and stream dynamic inner content.
- The waterfall problem shifts rather than disappears — you still need to think carefully about what data is fetched where, since a `<Suspense>` boundary only helps if the data fetch starts early enough.
