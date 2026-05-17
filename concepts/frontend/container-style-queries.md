---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## CSS Container Style Queries

Style queries extend container queries beyond layout: instead of querying a container's *size*, you query its *computed custom property values* and apply styles conditionally. The core use case is components that adapt their visual variant based on inherited token values—without needing modifier classes or prop drilling.

### The mechanism

You register a container, then write a `@container style()` rule that checks a custom property on that container:

```css
.card-wrapper {
  container-name: card-context;
  --theme: default;
}

@container card-context style(--theme: dark) {
  .card {
    background: #1a1a1a;
    color: #fff;
  }
}

@container card-context style(--theme: brand) {
  .card {
    background: var(--brand-primary);
  }
}
```

The query fires when the container's *computed* value matches—not just what's declared inline. This means values can be set anywhere up the cascade (a parent, a media query, JS toggling a class), and the component responds automatically.

What makes this different from just using a custom property directly (`color: var(--card-color)`) is **conditionality on structure**, not just value substitution. You can rewrite entire rule sets, change display modes, or alter multiple properties in concert based on a single token value.

### Why it matters over modifier classes

The classic pattern is: parent adds `.is-dark` or `data-theme="dark"`, child component has `.card.is-dark { ... }`. This couples the component's CSS to ancestor DOM structure. Style queries invert that—the component queries *context* rather than relying on the parent to annotate itself correctly. Components become genuinely portable: drop them anywhere a container exposes the right custom property and they just work.

### Practical scenarios

**Frontend:** Design systems are the primary win. A `<Button>` component inside a `--surface: inverted` container renders inverted automatically, with no extra class, no JS, no prop. This collapses a whole class of "variant proliferation" problems where you end up with `btn--dark`, `btn--inverted`, `btn--on-image`, etc.

**Fullstack:** Server-rendered components (Next.js, Rails partials) can't easily receive runtime props for visual context. If the layout shell sets `--density: compact` via a user preference stored in a cookie, every nested component responds without touching the component template—pure CSS coordination.

### The senior engineer angle

Most engineers know custom properties exist; fewer understand that style queries make custom properties *queryable structural signals*, not just value slots. In design system architecture discussions, this unlocks a cleaner model: tokens define context, components subscribe to context, no imperative glue required. In interviews, demonstrating this distinction—"we don't need modifier classes if we design the token contract correctly"—signals you think about component API design at the CSS layer, not just JS.

**Current caveat:** browser support is good in Chrome/Edge/Safari 18+, but Firefox support landed late 2024. Worth checking your matrix before adopting it as a primary pattern.
