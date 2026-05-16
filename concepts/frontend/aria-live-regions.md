---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## ARIA Live Regions

The browser's accessibility tree is static by default — screen readers only announce content when focus moves to it. ARIA live regions solve the problem of dynamic content: they tell assistive technologies to watch a DOM subtree and announce changes without requiring the user to navigate there.

### The core mechanism

You mark a container with `aria-live`, and the browser's accessibility API sets up a mutation observer-like watch on that subtree. When content changes, the AT interrupts (or queues, depending on the setting) to read the new text aloud.

The key attribute values:

- `aria-live="polite"` — waits for the user to finish their current task, then announces
- `aria-live="assertive"` — interrupts immediately (use sparingly; it's disruptive)
- `role="status"` and `role="alert"` are shorthand for `polite` and `assertive` respectively, with some additional implied semantics

Two supporting attributes matter:

- `aria-atomic="true"` — reads the entire region's content on any change, not just the changed node. Critical when partial reads would be confusing ("3 results" vs "Showing 1–3 of 3 results for 'keyboard'")
- `aria-relevant` — controls *what kind* of mutations trigger announcements (additions, removals, text). Default is `additions text`, which covers most cases

### Mental model

Think of a live region as a dedicated broadcast channel. You're not pushing focus there — you're saying "whenever this zone updates, pipe the content to the accessibility audio stream." The DOM change triggers the announcement, not user navigation.

### Practical scenarios

**Frontend (React/Vue/etc.):** Toast notifications, form validation errors that appear inline, autocomplete suggestion counts ("5 suggestions available"), loading state changes ("Results loaded"). A common mistake: injecting elements into an unannounced container, then adding `aria-live` afterward. The live region must exist in the DOM *before* content is injected — the browser registers the watch on parse, not on mutation.

**Fullstack:** Any server-streamed or polling-updated UI — think chat messages, real-time dashboards, async job status ("Your export is ready"). If you're rendering partial HTML updates (HTMX, Turbo Streams, or similar), make sure the live region wrapper is part of the base layout, not the fragment being swapped in. Otherwise the AT never registers the watch.

### What goes wrong in practice

Overusing `assertive` is the most common issue — it creates a terrible UX for screen reader users, analogous to `alert()` spam for sighted users. Most UI feedback should be `polite`. The second issue is announcing too much: injecting entire re-rendered components into a live region when only one field changed. Keep live regions tightly scoped or use `aria-atomic` deliberately.
