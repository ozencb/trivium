---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Keyboard Navigation

Keyboard navigation is the ability to interact with a web application using only a keyboard — no mouse, no touch. It exists because a significant portion of users either can't use a pointing device (motor disabilities, power users, vim devotees) or rely on assistive technology like screen readers that operate through the keyboard.

### The Core Mechanism

Browsers give you tab order for free: interactive elements (`<a>`, `<button>`, `<input>`, etc.) are focusable by default, and Tab/Shift+Tab cycles through them in DOM order. But "it works with Tab" is not the same as "it's navigable." The real job is managing focus state deliberately.

Every interactive region needs three things:

1. **Focusability** — the element must be in the tab order (native elements are; `<div>` and `<span>` are not unless you add `tabindex`)
2. **Visibility** — the focused element must have a visible focus ring (`:focus-visible` is your friend; `outline: none` is the enemy)
3. **Operability** — the element must respond to keyboard events, not just click. A `<div>` with an `onClick` handler does nothing when you press Enter or Space

### Mental Model

Think of keyboard navigation as two separate systems layered on top of each other:

- **Tab navigation**: moves between interactive regions (form fields, links, buttons)
- **Arrow navigation**: moves within a region (radio groups, menu items, tabs, listboxes)

This distinction — borrowed from the ARIA Authoring Practices Guide — is called the "roving tabindex" pattern. A tab panel component should have `tabindex="0"` on the active tab and `tabindex="-1"` on inactive ones, then use arrow keys internally to switch between tabs. This keeps the overall tab sequence manageable rather than forcing users to Tab through every tab to reach the content below.

### Practical Scenarios

**Frontend**: You build a custom dropdown using `<div>` elements for performance reasons. Without extra work, it's completely inaccessible. You need: `role="combobox"` and `role="option"`, `tabindex="0"` on the trigger, arrow key handlers to move between options, Enter to select, Escape to close, and focus management to return focus to the trigger on close.

**Fullstack**: You render a modal server-side and inject it into the DOM. When it opens, focus must programmatically move into it (`dialog.focus()` or the first focusable child). When it closes, focus must return to the trigger element. If you don't do this, a keyboard user loses their place in the page entirely — after dismissing the modal, focus drops back to the top of the document.

The common failure mode isn't ignorance of the feature — it's treating keyboard support as an afterthought and discovering that custom components built from `<div>`s require explicit effort to make usable.
