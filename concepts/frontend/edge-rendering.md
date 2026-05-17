---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Edge Rendering

Edge rendering is SSR executed not on a centralized origin server but on nodes distributed globally — the same infrastructure that serves CDN assets, now running your rendering logic. The motivation is simple: even fast SSR is slow if the request travels 200ms to a datacenter before a byte is returned.

**The core mechanism**

Traditional SSR: user request → origin server (possibly far away) → renders HTML → response. CDN caching helps for static or cache-friendly content, but personalized responses (auth state, locale, A/B variants, cart data) can't be served from cache — they require an origin hit every time.

Edge rendering moves the render itself to the CDN node. Frameworks like Next.js (with Vercel Edge Runtime), Remix, and Cloudflare Workers let you mark routes as "edge" — they execute in V8 isolates (not Node.js) at the CDN PoP closest to the user. Request hits London PoP, renders there, returns in 20ms instead of 200ms.

**Mental model**

Think of it as turning every CDN node into a thin app server. The tradeoff is the runtime: no native modules, limited APIs, cold-start-sensitive (though isolates start faster than containers), and no filesystem access. You're writing code that runs in a browser-like environment, not a full server.

**Where this matters in practice**

*Frontend:* Per-user personalization — rendering different nav states, locale-specific content, or feature flags without a client-side flash. Edge middleware for auth redirects (Next.js `middleware.ts` running at the edge) is a common entry point.

*Fullstack:* The boundary question becomes interesting. Databases aren't globally distributed the way edge nodes are, so edge-rendered pages that hit a single Postgres instance in `us-east-1` gain latency on the render but lose it on the DB query. You need edge-compatible data layers — Cloudflare D1, PlanetScale's edge-compatible driver, or regional read replicas — to realize the full benefit.

*DevOps:* Cold start monitoring matters. Isolates are fast but not free, and bundle size directly impacts startup. Workers have strict CPU time limits (10–50ms on Cloudflare). You're debugging in a constrained environment without the observability tooling you'd have on a normal server.

**When to reach for it**

Reach for edge rendering when you need personalized SSR with latency SLAs you can't meet from a single origin, and your data access patterns can tolerate — or be adapted to — distributed edge constraints. Don't reach for it when your rendering is data-heavy with a single DB, when you rely on native Node.js modules, or when CDN caching already solves your TTFB problem.

The senior-engineer signal in interviews: knowing that edge rendering shifts the bottleneck from network latency to data locality, and being able to articulate when that tradeoff is worth it.
