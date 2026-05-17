---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## CSS Cascade Layers

CSS has always resolved style conflicts through specificity, source order, and `!important` — a system that breaks down the moment you're combining a reset, a component library, and your own utilities. Cascade layers give you an explicit priority stack declared upfront, so specificity only matters *within* a layer, not across them.

### Core mechanism

You declare layers at the top of your stylesheet in the order you want them applied (lowest to highest priority):

```css
@layer reset, base, components, utilities;

@layer reset {
  * { box-sizing: border-box; margin: 0; }
}

@layer components {
  .btn { padding: 0.5rem 1rem; background: blue; }
}

@layer utilities {
  .p-0 { padding: 0; }
}
```

Here `.p-0` beats `.btn`'s padding *regardless of specificity*, because `utilities` was declared after `components`. A utility with zero specificity wins over a component selector with high specificity. That's the inversion: **layer order beats specificity**.

Styles outside any `@layer` declaration sit above all layers automatically, which matters when mixing layered third-party code with unlayered legacy styles.

### Mental model

Think of layers as named buckets stacked in a tower. CSS normally resolves conflicts by measuring selector weight inside each bucket, then comparing across buckets by position. Without layers, all styles are in one implicit bucket, so specificity wars play out globally. Layers partition the tower so bucket position determines the winner before specificity even enters the picture.

### Practical scenarios

**Frontend (component libraries):** You import Tailwind or Bootstrap, which ships with high-specificity component styles. Historically you'd fight them with `!important` or artificially inflated selectors. With layers, wrap the library import in a low-priority layer:

```css
@layer reset, third-party, components, utilities;

@layer third-party {
  @import url("bootstrap.css");
}
```

Now any of your component styles — even low-specificity ones — override Bootstrap without a specificity fight.

**Fullstack (design systems):** When a team ships a shared design system as an npm package, consumers historically had to know the system's internal specificity to safely override it. With layers, the design system can document its layer name (`@layer ds.components`) and consumers simply declare their overrides in a higher-priority layer. No digging through selectors to craft a winning override.

### When to reach for it

Reach for layers when you're composing styles from multiple origins: a reset, a third-party library, local components, and utilities. If you're ever writing `!important` to beat a library or using `.parent .parent .element` to win a specificity battle, layers would eliminate the problem structurally rather than tactically.

Browser support is now universal (all major browsers since 2022). The one gotcha: unlayered styles always win over layered ones, so audit third-party imports to ensure they're wrapped in a layer before relying on this for overrides.
