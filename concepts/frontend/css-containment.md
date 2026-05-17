---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## CSS Containment

The browser's rendering pipeline is global by default — a text change in a deeply nested component can trigger style recalculation, layout, and paint across the entire document. CSS Containment lets you draw a hard boundary around a subtree and promise the browser that changes inside won't affect anything outside (and vice versa), so it can skip the rest.

### Core Mechanism

The `contain` property accepts several values that each isolate a different phase of rendering:

- **`layout`** — nothing inside affects external layout, nothing external affects internal layout. The element also becomes a containing block for absolutely positioned descendants.
- **`paint`** — descendants don't render outside the element's border-box (implies `layout`). Effectively clips like `overflow: hidden`.
- **`size`** — the element's size is independent of its content. You must give it an explicit size or it collapses.
- **`style`** — CSS counters and quotes don't leak out.
- **`content`** — shorthand for `layout paint style`. Most useful value in practice.
- **`strict`** — `layout paint style size`. Maximum isolation, requires explicit sizing.

The key insight: with `contain: content`, the browser can treat that subtree as a render island. When something inside changes, it invalidates *only* that subtree's layout/paint budget — the rest of the document is skipped.

### Mental Model

Imagine a news feed with 200 cards. A like-count updates on card #47. Without containment, the browser conservatively checks whether that text change shifts any adjacent cards, which might shift their siblings, and so on up the tree. With `contain: content` on each card, the browser knows the card is a closed system — it recalculates only card #47's internals.

### Where You'd Actually Use This

**Frontend:** Widget-heavy UIs — comment feeds, dashboards with live metrics, chat interfaces. Any component that updates at high frequency benefits from `contain: content`. Also useful for third-party embeds where you want to prevent their layout thrashing from dirtying your page.

**Fullstack:** Server-rendered pages that hydrate piecemeal (islands architecture) are a natural fit. Each island getting `contain: content` aligns the rendering model with the logical isolation you already have at the component level.

The newer `content-visibility: auto` property is essentially containment with auto-skip for off-screen elements — it applies `contain: strict` implicitly and defers rendering entirely until the element enters the viewport. That's the higher-leverage version for long pages with many sections.

### Common Pitfalls

- `contain: layout` silently makes the element a new containing block — absolutely positioned children inside will position relative to it, which breaks assumptions if you didn't expect it.
- `contain: paint` clips overflow. Don't use it if you have tooltips or dropdowns that extend outside the container.
- `contain: size` requires an explicit size. Forgetting this collapses the element to zero.

Start with `contain: content` on leaf-level components that update independently. Measure with DevTools performance profiler — you're looking for reduced "Recalculate Style" and "Layout" entries in the flame graph.
