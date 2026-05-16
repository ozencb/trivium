---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Event Delegation

Instead of attaching an event listener to every child element, you attach one listener to a parent and let the DOM's natural event bubbling do the routing. It's both a performance optimization and a correctness fix for dynamic content.

### The Core Mechanism

When a DOM event fires, it doesn't just notify the target element — it bubbles up through every ancestor in the tree. A click on a `<button>` inside a `<li>` inside a `<ul>` will trigger click handlers on all three, then `<body>`, then `document`. Event delegation exploits this: put one listener high up, check `event.target` to see what was actually clicked, act accordingly.

```js
// Without delegation — 1000 listeners for 1000 items
items.forEach(item => item.addEventListener('click', handleClick));

// With delegation — 1 listener for everything
list.addEventListener('click', (e) => {
  const item = e.target.closest('.item');
  if (item) handleClick(item);
});
```

The `closest()` call is key — `event.target` is the deepest element clicked, which might be a `<span>` inside your `<li>`, not the `<li>` itself. `closest()` walks up until it finds a matching ancestor.

### Why It Matters

**Memory and initialization cost.** 500 list items means 500 listeners, each holding a closure, each registered in the browser's event system. With delegation, that's one. For large tables, virtual lists, or anything dynamically rendered, this compounds quickly.

**Dynamic content.** This is where delegation is often *necessary*, not just efficient. If you add a new list item after initial render, it has no listener — you'd have to manually attach one. A delegated listener on the parent works for all current *and future* children automatically.

### Practical Scenarios

**Frontend:** Any list, table, or feed where items are added/removed at runtime — comments, search results, drag-and-drop sortables. React's synthetic event system actually uses delegation internally (attaching listeners at the root), which is partly why React event handling is cheap even with thousands of elements.

**Fullstack (server-rendered pages):** Classic server-rendered HTML where JS progressively enhances markup. You can't guarantee elements exist at script execution time, and re-querying + re-attaching on each fetch is fragile. One delegated listener on a stable container element handles everything cleanly.

### The One Gotcha

`event.stopPropagation()` breaks delegation. If a child handler stops bubbling, the parent listener never fires. This becomes a subtle bug when third-party components or nested interactive elements stop propagation — your delegated handler silently stops working for those targets. Worth knowing before you spend 20 minutes debugging it.
