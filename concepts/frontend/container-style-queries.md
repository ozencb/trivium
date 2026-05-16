---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## CSS Container Style Queries

Style queries let you conditionally apply CSS based on a **custom property value on an ancestor container**, not its size. Where regular container queries ask "how wide is this container?", style queries ask "what is this container's `--variant` set to?"

### The Core Mechanism

Any element can act as a style query container — you don't need `container-type: inline-size`. A `container-name` is optional but useful for targeting. The query matches against computed values of CSS custom properties:

```css
.card {
  container-name: card;
  --density: normal;
}

@container card style(--density: compact) {
  .card__body {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
}
```

The key insight: custom properties already cascade through the DOM normally, so any descendant can react to a variable set anywhere up the tree — without JavaScript passing data down.

### Mental Model

Think of it as **CSS prop drilling**. In React you'd pass `variant="compact"` through several layers. With style queries, a parent sets `--card-density: compact` and every nested element can independently branch on that value. The CSS variable is the prop; the `@container style(...)` block is the conditional render.

### Practical Scenarios

**Component libraries / design systems:** A `<Button>` component ships with internal style logic for `--button-variant: ghost | filled | outline`. The consumer just sets the variable; the component handles the rest — no extra class names, no JavaScript.

**Theming without JS:** Set `--color-scheme: dark` on `:root` (or a subtree), then write theme-specific rules with style queries. You get scoped theming that respects CSS cascade without toggling classes from JavaScript.

**Fullstack / SSR apps:** When rendering server-side, passing visual state through HTML attributes or classes requires coordination between your template and your CSS. Style queries let the CSS own that logic entirely — the server just sets a custom property inline, CSS does the branching.

**Density / layout modes:** A dashboard where users can toggle "compact" vs "comfortable" view. One variable at the page root, all components respond autonomously.

### Where It Differs from Regular Container Queries

Size queries require `container-type` (which creates containment, which has layout implications). Style queries have no such cost — they're purely about variable inspection. This makes them cheaper to adopt and broader in applicability: you can query style on elements that aren't sized containers at all.

**Browser support caveat:** Chrome and Safari shipped this; Firefox support arrived later. Worth a caniuse check before using in production without a fallback strategy.
