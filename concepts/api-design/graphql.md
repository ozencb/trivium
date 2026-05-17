---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

GraphQL shifts the power dynamic: instead of the server deciding what each endpoint returns, the client declares exactly what it needs. This matters because REST's endpoint-per-resource model breaks down at scale — you end up with either over-fetching (getting fields you don't need) or endpoint proliferation (creating `/users/summary`, `/users/full`, `/users/with-posts` variants).

**The core mechanism**

GraphQL exposes a single endpoint backed by a typed schema. The schema is a contract: every type, every field, every relationship between them is explicitly declared. When a client sends a query, the server's resolver system walks the query tree, calling a resolver function per field. Resolvers are just functions — they can fetch from a database, call another service, or compute a value. The runtime stitches the results together and returns exactly the shape the client requested.

```graphql
query {
  user(id: "42") {
    name
    posts(last: 3) {
      title
      publishedAt
    }
  }
}
```

That query fetches a user and their last 3 posts in a single round-trip. A REST equivalent would either require two requests or a custom endpoint.

**Where it actually matters in practice**

*Backend:* The schema becomes your API surface area. You stop designing endpoints and start designing a type graph. The tricky part is the N+1 problem — naively, fetching 10 users with their posts fires 11 queries. DataLoader (or equivalents) batches these. Not knowing about N+1 in a GraphQL interview or design review is a red flag.

*Frontend:* Components co-locate their data requirements in fragment definitions. When a component's data needs change, you update the fragment — not a shared endpoint. This is what makes GraphQL genuinely ergonomic for large frontend teams, and it's the pattern that unlocks BFF architectures.

*Fullstack:* Schema-first development means the contract is established before implementation. Frontend and backend can work in parallel against a mocked schema. Tooling like codegen generates TypeScript types directly from the schema, making the type safety end-to-end.

**When not to reach for it**

GraphQL adds complexity — schema design, resolver wiring, a more sophisticated caching story (no HTTP caching by default since everything is POST). For simple CRUD with few clients, REST is cheaper to operate. GraphQL earns its cost when you have multiple clients (web, mobile, partners) with divergent data needs, or when you want to expose a composable API that third parties can query flexibly.

The senior engineering signal: understanding that GraphQL is a **client-driven** model vs. REST's **server-driven** model, and knowing which tradeoffs that introduces for caching, security (query depth limits, cost analysis), and schema evolution.
