---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Idempotency Keys

Idempotency keys are client-generated tokens attached to mutating requests so that a server can detect and deduplicate retries — giving clients safe retry semantics without double-executing side effects.

### The Core Mechanism

You already know idempotency as a property of operations. Idempotency *keys* are how you retrofit that property onto operations that aren't naturally idempotent (like charging a credit card or creating an order).

The flow:

1. Client generates a unique key (UUID, typically) before sending the request
2. Client sends the request with `Idempotency-Key: <uuid>` in the header
3. Server checks its store: has this key been seen before?
   - **No** → execute, store the key alongside the response, return it
   - **Yes** → return the stored response without re-executing
4. Client can safely retry on network failure, timeout, or any ambiguous error — the server handles deduplication

The key insight: the *client* owns the key, so it can attach the same key to every retry attempt. The server never has to distinguish "first request" from "retry" at the business logic layer.

### Concrete Example

You're building a payment endpoint. User clicks "Pay $100." The request fires, the server charges the card, but the connection drops before the 200 reaches the client. Did it work? Unknown.

Without idempotency keys: retry = potential double charge.

With them: the client generated `idem-key: abc-123` before clicking. It retries with the same key. The server looks up `abc-123`, finds the completed charge, and returns the original response. No second charge.

### Backend Considerations

The deduplication store needs to be durable (usually a database or Redis with persistence). You need to decide:
- **TTL**: Stripe keeps keys for 24 hours. Too short breaks slow retries; too long burns storage.
- **Granularity**: keys are typically scoped per user/tenant to avoid cross-user collisions.
- **What to store**: the full response body, not just "seen." Clients expect the same response on retry.
- **Concurrent requests with the same key**: your store needs a lock or atomic check-and-set so two simultaneous retries don't both pass the "not seen" check.

### Fullstack Considerations

On the client side, key generation must happen *before* the request, not inside the retry loop — otherwise each retry gets a new key and deduplication breaks. This means the key lives in component/request state, not generated inline at the fetch call.

For form submissions specifically: generate the key when the form mounts or when the user first interacts, persist it, and clear it only after a confirmed success response.

This pattern is how Stripe, Braintree, and most payment APIs handle retry safety. It's also increasingly common in any API where double-execution is expensive — order creation, notifications, ledger entries.
