---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## CSS Container Queries

Media queries have always been a lie for component design. You write `.card { ... }` and make it responsive based on the viewport, but the card has no idea if it's in a narrow sidebar or a wide main column—it only knows the window size. Container queries fix this by letting you query the size of a parent element instead.

**The core mechanism:** You declare an element as a containment context with `container-type: inline-size` (or `size`). Child elements can then write `@container` rules that fire based on that container's dimensions—not the viewport's. The browser tracks the container's computed size and applies matching rules exactly like media queries, but scoped to that layout subtree.

```css
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card { flex-direction: row; }
}
```

Now drop that card in a 300px sidebar—it stacks vertically. Drop it in a 600px content area—it goes horizontal. Same component, zero viewport knowledge required.

**Mental model:** think of it as the component subscribing to its own bounding box rather than `window.innerWidth`. The container is the source of truth, not the global viewport.

**Where this matters in practice:**

*Frontend:* Design systems. Before container queries, truly reusable components were mostly fiction—you'd ship a "Card" component that only looked right in specific grid contexts, and the consuming team would fight the styles every time they placed it somewhere unexpected. Now you can build components that genuinely adapt to wherever they're dropped, which makes component libraries dramatically more composable.

*Fullstack:* Any server-rendered or CMS-driven layout where the template doesn't control where a component lands. A "featured post" block might appear full-width on an article page or squeezed into a widget column on a dashboard—container queries let the component handle both without the server needing to pass layout hints.

**Pitfalls:**
- `container-type: size` (both axes) requires the element to have a definite height, which is often not the case. Stick to `inline-size` unless you need height containment.
- You can't query a container from within itself—the queried element must be a *descendant* of the container, not the container itself.
- Nesting containers works but can get confusing fast. Name your containers explicitly with `container-name` once you have more than one level.

**When to reach for it:** anytime you're writing breakpoints on a component and thinking "but this only works if the grid is X columns." That thought is the signal. Also reach for it when building any component intended for reuse across different layout contexts.

Browser support is now solid across all modern browsers (shipped in all major engines since late 2022), so there's no practical adoption barrier for greenfield work.
