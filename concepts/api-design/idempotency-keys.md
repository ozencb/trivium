---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Idempotency Keys

Idempotency keys solve the retry problem for non-idempotent operations: when a POST request times out, you don't know if the server processed it or not, so you can't safely retry without risk of double-charging or double-booking. A client-generated key lets the server say "I've seen this exact request before — here's the result I already computed."

**The mechanism**

The client generates a unique key (typically a UUID v4) before making the request and sends it in a header like `Idempotency-Key: <uuid>`. The server stores a mapping of `(key, endpoint) → response` in a durable store — usually Redis or Postgres — before processing the operation. On a duplicate request with the same key, it returns the stored response immediately without re-executing the logic. The key is scoped to an endpoint or resource type to prevent collisions across different operations.

The critical detail: you store the result *after* processing completes, not before. This means two truly simultaneous duplicates might both execute. Most implementations handle this with a lock per key — acquire before processing, release after storing the result. Any concurrent duplicate that can't acquire the lock waits and then gets the stored result.

**Concrete example**

You're building a payment endpoint. The client sends:

```
POST /charges
Idempotency-Key: 7f4c1b2a-9e8d-4f3a-b1c2-d3e4f5a6b7c8
Body: { amount: 5000, customer_id: "cus_abc" }
```

Network drops after the server charges the card but before the response arrives. Client retries with the same key. Server looks up the key, finds the charge already succeeded, returns the original `200` with the charge object. No double charge.

**Practical patterns**

*Backend:* Key expiration matters. Stripe keeps keys for 24 hours; after that, the same key is treated as a new request. Choose TTL based on your retry window. Also: if a request fails with a `500`, do you store that? Generally no — only store completed (success or client-error) results, since server errors should be retryable.

*Fullstack:* Generate the key on the client at the moment the user initiates the action (button click), not on retry. This way every distinct user intent gets a unique key, and retries from network errors share the same one. Don't regenerate the key on retry — that defeats the purpose. Store it in memory or session state for the lifetime of that operation.

**When to use it**

Any time you have a POST/PATCH that creates or mutates state and your clients will retry on failure — which they should on network errors. Payment processing is the canonical case, but the same applies to order creation, subscription changes, or any operation where "run it twice" causes real damage. If you're designing a public API where clients are responsible for retry logic, offering idempotency key support is table stakes.
