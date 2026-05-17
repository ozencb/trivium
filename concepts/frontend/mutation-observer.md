---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Mutation Observer API

`MutationObserver` lets you watch a DOM node for structural changes—child additions/removals, attribute mutations, text content edits—and react asynchronously after the browser has finished its current work. It replaced the old `MutationEvent` system, which fired synchronously mid-layout and could cause cascading reflows that tanked performance.

### The core mechanism

You create an observer, hand it a callback and a target node, and declare *what* you want to watch via a config object. The browser queues mutations and delivers them to your callback as a batch of `MutationRecord` objects in a microtask—after the current JS task completes but before the next frame. This batching is the key: you're not paying per-mutation, you're paying once per flush.

```js
const observer = new MutationObserver((records) => {
  for (const record of records) {
    console.log(record.type, record.target, record.addedNodes);
  }
});

observer.observe(document.body, {
  childList: true,   // watch for node additions/removals
  subtree: true,     // recurse into descendants
  attributes: true,  // watch attribute changes
  characterData: false,
});
```

Call `observer.disconnect()` when done—observers hold a reference to the target, so skipping this leaks memory.

### The mental model

Think of it like `addEventListener` but for DOM structure rather than user events. The browser is the emitter; you're subscribing to a structural event stream that gets debounced into microtask batches.

### When you actually reach for this

**Frontend:**  
- Third-party script injecting nodes you need to respond to (ads, chat widgets, analytics iframes)
- Watching for when a library renders something into a container you don't control
- Implementing "lazy enhancement"—waiting for a component to appear before attaching behavior (common in micro-frontend setups)
- Custom `data-*` attribute-driven behavior without a framework

**Fullstack:**  
- Server-rendered HTML hydration: detecting when the server-injected markup is in the DOM before client JS initializes
- CMS or headless setups where content blocks are injected dynamically and you need to wire up interactivity after injection

### The pitfalls

`subtree: true` on `document.body` is cheap when mutations are rare, expensive when something is thrashing the DOM (animations, virtualized lists). Your callback fires once per batch, but a batch can contain thousands of records—iterate defensively.

Also: MutationObserver doesn't fire for CSS changes or computed style shifts. It only sees structural/attribute mutations. If you're trying to detect layout changes, you want `ResizeObserver` instead.

One subtle trap: if your callback *causes* mutations to the observed node, you can create infinite loops. Disconnect before mutating, or use a flag to guard re-entrant calls.
