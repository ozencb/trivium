---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Edge Rendering

Edge rendering is SSR moved out of your origin datacenter and into the CDN nodes that are already close to your users — so the HTML generation happens ~20ms away instead of ~200ms away.

### The core mechanism

Traditional SSR has a fixed latency floor: your user in Tokyo makes a request, it travels to your US-East origin, the server renders HTML, and the response travels back. Even a fast server can't escape physics.

Edge rendering runs that same rendering logic on distributed compute nodes (Cloudflare Workers, Vercel Edge Functions, AWS Lambda@Edge, etc.) — the same infrastructure that's been serving static assets from CDN pops for years. The difference from a CDN cache is that this compute is *dynamic*: it can fetch data, personalize content, and stream HTML, not just return a cached file.

The constraint is the runtime. Edge environments are intentionally stripped-down — no Node.js APIs, limited memory, short execution windows. You get a V8 isolate (or WASM), fetch, and not much else. This forces you to think differently about what work happens at the edge vs. what stays at origin.

### Mental model

Think of it as a franchise model. Your origin is corporate HQ — it has everything but it's slow to reach. Edge nodes are franchise locations: limited menu, but one is always nearby. For most requests (read-heavy pages, personalized headers, A/B variants), the franchise location is plenty. For complex operations (heavy DB writes, third-party integrations with beefy SDKs), you still route to HQ.

### Practical scenarios

**Frontend:** Frameworks like Next.js and Remix let you annotate specific routes as edge-rendered. You'd move your marketing pages and product listing pages to the edge — they're read-heavy, benefit most from low latency, and their data requirements are simple enough for fetch-based edge code.

**Fullstack:** Personalization without the flash. Instead of shipping a generic page and hydrating user-specific content client-side (causing layout shift), you render the personalized HTML at the edge using a cookie or geo header. The user gets a tailored response with no visible loading state.

**DevOps:** Edge rendering shifts your scaling model. You're no longer capacity-planning a fleet of origin servers for peak traffic — the CDN provider scales that for you. But you gain a new ops concern: cold start behavior, edge-to-origin latency for data fetching, and observability across 200+ PoPs instead of 3 regions.

### The gotcha

Edge rendering doesn't eliminate your origin — it adds a layer in front of it. If your rendering logic needs data from a database that's only in us-east-1, you've moved the compute closer but the data is still far. The full benefit requires either globally distributed data (PlanetScale, Turso, D1) or aggressive caching at the edge layer.
