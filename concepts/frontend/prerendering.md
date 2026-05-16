---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Prerendering

Prerendering is the process of generating HTML for a page at build time (or on-demand, before the request hits your app server) so the browser receives fully-formed markup instead of a blank shell. The "why" is simple: you get the SEO and performance benefits of server-rendered HTML without paying a per-request rendering cost.

### The core mechanism

SSG is actually a subset of prerendering — you already know it. The broader concept is: *at some point before the user's browser asks for a page, something generates the HTML for it.* That "something" can be:

- **Build-time** (classic SSG): Runs once during `npm run build`. Output is static files on a CDN.
- **On-demand / ISR (Incremental Static Regeneration)**: First request triggers a render; the result is cached and served to subsequent visitors until a revalidation threshold passes.
- **Request-time with edge caching**: The server renders on first miss, CDN caches the response. Looks like SSG from the browser's perspective.

The key distinction from runtime SSR: the HTML exists (or gets cached) independently of any individual user's request. The server isn't re-executing React/Vue/etc. per visitor.

### Mental model

Think of it like compiling vs. interpreting. SSR is interpreted — every request executes the render. Prerendering is compiled — you pay the rendering cost once (or rarely), then serve the artifact. The tradeoff is staleness vs. speed.

### Practical scenarios

**Frontend engineer building a marketing site or docs:**  
Every page is prerendered at build time. Content changes require a rebuild. For low-churn content this is ideal — a CDN serves static HTML globally, zero server cost, instant TTFB. Frameworks like Astro and Next.js (`output: 'export'`) do this natively.

**Fullstack engineer with semi-dynamic content (e.g., a product catalog):**  
Full rebuilds on every product update are impractical at scale. ISR solves this — Next.js `revalidate: 60` means the page is prerendered, served stale for up to 60 seconds, then regenerated in the background. Users always get fast HTML; staleness is bounded and acceptable.

**The nuance to watch for:**  
Prerendering isn't always the right tool for highly personalized pages (user dashboards, cart contents). Those either need client-side hydration to fetch user-specific data, or full SSR. Mixing strategies per-route — prerender the shell, hydrate the dynamic parts — is the standard pattern in mature Next.js/Nuxt apps.

The mental shift from SSG to prerendering-as-a-concept is recognizing that *when* HTML is generated is a dial, not a binary, and choosing the right point on that dial per route is a first-class architectural decision.
