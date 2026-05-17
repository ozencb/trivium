---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## HATEOAS

Most REST APIs in production aren't actually REST — they're HTTP APIs with JSON. HATEOAS is the constraint that separates them, and understanding it means understanding what Roy Fielding was actually arguing for when he defined REST.

**The core idea:** the server, not the client, is the authority on what transitions are valid in the current application state. Instead of clients knowing "to cancel an order, POST to `/orders/{id}/cancel`", the server embeds that link *only when cancellation is a valid transition* — and the client follows it. The client starts from a single well-known entry point and discovers the entire API surface at runtime.

**Mechanism:** each response carries hypermedia controls — typically `rel`/`href` pairs — representing available next actions:

```json
{
  "id": 123,
  "status": "awaiting_payment",
  "_links": {
    "self":   { "href": "/orders/123" },
    "pay":    { "href": "/orders/123/payment" },
    "cancel": { "href": "/orders/123" }
  }
}
```

Once paid, the response for the same order drops `pay` and `cancel`, adds `track`. The client doesn't branch on status strings — it branches on link presence. The server models the state machine; the client just follows edges.

**Why this matters mechanically:** coupling a client to URL structure means the server can never restructure its resource hierarchy without coordinating client releases. With HATEOAS, clients only hardcode one URL — the root — and everything else is negotiated. This is the same model as the web: browsers don't know Amazon's URL structure, they follow links from `amazon.com`.

**For backend engineers:** this shifts responsibility. You're not just serializing state — you're computing valid transitions per request, factoring in authorization, resource state, and business rules. A user without cancel permission gets a response without the `cancel` link. The server's authorization model becomes intrinsic to the response shape, not a separate layer clients have to re-implement. This makes API versioning significantly less painful: restructure your URLs without coordinating across clients.

**For fullstack engineers:** HATEOAS gives you a clean contract for conditional UI. Rather than the frontend asking "is the user allowed to cancel?" via a separate permissions check, it asks "does this response have a `cancel` link?" The server is the single source of truth for what actions exist. This collapses a whole class of permission-sync bugs.

**The honest tradeoff:** almost no production APIs implement this fully because it requires more work on both sides — servers need to compute transition availability, clients need link-following logic instead of hardcoded paths. The benefit (evolvability, decoupling) pays off at scale and long lifespans. For internal APIs with tightly coupled clients, it's usually overkill.

Where this comes up in interviews: when someone asks how you'd design an API to survive breaking changes, or how you'd model state transitions without leaking business logic to clients. Most engineers answer with versioning strategies. The sharper answer starts with "who owns the state machine."
