---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**HATEOAS** (Hypermedia As The Engine Of Application State) is a REST constraint where the server drives client navigation by including relevant action links in every response — the client never needs to hardcode URLs or know the API's URL structure in advance.

## The Core Idea

In most APIs, the client is pre-programmed with knowledge: "to get a user's orders, call `/users/{id}/orders`." This couples the client to the API's URL structure. HATEOAS flips this: the server tells the client what's possible *right now*, contextually.

A response doesn't just return data — it returns data *plus* the actions currently available on that resource. The client follows links rather than constructing them.

## Concrete Example

You fetch an order:

```json
GET /orders/42

{
  "id": 42,
  "status": "pending",
  "total": 89.99,
  "_links": {
    "self": { "href": "/orders/42" },
    "cancel": { "href": "/orders/42/cancel", "method": "DELETE" },
    "pay": { "href": "/orders/42/payment", "method": "POST" }
  }
}
```

After payment:

```json
{
  "id": 42,
  "status": "paid",
  "_links": {
    "self": { "href": "/orders/42" },
    "track": { "href": "/shipments/789" }
  }
}
```

The `cancel` and `pay` links are gone. The server is communicating state transitions through link presence/absence — the client doesn't need conditional logic like `if order.status === 'pending', show cancel button`. The server already encoded that.

## Practical Implications

**Backend:** You're responsible for generating correct, context-sensitive links on every response. This is non-trivial — links depend on business rules, permissions, and current state. Libraries like Spring HATEOAS or HAL builders help, but you're adding significant serialization complexity. The payoff: URL changes don't break clients, and your API becomes self-documenting at runtime.

**Fullstack:** HATEOAS shifts business logic about "what can a user do now" from client to server. Instead of the frontend knowing "admins can delete, pending orders can be cancelled," it just renders whatever links exist in the response. This makes the frontend thinner and the server the authoritative source of truth for user capabilities. It also simplifies permission changes — update server-side link generation, client adapts automatically.

## The Real-World Gap

Full HATEOAS is rare in practice. Most teams call their API "RESTful" while coupling clients tightly to URL patterns — which technically violates this constraint. The pragmatic middle ground is embedding *key* action links (like `next`/`prev` for pagination, or state-transition endpoints) without going all-in on hypermedia. That's enough to decouple the most volatile parts of the URL space without the overhead of full hypermedia modeling.
