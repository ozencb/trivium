---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

REST isn't just "JSON over HTTP" — it's a set of six architectural constraints that, when followed, give you a system with predictable scaling properties and decoupled components. Most APIs call themselves REST but only partially satisfy the constraints, which is why understanding them matters for reasoning about tradeoffs.

## The Six Constraints

**Client-Server separation**: The UI and data storage concerns are decoupled. The server doesn't care how data is rendered; the client doesn't care how data is stored. This lets you evolve them independently — swap your frontend framework without touching your API contract.

**Statelessness**: Each request must contain all information needed to process it. The server holds no session state between requests. Authentication tokens, pagination cursors, filters — all of it travels in the request itself. This is what makes horizontal scaling trivial: any server instance can handle any request.

**Cacheability**: Responses must declare whether they're cacheable. When done right, clients and intermediaries (CDNs, proxies) can serve cached responses without hitting your origin. The `Cache-Control` and `ETag` headers are the implementation surface.

**Uniform Interface**: The most substantive constraint, with four sub-properties. Resources are identified by URIs. Resources are manipulated through representations (you GET a JSON document, not the database row itself). Messages are self-descriptive (Content-Type, status codes carry meaning). And HATEOAS — responses include hypermedia links to valid next actions (this is the constraint most APIs skip entirely).

**Layered System**: The client doesn't know if it's talking to the origin server, a load balancer, or a caching proxy. This enables you to introduce infrastructure layers without changing the client contract.

**Code on Demand** (optional): Servers can send executable code to clients — think JavaScript or WebAssembly. Rarely used deliberately, but technically REST allows it.

## Mental Model

Think of REST like the web itself. A browser doesn't maintain a session with a web server — it sends self-contained HTTP requests. Pages link to other pages (HATEOAS in practice). CDNs cache static assets. You can put Cloudflare in front of anything. REST codifies why the web scales.

## Practical Implications

**Backend**: Statelessness is the constraint with the most operational impact. It means you can't use server-side sessions — you're forced into JWTs or opaque tokens validated on each request. This feels like overhead until you need to run six instances behind a load balancer, at which point it's what saves you.

**Fullstack**: Cacheability and uniform interface affect how you design your API contract. If your endpoints return resources rather than operation results (GET `/orders/123` vs POST `/getOrder`), you can attach `ETag` headers and let browsers avoid redundant fetches. This is the difference between a network tab full of 200s and one full of 304s.

The constraints aren't rules for their own sake — they're design decisions that unlock specific scaling and evolvability properties. Knowing which ones you're violating (and why) is more useful than claiming REST compliance.
