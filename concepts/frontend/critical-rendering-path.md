---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Critical Rendering Path

The browser can't show pixels until it knows what to show (DOM) and how to style it (CSSOM) — the Critical Rendering Path is the mandatory sequence between bytes arriving and the first frame appearing. Every millisecond spent on this sequence is a millisecond the user sees nothing.

**The mechanism, and why CSSOM is the bottleneck**

HTML parsing is incremental — the browser builds the DOM as bytes stream in. CSS is not. The browser must download and parse *all* CSS before it can construct the CSSOM, because the cascade is order-dependent: a rule at line 8,000 of your stylesheet can override one at line 3. The browser has no way to partially apply CSS and then "fix it up" later without causing a visible flash or re-layout. So `<link rel="stylesheet">` in `<head>` is a full stop: nothing renders until that file is fetched and parsed.

JavaScript compounds this. Sync `<script>` tags block HTML parsing entirely (JS can call `document.write`). But crucially, CSS also blocks JS execution — if the browser hasn't finished building the CSSOM and it hits a `<script>`, it waits, because the script might query `getComputedStyle()`. The practical chain: CSS delays JS, JS delays DOM parsing, both delay rendering.

After DOM + CSSOM exist, the browser builds the render tree (DOM nodes that are actually visible, with their computed styles), runs layout (calculating geometry — this is expensive), and paints.

**Mental model**

CSSOM is like a spreadsheet where cells can reference any other cell. You can't display partial results because one formula at the bottom might invalidate everything above it. You need the full evaluation before any output is meaningful.

**Frontend**

The classic trap: a monolithic CSS bundle linked in `<head>` delays FCP even if 90% of it applies only to routes the user hasn't visited. The fix is inlining critical (above-the-fold) CSS directly in the `<head>` as a `<style>` block, then loading the rest with `<link rel="stylesheet" media="print" onload="this.media='all'">` to defer it off the critical path. This is what tools like `critters` or `penthouse` automate.

**Fullstack**

SSR gets HTML to the browser faster, but it doesn't eliminate CRP concerns. If your SSR template injects `<link rel="stylesheet" href="/bundle.css">` in `<head>`, the browser still blocks on that file before rendering. SSR's benefit is reducing the time-to-first-byte; the CRP still runs in full after that. This is why SSR + streaming (sending HTML in chunks) + critical CSS inlining stack together — each targets a different part of the pipeline.

Understanding this is the prerequisite for resource hints (`preload`, `preconnect`) making sense: they're mechanisms for pulling render-blocking resources earlier in the timeline, before the parser even reaches the tag that requests them.
