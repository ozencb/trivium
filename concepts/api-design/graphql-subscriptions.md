---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## GraphQL Subscriptions

GraphQL subscriptions let clients express long-lived interest in a named event stream, receiving server-pushed updates whenever that event fires — rather than polling or managing raw WebSocket frames themselves. The value over raw WebSockets is that you get type safety, schema-driven event contracts, and the same field-selection granularity you expect from queries.

### The Core Mechanism

Under the hood, subscriptions are a three-layer stack:

1. **Transport** — almost always WebSockets (the `graphql-ws` protocol is the current standard; `subscriptions-transport-ws` is its deprecated predecessor you'll still encounter)
2. **Resolver** — instead of returning a value, a subscription resolver returns an `AsyncIterator`. The execution engine pulls from that iterator and pushes each yielded value through the active subscription's selection set
3. **Pub/sub** — the resolver typically doesn't own the event source. It subscribes to a pub/sub channel (Redis, in-memory EventEmitter, Kafka, etc.) and yields values as they arrive

The schema definition looks like a query, but it's under the `Subscription` type:

```graphql
type Subscription {
  orderStatusUpdated(orderId: ID!): Order
}
```

The resolver then does two things: subscribe (return an AsyncIterator that wraps a pub/sub channel) and resolve (transform each published payload through the `Order` selection set). Many implementations split these into `subscribe` and `resolve` functions explicitly.

### Mental Model

Think of it like a database trigger wired to a message queue. When a mutation updates an order, it publishes to `order:${orderId}`. Any connected client subscribed to `orderStatusUpdated(orderId: "123")` is listening to that exact channel. The server fans the published event out through GraphQL's normal field resolution — so the client gets exactly the fields it asked for, not the full internal payload.

### Practical Scenarios

**Backend:** The tricky part is connection state at scale. Each WebSocket is a stateful, long-lived connection — horizontal scaling means you need a shared pub/sub backend (Redis is the default choice) so any server instance can receive an event and route it to the right client connections, which may be on a different instance. Connection management, auth token refresh mid-subscription, and backpressure on slow clients are where most production pain lives.

**Fullstack:** Apollo Client and urql both handle the WebSocket client and automatically merge subscription data into your cache. The common mistake is treating subscriptions as a replacement for queries — they're not. The pattern is: fetch initial state with a query, then layer a subscription on top to receive deltas. Subscriptions that re-deliver full entity state on every change are fine at low volume but become expensive fast.

### When to reach for it

Real-time collaborative features, live order/job status, push notifications that need field-level filtering, or anything where polling latency is unacceptable. Skip it when events are infrequent and a short polling interval is simpler to operate — subscriptions add meaningful infrastructure complexity.
