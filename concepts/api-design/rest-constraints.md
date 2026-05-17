---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

REST (Representational State Transfer) is not a protocol but an architectural style defined by six constraints—violating them is why so many "REST APIs" are actually just HTTP-wrapped RPC that breaks caching, couples clients to servers, and resists evolution.

**The six constraints and what they actually enforce:**

1. **Client-Server** — separates UI concerns from data/logic. The server doesn't know how data is displayed; the client doesn't know how it's stored. This is mostly obvious today, but it's the foundation everything else builds on.

2. **Stateless** — every request must carry all context needed to process it. No session state on the server between requests. This is where most APIs quietly cheat: storing "current user state" server-side, requiring requests in a specific order, or building workflows that assume prior calls succeeded. Violating this kills horizontal scalability because any server instance must be able to handle any request independently.

3. **Cache** — responses must declare their cacheability. `Cache-Control`, ETags, `Last-Modified` exist to fulfill this constraint. When you return opaque JSON with no cache headers, you're forcing every client to re-fetch data that hasn't changed and making CDN caching impossible.

4. **Uniform Interface** — the hardest constraint, made of four sub-constraints: resource identification via URIs, manipulation through representations, self-descriptive messages, and HATEOAS (hypermedia as the engine of application state). HATEOAS is what most APIs skip entirely—it means responses include links to valid next actions, so clients don't hardcode URL patterns.

5. **Layered System** — clients can't tell if they're talking to a load balancer, CDN, or origin server. This enables caching proxies, API gateways, and service meshes to sit transparently between client and server.

6. **Code on Demand** (optional) — servers can send executable code (JavaScript, applets). Rarely used in practice, but it's why it's technically "optional."

**Mental model:** Think of REST like a vending machine. Each button press (request) is self-contained—the machine doesn't remember your last selection. The display shows what's available right now (hypermedia). The machine works whether you're standing in front of it or calling through a proxy.

**Where this bites backend engineers:** When you build `/api/v1/checkout/step2` that only works after `/step1`, you've broken statelessness. Now your load balancer needs sticky sessions, your API is impossible to cache, and clients are coupled to your internal workflow.

**Where this bites fullstack engineers:** Hardcoding URL patterns (`/users/{id}/posts`) in frontend code violates uniform interface—if the server restructures resources, every client breaks. HATEOAS solves this by having the server tell clients what URLs to use, but most teams skip it for pragmatic reasons and pay the cost during API versioning.

The reason these constraints matter together: each one is a forcing function for a quality (scalability, evolvability, cacheability) that's easy to ignore until your API has hundreds of consumers and you need to change something.
