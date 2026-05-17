---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Backend for Frontend (BFF)

A BFF is a thin server-side layer owned by a frontend team that aggregates downstream microservice calls and returns exactly the data shape the client needs — no more, no less. The core problem it solves: microservices are designed around domains, not UI screens, so clients end up making 6 calls to assemble one page, or receiving bloated payloads and trimming them client-side.

**The mechanism**

Instead of clients calling services directly, each client type (mobile app, web SPA, smart TV) gets its own BFF. That BFF knows the contract its client expects and handles all the orchestration: call the user service, call the inventory service, join the results, strip irrelevant fields, and return one response. The client becomes dumb — it just renders what it receives.

This is different from an API Gateway. A gateway handles cross-cutting infrastructure: auth, rate limiting, routing. A BFF handles *product logic*: what data a specific client needs for a specific workflow.

**Concrete example**

A product page on mobile needs: item name, one image (thumbnail), price, stock boolean. The web version needs: full image gallery, rich description, seller profile, related items, review histogram. If you have one shared API, you either over-fetch on mobile or under-fetch on web. With BFFs, each team ships an endpoint that returns exactly what their UI needs, and the BFF absorbs the complexity of aggregating 4 microservice calls behind it.

**Practical angles**

*Backend:* You control latency. Fan-out requests in parallel inside the BFF, cache aggressively at the BFF layer, and your client sees one fast response. You also own versioning — deprecating a field is a conversation between the BFF and the client team, not a cross-org negotiation.

*Frontend:* Your data arrives pre-shaped for your components. No more mapping layers, no more `if (data?.nested?.field?.maybe)` chains. The API contract becomes a first-class product artifact your team owns.

*Fullstack:* You're often writing both sides. BFF makes the seam explicit — you define the interface once and implement it in a server component or edge function, keeping client bundles thin.

**Where it beats GraphQL**

GraphQL solves the same over/under-fetching problem but delegates query composition to the client. BFF inverts that: the server defines what the client gets. BFF wins when clients are mobile (binary protocols, controlled environments) or when you need aggressive server-side caching. GraphQL wins when you have many teams with unpredictable query patterns.

**The pitfall**

BFFs attract scope creep. Business logic that belongs in domain services migrates into the BFF because it's convenient. Guard against this — the BFF should aggregate and transform, not compute. A BFF that does pricing calculations is a problem waiting to happen.

In design discussions, knowing when *not* to reach for BFF matters as much as knowing the pattern: if you have one client type and your services are already well-shaped, a BFF adds latency and a deployment for no gain.
