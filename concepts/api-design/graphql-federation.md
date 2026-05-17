---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## GraphQL Federation

GraphQL Federation solves the organizational problem that emerges when multiple teams share a single GraphQL schema: who owns what, how do you deploy independently, and how do you avoid the schema becoming a coordination bottleneck? Federation lets each team own and deploy a subgraph—a valid GraphQL service with its own schema—while a gateway stitches them into one unified API that clients query normally.

**The core mechanism**

Each subgraph declares which types it owns and which it extends. The key primitive is the `@key` directive, which marks an entity's primary key so other subgraphs can reference and extend it. When the gateway receives a query, it builds a query plan: it figures out which subgraphs own which fields, fires parallel requests, and merges results. Clients see one schema, one endpoint—they're unaware of the decomposition.

The critical insight is *entity references*. Say the `users` subgraph owns `User`. The `orders` subgraph needs `User.email` to send notifications—but it doesn't own that field. With federation, `orders` declares a stub: "I know a `User` exists with this `id`; I'll resolve the rest by calling back to `users`." The gateway handles that round-trip automatically.

**Concrete example**

You have three teams: identity, catalog, orders. Each deploys independently:

- `identity` subgraph: owns `User { id, email, name }`
- `catalog` subgraph: owns `Product { id, title, price }`
- `orders` subgraph: owns `Order { id, items }`, extends `User` with `orders: [Order]`, extends `Product` with `inventory: Int`

A frontend query like `{ me { name orders { items { product { title price inventory } } } } }` fans out across all three subgraphs via the gateway query plan—one request from the client's perspective.

**Where this matters in practice**

For **backend engineers**, federation is primarily a deployment and ownership story. The hard problems are: entity key design (bad keys create N+1 query plans), subgraph versioning without breaking the composed schema, and handling partial failures gracefully at the gateway. Schema composition validation—catching conflicts before deploy—is where you spend real time.

For **fullstack engineers**, federation is largely transparent, but understanding it helps you diagnose performance issues. A suspiciously slow query is often a query plan that's serializing subgraph calls instead of parallelizing them, usually because of poorly structured resolver dependencies.

**When to reach for it**

Federation earns its complexity at scale: multiple teams, independently deployable services, a need for a unified client-facing API. For a small team or a single service, it's overkill—plain schema stitching or a monolithic schema is easier to reason about. The classic mistake is adopting federation early "for future scale" and paying the operational overhead before you need it.

In interviews and design discussions, knowing federation signals you understand the *organizational* constraints on API design, not just the technical ones.
