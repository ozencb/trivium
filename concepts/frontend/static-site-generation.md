---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Static Site Generation

SSG is the decision to do all rendering work at build time rather than request time — every page becomes a static HTML file that can be pushed to a CDN and served from an edge node closest to the user, with zero backend involvement per request. You're essentially trading deployment-time compute for near-zero runtime latency and infinite horizontal scale by default.

**The core mechanism**

At build time, your framework (Next.js, Astro, Nuxt, etc.) calls your data-fetching functions, renders every page to HTML, and writes the output to disk. From that point forward, serving the page is just a file read. There's no Node process, no database query, no cold start — the CDN edge handles it. The tradeoff: the HTML is a snapshot. It reflects the world as it was when `npm run build` last ran.

This is where SSG diverges from SSR in a meaningful way. SSR gives you request-time freshness because rendering happens on each request; SSG gives you request-time performance because rendering already happened. Understanding *which axis matters for a given page* is the actual design decision.

**A concrete mental model**

Think of a documentation site. The content changes maybe once a week. If you SSR every doc page, you're spinning up compute 100,000 times a day to produce the same HTML output every single time. With SSG, you produce it once at deploy time and serve it forever until the next deploy. The freshness cost is zero because docs don't change between deploys anyway.

Flip to a product inventory page with real-time stock levels — SSG would show stale prices or incorrect availability. Wrong tool.

**Where it plays out in practice**

For a *frontend engineer*, SSG means thinking about your data's "staleness tolerance." Marketing pages, blog posts, documentation, and pricing pages are natural SSG candidates — they're authored content with infrequent updates. Dynamic user dashboards or feeds are not.

For a *fullstack engineer*, the interesting tension is in hybrid apps. Most real products aren't purely static or purely dynamic. Next.js lets you SSG some routes and SSR others in the same app, and understanding the boundary — what can be pre-rendered vs. what requires per-request rendering — is where SSG knowledge becomes a design skill, not just a config choice.

**Why this matters in senior conversations**

The differentiated insight isn't "SSG is fast." It's knowing the *failure modes*: stale data on high-traffic deploys, long build times when you have 50,000 pages, and the operational model where a content update requires triggering a full rebuild and redeploy. That's what leads you to Incremental Static Regeneration — SSG's answer to "what if I want static performance but don't want to rebuild everything on every content change."
