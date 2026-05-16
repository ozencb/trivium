---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Accessibility Tree

The browser exposes a parallel, simplified representation of your page — the accessibility tree — to assistive technologies like screen readers and voice control software. It's the contract between your markup and anything that isn't a visual renderer.

### Core mechanism

You already know the browser builds a DOM tree, then a render tree (which drops `display: none` nodes), then paints. The accessibility tree is another parallel structure built alongside the render tree. Each node carries:

- **Role** — what the element *is* (button, heading, link, checkbox)
- **Name** — what it's *called* (computed from label, `aria-label`, `aria-labelledby`, or text content, in priority order)
- **State** — checked, expanded, disabled, focused
- **Properties** — live region settings, relationships to other nodes

The browser exposes this tree to the OS via platform accessibility APIs (MSAA/UIA on Windows, NSAccessibility on macOS, AT-SPI on Linux). Screen readers never read the DOM directly — they query the OS API, which queries the browser.

### Mental model

Think of it as your public API surface. The DOM is implementation detail; the accessibility tree is what assistive tech actually consumes. You can have beautifully semantic HTML and a broken accessibility tree (e.g., `aria-hidden` on the wrong node), or ugly divs-everywhere markup with a correct tree (via ARIA overrides). What ships to users is the tree.

### Where it bites you in practice

**Frontend:** The three visibility knobs have different effects on the tree:
- `display: none` — removed from render tree *and* accessibility tree
- `visibility: hidden` — removed from render tree, *stays* in accessibility tree (screen reader can still find it)
- `aria-hidden="true"` — stays in render tree, removed from accessibility tree

This matters when building modals, tooltips, or offscreen content. A visually-hidden skip link should *not* have `visibility: hidden`.

**Dynamic content:** When JS updates the DOM, the accessibility tree updates too — but screen readers are stateful. They're mid-document when your content changes. Without signaling the change (via ARIA live regions), they'll never know new content appeared. Understanding the tree is what makes live regions make sense: you're not decorating DOM nodes, you're telling the browser which subtrees to watch and how loudly to announce updates.

**Fullstack/SSR:** Server-rendered HTML produces an accessibility tree immediately, before JS hydrates. This is a genuine a11y win — screen readers don't wait for your bundle. It's also why hydration mismatches hurt: a mismatch can corrupt the tree state mid-navigation.

The accessibility tree is what makes "semantic HTML matters" actually true rather than cargo-cult advice — the semantics are how the tree gets its roles and names for free.
