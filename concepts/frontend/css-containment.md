---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## CSS Containment

CSS Containment lets you tell the browser that a subtree of the DOM is independent from the rest of the page, so the browser can skip that subtree when recalculating layout, paint, or style for unrelated changes.

### The core mechanism

The browser's rendering pipeline is expensive because it's often global. Change a font-size deep in the DOM and the browser potentially needs to recalculate layout for the entire document — it doesn't know whether your change affects elements elsewhere. The `contain` property is an explicit contract: "this element's internals don't affect anything outside it." The browser can then scope its invalidation work to that subtree.

There are four containment types:

- **`layout`** — the element's internal layout doesn't affect external elements. Floats, scroll anchors, and margin collapse are all contained.
- **`paint`** — the element's children won't paint outside its bounds. The browser can skip painting this subtree if it's off-screen.
- **`size`** — the element's size doesn't depend on its children. The browser can skip measuring descendants when computing this element's dimensions.
- **`style`** — CSS counters and quotes won't escape the subtree. (Rarely used in isolation.)

`contain: content` is shorthand for `layout + paint`, and `contain: strict` means `layout + paint + size`.

### Mental model

Think of it like a bulkhead on a ship. Changes inside one compartment don't flood the rest of the ship. The browser can treat each contained element as if it's rendering in isolation.

### Practical scenarios

**Frontend — widget-heavy dashboards.** If you have a page with 50 card components, changing state inside one card would normally trigger layout recalculations across the whole document. Adding `contain: content` to each card tells the browser those cards are islands — recalc stays local. This is particularly valuable in React or Vue apps where state updates are frequent and fine-grained.

**Frontend — infinite scroll / virtual lists.** List items off-screen with `contain: strict` can be completely skipped during paint, since the browser knows their size is fixed and they won't paint outside their bounds. This makes the runtime cost of off-screen DOM nodes much lower.

**Fullstack — server-rendered pages with dynamic islands.** When you hydrate a single interactive widget on an otherwise static page, `contain: content` around those islands means client-side state changes don't force a full-page layout recalc. This matters when you're mixing SSR content with client-rendered components.

### Caveat

Containment has side effects because it establishes a new formatting context — `layout` containment creates a new BFC, `paint` creates a new stacking context. This can break assumptions about z-index stacking or margin collapse if you apply it carelessly to existing layouts.

The `content-visibility: auto` property (which implicitly applies `contain: layout style paint`) is the higher-level API most people use today — it automatically skips rendering off-screen elements entirely.
