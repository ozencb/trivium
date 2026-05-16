---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Static Site Generation

SSG pre-renders pages to static HTML **at build time**, before any request arrives. The key difference from SSR: work happens once during deployment, not per-request.

### The core mechanism

In SSR you already know, a Node process handles each request: fetches data, renders HTML, sends it. SSG moves that entire pipeline to build time. A framework like Next.js or Astro runs your data-fetching and rendering code during `next build`, writes the output to `.html` files, and at runtime a CDN serves those files directly — no server process involved.

This means your "server" code runs exactly once per deployment, not once per user. The tradeoff is freshness: the data in the HTML is as stale as your last build.

### Mental model

Think of it as memoization at deployment scale. SSR is like computing a value on every function call. SSG is like computing it once and caching the result permanently — until you invalidate the cache (redeploy).

```
Build time:  getStaticProps() → render() → posts/my-article.html
Request:     CDN serves posts/my-article.html directly
```

No Lambda invocation, no database hit, no server spin-up. Just a file read from an edge node near the user.

### Practical scenarios

**Frontend:** Marketing sites, documentation, blogs — anywhere content changes infrequently. A docs site with 300 pages can be fully pre-rendered. Each page loads instantly, caching is trivial, and you get inherent resilience (no origin to go down). The cost is that a content update requires a redeploy, which is fine if your CI pipeline is fast.

**Fullstack:** SSG shines for data that's shared across users and expensive to compute — product catalogs, pricing pages, CMS-driven content. You'd SSG the product listing page (same for everyone, changes rarely) but SSR or client-fetch the cart/checkout (user-specific, must be real-time). Most real apps mix both: SSG for the cacheable parts, SSR or API routes for the dynamic parts.

### Why this matters beyond performance

SSG shifts when your backend is stressed. A traffic spike on an SSR app means a spike in DB queries and compute. On an SSG app, the CDN absorbs it — your origin never sees the traffic. That's not just a speed optimization; it's a fundamentally different operational profile.

This is the foundation for **Incremental Static Regeneration** (ISR), which solves SSG's freshness problem by adding time-based or on-demand revalidation — essentially giving you SSG's CDN performance with a configurable staleness window instead of "stale until next deploy."
