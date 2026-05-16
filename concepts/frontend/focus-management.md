---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Focus Management

Focus management is the practice of programmatically controlling which element holds keyboard focus, ensuring keyboard-only users can always orient themselves and interact with dynamic UI changes without getting lost.

### The Core Mechanism

Browsers maintain a single focused element at a time (accessible via `document.activeElement`). When content changes dynamically — a modal opens, a route changes, a drawer slides in — the DOM changes but focus doesn't move automatically. It stays wherever it was, often on an element that no longer exists or that's now obscured. The user is effectively teleported to a different page while their "cursor" is still somewhere in the void.

Focus management means you take ownership of where focus lands after state transitions, using `element.focus()` or by ensuring the right element has `autofocus` at the right moment.

### Mental Model

Think of it like managing scroll position. When a user clicks a link and lands on a new page, the browser scrolls to the top. You'd never leave them 1200px down from a previous page's position. Focus is the same thing — it needs to reset or move intentionally on state transitions, otherwise keyboard users are disoriented.

### Concrete Example

A modal dialog: when it opens, focus should move to the first interactive element inside it (or the modal container itself if descriptive). While the modal is open, focus should be **trapped** inside — Tab cycles through modal elements only, not the background content. When the modal closes, focus returns to the trigger that opened it.

```js
// On modal open
modalRef.current.querySelector('button, [href], input, [tabindex]').focus();

// On modal close
triggerRef.current.focus();
```

Without the return-to-trigger step, a screen reader user who closes the modal is stranded at the top of the page.

### Practical Scenarios

**Frontend (SPAs):** Route changes are the most common failure point. React Router and other routers don't manage focus — navigating from `/settings` to `/profile` leaves focus on the nav link. The fix is focusing the `<h1>` or a skip-target on route change, often via a "live region" announcement + focus on the page heading.

**Fullstack (server-rendered with JS enhancements):** Form submissions that partially update the page (HTMX, Turbo, custom fetch) leave focus on the submit button, which may now be disabled or re-rendered as a new DOM node (losing focus entirely). You need to explicitly refocus the button or the confirmation message after the swap.

**Portals and tooltips:** Content rendered outside the normal DOM tree (React portals) can break tab order expectations. Focus needs to be explicitly moved into the portal and back out.

The underlying rule: any time a user action causes a significant DOM change, ask "where does focus go now, and does that make sense to someone who can't see the page?"
