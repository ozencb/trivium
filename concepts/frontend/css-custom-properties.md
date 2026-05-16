---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## CSS Custom Properties

CSS custom properties (often called "CSS variables") are named values you define in CSS that cascade and inherit like any other CSS property — unlike preprocessor variables (Sass/Less), which are compiled away before the browser ever sees them.

**The core mechanism**

You declare a custom property with a double-dash prefix (`--my-value: ...`) and read it with `var()`. The key thing that distinguishes them from preprocessor variables: they exist in the computed style tree at runtime. The browser stores them, they participate in the cascade, and JavaScript can read and write them. They're live.

```css
:root {
  --brand-color: #3b82f6;
  --spacing-unit: 8px;
}

.button {
  background: var(--brand-color);
  padding: calc(var(--spacing-unit) * 2);
}
```

Inheritance is where it gets interesting. A custom property set on a parent element is available to all descendants — so you can scope behavior by redefining the property lower in the tree:

```css
.dark-theme {
  --brand-color: #60a5fa; /* override just for this subtree */
}
```

No selector specificity tricks needed. The right value flows down naturally.

**Mental model**

Think of custom properties as typed slots in the cascade. Each element has a computed value for every custom property it can see. When you change `--brand-color` on a parent, every child that uses `var(--brand-color)` re-renders with the new value — without touching those child selectors at all.

**Practical scenarios**

*Frontend:* Theming is the obvious win — define your design tokens as custom properties on `:root`, and switching themes becomes one class toggle or a few property overrides. Component libraries use scoped custom properties to expose a controlled API: consumers set `--card-border-radius` without needing to know or override internal selectors.

*Fullstack:* When your backend drives UI state (user preferences, feature flags, per-tenant branding), you can inject a `<style>` tag server-side with custom property overrides — or set them via `element.style.setProperty('--brand-hue', hue)` in JavaScript without touching a stylesheet. This is cleaner than class toggling when the variation is continuous (colors, sizes, durations) rather than boolean.

**Why this matters beyond convenience**

Because custom properties survive into the browser's style engine, they're the mechanism CSS Houdini builds on. Paint Worklets and Animation Worklets can register typed custom properties (`@property`) with syntax constraints and default values, enabling things like animating a color or interpolating a gradient — transitions the browser couldn't previously handle because it didn't know the type of the value.
