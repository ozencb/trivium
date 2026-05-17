---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## ARIA Live Regions

The accessibility tree is a static snapshot of your DOM that assistive technologies navigate. The problem is that modern UIs are anything but static—you get toast notifications, form validation errors, loading states, chat messages. ARIA live regions are the mechanism that tells screen readers "watch this part of the tree and announce changes as they happen."

### The Core Mechanism

Three attributes do most of the work:

- **`aria-live="polite"`** — queues the announcement until the user finishes what they're doing (reading, typing). Use this for non-critical updates.
- **`aria-live="assertive"`** — interrupts immediately. Use sparingly; it's disruptive.
- **`role="status"` / `role="alert"`** — semantic shortcuts. `status` implies polite, `alert` implies assertive.

The browser monitors the live region's subtree. When text content changes inside it, the accessibility API fires a notification. Screen readers pick that up and either queue or immediately speak the new content.

**Critical pitfall:** the element must exist in the DOM *before* content is injected into it. If you create the container and inject text simultaneously (e.g., `innerHTML = '<div role="alert">Error!</div>'`), many screen readers won't announce it. The region needs to be "registered" first, even if empty.

### Concrete Example

```html
<!-- Mount this empty on page load -->
<div role="status" aria-live="polite" aria-atomic="true" class="sr-only"></div>
```

```js
// Later, on form submission success:
statusRegion.textContent = "Profile saved successfully.";
```

`aria-atomic="true"` tells the reader to announce the entire region's content as one unit rather than just the changed node—useful when you're replacing a complete message.

### Practical Scenarios

**Frontend (React/Vue/etc.):** Form validation is the canonical case. Inline error messages that appear below fields need live regions, otherwise a screen reader user submitting a form has no idea validation failed unless they manually navigate back through the inputs. A single `role="alert"` container at the top of the form that gets populated with a summary works well.

**Fullstack / data-heavy UIs:** Dashboard widgets that poll for updates, real-time collaboration indicators ("Sarah is editing this document"), background job status ("Export ready—download now")—all of these require live regions. Without them, sighted users see the update immediately; screen reader users never know it happened.

### When to Reach For It

Any time you'd visually flash, badge, toast, or otherwise draw attention to a change that happened outside the user's current focus. If you'd animate it to catch the eye, you probably need a live region to catch the ear.

The `role="log"` variant is worth knowing too—it's for append-only streams like chat or activity feeds, where the reader announces new entries as they arrive without re-reading the whole list.
