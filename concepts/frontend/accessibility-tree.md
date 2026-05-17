---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Accessibility Tree

The browser builds two parallel representations of your page: the visual DOM you're used to, and an **accessibility tree**—a pruned, semantically annotated structure that assistive technologies (screen readers, voice control, switch access) actually consume. If the DOM is what the renderer sees, the accessibility tree is what a screen reader sees, and they diverge more than you'd expect.

### The mechanism

After layout, the browser's accessibility engine walks the DOM and computes an accessibility tree where each node exposes four things: **role** (what kind of thing is this?), **name** (what is it called?), **state** (is it checked? expanded? disabled?), and **relationships** (what does it control? what describes it?). Not every DOM node makes it in—`display: none`, `visibility: hidden`, and `aria-hidden="true"` prune nodes entirely. `<span>`, `<div>`, and other generic containers with no semantic weight get no meaningful role unless you add one.

The key insight: the accessibility tree is computed from both the DOM *and* ARIA attributes, and ARIA wins when they conflict. `<button>` already has `role="button"` in the tree. A `<div role="button">` claims the same role—but without the keyboard behavior, focus management, or implicit semantics the real element carries. The tree makes it *look* like a button to the screen reader, but the experience still breaks.

### Mental model

Think of it like an API contract. Your DOM is the implementation; the accessibility tree is the interface exposed to AT clients. A screen reader doesn't render pixels—it calls into this API to answer "what's here, what's it called, can I interact with it?" If your interface is wrong or missing properties, the client breaks even if the implementation looks fine visually.

### Practical scenarios

**Frontend:** A custom dropdown built from `<div>` elements looks fine visually. But in the accessibility tree it's just a sequence of generic containers—no `listbox` role, no `option` children, no `aria-expanded` state. A screen reader user hears nothing useful. Fix: add `role="combobox"`, `role="listbox"`, `role="option"`, wire `aria-expanded`, and manage focus. Chrome DevTools has an Accessibility panel that shows the computed tree—use it to audit this directly rather than guessing.

**Fullstack:** Server-rendered HTML is where you have the most leverage. Semantic HTML (`<nav>`, `<main>`, `<button>`, `<label for="...">`) produces a well-formed accessibility tree with zero extra work. The mistakes that are expensive to fix—missing form labels, icon-only buttons with no accessible name, modals that don't trap focus—are usually introduced when server-rendered semantic structure gets replaced by client-side component abstractions that strip the semantics.

Understanding the accessibility tree is what makes ARIA make sense: every ARIA attribute is a direct patch to properties in this tree. Without the mental model, ARIA looks like magic attributes; with it, you're just setting properties on a structured object.
