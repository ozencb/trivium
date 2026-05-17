---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**Broadcast Channel API** gives you a named message bus shared across all same-origin browsing contexts — tabs, iframes, workers — without polling, localStorage hacks, or a WebSocket. It's the browser's built-in solution to the "how do I sync state across tabs?" problem.

## The core mechanism

You create a channel by name; any context on the same origin that opens a channel with the same name joins the same bus. Post a message on one end, every other subscriber fires an `onmessage` event. That's it — no server round-trip, no shared memory, just structured-clone-serialized messages over the browser's internal IPC.

```js
// In tab A (or a worker)
const ch = new BroadcastChannel('cart');
ch.postMessage({ type: 'item_added', id: 42 });

// In tab B
const ch = new BroadcastChannel('cart');
ch.onmessage = (e) => console.log(e.data); // { type: 'item_added', id: 42 }
```

One subtlety worth knowing: the sender does **not** receive its own message. If you want loopback, you need to handle that explicitly.

## Mental model

Think of it like a named pub/sub topic scoped to the browser session. Unlike `localStorage` + `storage` events (the classic hack), messages aren't persisted and aren't subject to string serialization — you send real objects. Unlike `SharedArrayBuffer`, there's no shared memory concern; messages are copied, not referenced.

## When to reach for it

**Tab/worker coordination:** A service worker invalidates a cache and needs to tell all open tabs to refetch. Auth logout — one tab logs out, others need to redirect immediately. Shopping cart updates that should reflect across all open windows without a server round-trip.

**Fullstack context:** If you're running a BFF or SSR app (Next.js, Remix), you'd still use this on the client side for cross-tab sync. It pairs well with optimistic UI — tab A commits a mutation, broadcasts a `{ type: 'invalidate', key: 'orders' }` so tab B's query cache knows to refetch.

**With workers:** Since Web Workers and Service Workers can join the same channel, it's a clean coordination layer between your main thread and background workers without the one-to-one constraint of `postMessage`.

## Pitfalls

- **No persistence:** messages are fire-and-forget; a tab that opens *after* a broadcast missed it. If you need late-joiners to catch up, you still need shared state (IndexedDB, localStorage, server).
- **Same-origin only:** cross-origin iframes can't participate. Not a workaround for iframe communication.
- **No acknowledgment:** it's broadcast, not request/response. If you need confirmation a message was received, layer that yourself.
- **Channel name collisions:** treat channel names like event namespaces — prefix them (`myapp:cart`) to avoid conflicts with third-party scripts.

Reach for this when you want lightweight cross-context sync and the "missed message on late join" tradeoff is acceptable. For anything requiring durability or cross-origin scope, you need a different tool.
