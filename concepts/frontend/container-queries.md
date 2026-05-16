---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

CSS Container Queries let elements respond to their *parent container's* size instead of the viewport — solving a fundamental mismatch between how components are designed and how they're actually used.

## The core problem with media queries

Media queries respond to the viewport: `@media (min-width: 768px)`. That works when you control layout globally, but it falls apart when a component gets placed in multiple contexts. A card in a full-width hero looks different than the same card in a narrow sidebar — and the viewport width tells you nothing useful about which situation you're in.

## How container queries work

You declare an element as a *containment context* with `container-type`, then write `@container` rules that target its descendants:

```css
.card-wrapper {
  container-type: inline-size; /* tracks width */
  container-name: card;
}

.card {
  flex-direction: column;
}

@container card (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}
```

The browser measures `.card-wrapper`'s rendered width, not the viewport. If the wrapper is 300px (e.g., in a tight sidebar), the card stacks vertically. If it's 600px (e.g., in a main content area), it goes horizontal. Same markup, same CSS file, no JavaScript.

The mental model: the component knows its *available space*, not the screen size.

`container-type: inline-size` is the most common variant — it tracks width only, which avoids layout circularity (an element's height often depends on its own content). You can also use `size` to track both dimensions, but that's rarer and has stricter containment requirements.

## Practical scenarios

**Frontend:** A design system card component should work correctly whether it's rendered in a 3-up grid, a 2-column layout, or a widget panel — without requiring the consumer to pass props or add modifier classes. Container queries make the component itself responsible for its layout, not the parent page.

**Fullstack:** Dashboard UIs where widgets are resizable or user-configurable are the canonical use case. When a chart widget gets expanded from a quarter-width slot to half-width, it should reflow its legend without any JS measuring. Container queries handle this declaratively. Similarly, CMS block editors that drop the same component into varying column widths benefit enormously.

## What to watch

- `container-type` establishes a new stacking context and formatting context, which can affect `z-index` and floats — usually a non-issue but worth knowing.
- You can't query a container from *within* that same container — only from its descendants. The element being the container and the element being styled must be different.
- Browser support is solid (Chrome 105+, Firefox 110+, Safari 16+), so there's no real adoption barrier at this point.

The shift in thinking is small but meaningful: move from "how big is the screen?" to "how much space do I have right now?"
