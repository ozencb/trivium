---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Critical Rendering Path (CRP)** is the ordered sequence of steps the browser must complete before it can paint anything on screen. Optimizing it is the most direct lever you have over perceived page load performance.

## The mechanism

The browser follows this sequence: parse HTML → build DOM → parse CSS → build CSSOM → merge into render tree → layout → paint. The word "critical" refers to *blocking*: resources that halt progress through this chain delay the first paint, regardless of how fast the rest of the page loads.

Two rules govern what blocks what:

1. **CSS is render-blocking.** The browser won't paint until it has a complete CSSOM. This is because JS can read computed styles, so executing JS before CSSOM is complete could produce wrong results.
2. **Synchronous scripts are parser-blocking.** When the HTML parser hits a `<script>` without `async`/`defer`, it stops building the DOM, waits for the script to download and execute, then resumes. This compounds with rule 1 — a script encountered mid-parse also waits for any in-flight CSS to finish first.

The result: even a fast server response can produce a blank screen for several hundred milliseconds while the browser resolves this dependency chain.

## Mental model

Think of a waterfall chart. Each render-blocking resource is a horizontal bar that pushes first paint to the right. A 150kb stylesheet + a synchronous analytics script means zero pixels until both are fully resolved — even if the visible portion of the page only needs 8kb of CSS.

## Practical scenarios

**Frontend:** This is why code-splitting matters. A monolithic 800kb React bundle is synchronous — the browser blocks paint until it downloads and executes. Splitting routes means the initial load only blocks on the minimum JS needed for that page. Similarly, inlining above-the-fold CSS directly in `<head>` and loading the full stylesheet asynchronously removes it from the critical path entirely. `async` scripts skip parser-blocking; `defer` additionally guarantees execution after DOM is parsed — both shrink the CRP.

**Fullstack:** SSR shortens the CRP because content arrives in HTML instead of waiting for JS hydration. More aggressively, React 18's streaming SSR + Suspense lets the browser start parsing and painting the first HTML chunk while the server is still generating the rest, so you're not trading one blocking resource for another. On the infrastructure side, HTTP/2 server push lets you speculatively send CSS/JS before the browser has even parsed enough HTML to request them.

## Why this unlocks Resource Hints

Resource hints (`preload`, `preconnect`, `prefetch`) only make sense once you've mapped your critical path. `preload` tells the browser to fetch a critical resource early — before the parser would normally discover it. Without understanding *which* resources are on the critical path, you'd just be guessing at what to hint.
