---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Broadcast Channel API

The Broadcast Channel API is a simple pub/sub mechanism for communicating between browsing contexts — tabs, windows, iframes, and workers — that share the same origin. It fills the gap where `postMessage` requires a direct reference to the target, but you just want to shout something to whoever's listening.

### Core mechanism

You create a channel by name, and any context on the same origin that opens a channel with the same name is automatically part of the group. Post a message on one end, every other subscriber receives it. The sender does *not* receive its own message.

```js
// Tab A
const channel = new BroadcastChannel('app-state');
channel.postMessage({ type: 'USER_LOGGED_OUT' });

// Tab B (same origin, independently opened)
const channel = new BroadcastChannel('app-state');
channel.onmessage = (event) => {
  if (event.data.type === 'USER_LOGGED_OUT') {
    clearLocalSession();
    redirectToLogin();
  }
};
```

That's the whole API surface. No setup beyond the channel name. Messages are structured-cloned, so you can send objects, arrays, blobs — anything the structured clone algorithm supports.

### Mental model

Think of it as a named topic on an in-browser event bus. Any context that subscribes to the topic gets the messages. It's ephemeral — no persistence, no replay — just live delivery to whoever is currently listening. If no one is listening when you post, the message is dropped silently.

### Where this matters in practice

**Frontend:** The canonical use case is tab synchronization. If a user logs out in one tab, you want every other tab to respond — redirect, clear sensitive UI, drop cached data. Without Broadcast Channel, you'd hack this with `localStorage` events (which fire on write from *other* tabs, a quirky side effect rather than a real API). Broadcast Channel is the intentional tool for this.

Another pattern: coordinating a service worker with the page. A service worker can post cache invalidation signals or background sync results to all open tabs without needing to track client references.

**Fullstack:** In SSR or hybrid apps (Next.js, Remix), the server can't help you here — this is purely client-side. But it becomes relevant when you have multi-tab state that the server doesn't own, like optimistic UI state, draft content, or in-memory feature flag overrides. If the user edits a draft in one tab, you can broadcast a "draft updated" signal so other tabs don't show stale state before a server round-trip.

### Caveats worth knowing

- Same-origin only. Cross-origin tabs are completely isolated.
- No message history. Join after a message was sent and you missed it.
- Close channels explicitly (`channel.close()`) to avoid memory leaks, especially in SPAs where the channel outlives the component that created it.

It's a small API with a narrow job, but for tab coordination it's the right tool — cleaner than `localStorage` hacks and more straightforward than SharedWorker for simple broadcast scenarios.
