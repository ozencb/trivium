---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## CSS Custom Properties

CSS custom properties are variables you define in CSS itself — not a preprocessor — that participate in the cascade and inheritance tree just like `color` or `font-size`. The key distinction from Sass/Less variables: they're resolved at **runtime in the browser**, which means they can change without a recompile, respond to JS, and scope differently per element.

### The core mechanism

You define them with a double-dash prefix and read them with `var()`:

```css
:root {
  --brand-color: #3b82f6;
  --spacing-unit: 8px;
}

.button {
  background: var(--brand-color);
  padding: var(--spacing-unit);
}
```

What makes this more than syntax sugar: custom properties **inherit down the DOM tree**. If you redefine `--brand-color` on a `.card` element, everything inside that card picks up the new value automatically. This is scoped theming — no class-toggling cascades needed.

```css
.card--danger {
  --brand-color: #ef4444;  /* overrides for this subtree only */
}
```

`var()` also accepts a fallback: `var(--spacing-unit, 8px)` — useful when properties may not be set.

### Runtime mutability

Because resolution happens in the browser, JS can change them directly:

```js
document.documentElement.style.setProperty('--brand-color', '#10b981');
```

That single line re-renders everything reading `--brand-color` instantly. No stylesheet swaps, no class toggling, no full re-render triggered by JS framework reconciliation. This is why dark mode is often implemented here: swap a handful of root-level variables, done.

### Where this actually matters

**Frontend:** Component libraries use custom properties to expose a "theming API" — the component owns its internal structure but exposes `--button-bg`, `--button-radius` etc. for consumers to override. This is a cleaner contract than deep CSS selectors or prop-drilling style objects.

**Fullstack:** When you're server-rendering and want user-specific theming (e.g., a user picks a brand color), inject a `<style>` tag in the HTML response setting root-level custom properties. The page renders with the right theme on first paint — no flash, no client-side JS required for the initial state.

### Common pitfalls

- **They don't work in media query conditions** — you can't do `@media (min-width: var(--breakpoint))`. Custom properties resolve to values, not tokens the parser understands structurally.
- **Inheritance bites you unexpectedly** — if you set `--color` high in the tree expecting isolation, child components inherit it. Scope intentionally.
- **Unset vs. invalid** — if a custom property resolves to an invalid value for the property using it (e.g., `color: var(--my-number)` where `--my-number: 42`), the property goes to its inherited or initial value silently. Debugging this is annoying.

Understanding custom properties is a direct prerequisite for CSS Houdini, which lets you register typed custom properties with default values and animatability constraints — but that's the next layer.
