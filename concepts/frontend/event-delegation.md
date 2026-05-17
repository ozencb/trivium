---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Event Delegation

Instead of attaching listeners to each element individually, you attach one listener to a shared ancestor and use `event.target` to determine what was actually clicked. This works because DOM events bubble: a click on a `<button>` fires on that button, then its parent, then its parent's parent, all the way to `document`.

**The core mechanism**

When a user clicks an element, the browser creates an event object and dispatches it downward through the DOM (capture phase), then back up (bubble phase). By the time it reaches your parent listener, `event.target` still points to the original element that was clicked — the deepest one. Your handler can inspect that target and decide whether to act.

```js
document.querySelector('#list').addEventListener('click', (e) => {
  const item = e.target.closest('[data-id]');
  if (!item) return;
  handleItemClick(item.dataset.id);
});
```

`closest()` is the practical companion here — it walks up from `event.target` to find the semantic element you care about, which handles the case where the user clicks a `<span>` inside your `<li>` rather than the `<li>` itself.

**Why it matters beyond "fewer listeners"**

The real win isn't just memory. It's that the listener is structure-agnostic: dynamically added children are automatically covered. If you're rendering a list that changes — search results, a virtual list, items added via WebSocket — you never wire up individual handlers. The parent listener exists once and handles the whole surface area, present and future.

**Frontend patterns**

This is how virtually every table, list, menu, or tree component in production works. React's synthetic event system implements delegation at the root level (`document` or the root container) — your `onClick` props aren't real DOM listeners per element. Understanding this explains why `e.stopPropagation()` can silently break other components listening higher up.

**Fullstack / SSR contexts**

In server-rendered HTML where you're progressively enhancing (htmx, Turbo, vanilla JS), delegation is essentially mandatory. You don't control when fragments land in the DOM, so per-element setup logic is fragile. A top-level delegated listener handles dynamically injected content without any lifecycle hookup.

**The main pitfall**

`stopPropagation()` kills delegation. If something in the subtree calls it, your parent listener never fires. This is the source of subtle bugs when integrating third-party components — they stop propagation for their own reasons, and your delegated handler silently stops working. Prefer `stopImmediatePropagation` only when necessary and be suspicious when delegation mysteriously breaks.
