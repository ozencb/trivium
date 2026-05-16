---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## CSS Cascade Layers

CSS Cascade Layers (`@layer`) give you explicit control over the order in which style rules win conflicts — independent of specificity. Before layers, the only tools you had for resolving conflicts were specificity and source order, both of which scale poorly as codebases grow.

### The Core Mechanism

The cascade has always had a priority stack: origin (browser/user/author), then importance (`!important`), then specificity, then source order. Layers insert a new tier *between* origin and specificity. Rules in a higher-priority layer beat rules in lower-priority layers **regardless of selector specificity**.

You declare layers and their order explicitly:

```css
@layer base, components, utilities;

@layer base {
  .button { color: gray; padding: 8px 16px; }
}

@layer components {
  .button { color: blue; }  /* wins over base, even with same specificity */
}

@layer utilities {
  .text-red { color: red; }  /* wins over both */
}
```

The declaration `@layer base, components, utilities;` establishes priority — last declared wins. Anything *outside* any layer beats everything in a layer (unlayered styles sit above all layers).

### Mental Model

Think of it like z-index, but for style precedence. You define a stack of named layers, and everything in a higher layer wins. Within a layer, normal specificity rules still apply. But a `.button` in `utilities` beats `#sidebar .nav .button` in `base`, because layer order dominates specificity.

### Why This Matters in Practice

**The real problem layers solve:** third-party CSS. If you import a component library, its highly-specific selectors can fight your own styles in unpredictable ways. With layers, you put the third-party code in a low-priority layer:

```css
@layer third-party, app;

@import "some-ui-lib.css" layer(third-party);

@layer app {
  /* your styles always win, no specificity wars */
}
```

**For frontend engineers:** design system work becomes much cleaner. Base tokens go in a `base` layer, component styles in `components`, one-off overrides in `utilities`. You stop reaching for `!important` or artificially inflating specificity.

**For fullstack engineers:** if you're generating or injecting CSS dynamically (SSR, CSS-in-JS, scoped styles), layers give you a reliable hook to control where injected styles land in the priority stack — so runtime-injected styles don't accidentally override layout-critical rules.

### Caveats

- Browser support is broad (all modern browsers since 2022), but worth verifying for any legacy targets.
- Unlayered styles beat layered ones — easy to forget when mixing legacy CSS with layered code.
- `!important` reverses layer order within its own cascade context, which is counterintuitive.

The feature is essentially an escape hatch from specificity hell that scales — something CSS had needed for a long time.
