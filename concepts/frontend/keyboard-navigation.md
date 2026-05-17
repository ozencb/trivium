---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Keyboard Navigation

Keyboard navigation is the practice of ensuring every interactive UI element is reachable and operable without a mouse. It matters both for accessibility (motor disabilities, screen reader users) and power users who prefer keyboards — and it's one of the most commonly broken things in modern SPAs.

### The Core Mechanism

The browser gives you a traversal model for free: `Tab` moves focus forward through focusable elements (`a`, `button`, `input`, `select`, `textarea`, and anything with `tabindex`), `Shift+Tab` reverses it. But "focusable" and "operable" are different things. A `<div>` with an `onClick` is reachable via mouse but invisible to Tab traversal — this is the most common mistake.

The deeper model is the **roving tabindex** pattern for composite widgets. A widget like a menu, tab panel, or data grid shouldn't put every item in the Tab sequence — that would mean pressing Tab 50 times to escape a dropdown. Instead, the container gets `tabindex="0"`, internal items get `tabindex="-1"` (programmatically focusable, not Tab-reachable), and arrow keys move focus internally. Tab exits the whole widget. This is how native `<select>` works, and it's what you implement manually for custom equivalents.

### Concrete Mental Model

Think of the keyboard interface as a **two-level navigation system**: Tab moves between regions/widgets, arrow keys navigate within them. A toolbar with 8 buttons should be one Tab stop — you arrow through the buttons, Tab to the next landmark. Users have strong expectations here from years of using native OS controls.

### Frontend Implications

The main pitfalls in React/Vue/Angular work:

- Using `div` or `span` for interactive elements instead of `button` or `a` — you lose Tab, Enter, Space, and screen reader semantics in one move
- Dynamic content (modals, dialogs, dropdowns) not managing focus: when a modal opens, focus should move into it; when it closes, focus should return to the trigger
- Custom components (date pickers, comboboxes, autocompletes) skipping the roving tabindex pattern entirely

Libraries like Radix UI and Headless UI get this right. Understanding why they work the way they do separates engineers who use them from engineers who can extend or debug them.

### Fullstack Implications

Server-rendered apps (Next.js, Rails, traditional MPA) have an underappreciated advantage: native HTML elements handle most of this for free. Where it breaks is SPA-style client routing — navigating to a new "page" without a real browser navigation means focus stays wherever it was, usually a nav link buried in the header, and screen reader users get no announcement that the page changed. You need to explicitly manage focus on route transitions.

### Why It Differentiates Senior Engineers

In design reviews, being the person who asks "how does this custom dropdown behave with a keyboard?" signals systems thinking. Most accessibility bugs in production aren't missing alt text — they're focus traps, unreachable interactive elements, and widgets that hijack arrow keys globally. Knowing the keyboard interaction model at this level means you catch those in design, not after an audit.
