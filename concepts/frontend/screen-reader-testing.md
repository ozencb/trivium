---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Screen Reader Testing

Automated accessibility tools catch rule violations — missing `alt` attributes, insufficient color contrast, unlabeled buttons. What they can't catch is whether a screen reader user can actually accomplish a task. Screen reader testing is manual QA with real assistive technology to validate that your semantic structure produces coherent, navigable UX for non-sighted users.

### The core idea

You already know the accessibility tree is the parallel DOM that browsers expose to assistive tech. Screen readers consume that tree, not the visual layout. The gap that manual testing closes: the tree can be technically valid but experientially broken.

Consider a modal dialog. The accessibility tree might have `role="dialog"`, `aria-labelledby` pointing to the heading, and a close button with a proper label. Axe finds nothing wrong. But when you actually tab into it with NVDA, focus lands behind the modal on the obscured page content, and there's no `aria-modal="true"` to tell the screen reader to constrain virtual cursor navigation. A sighted user sees the backdrop and intuitively stays inside the modal. A screen reader user in browse/virtual mode can arrow-key through the entire page as if the modal doesn't exist.

That bug is invisible to automated tools and invisible to snapshot tests. It only surfaces when you hear the screen reader narrate the wrong content.

### The three major tools

- **NVDA** (Windows, free) — most common among actual users, pairs with Firefox or Chrome
- **JAWS** (Windows, paid) — dominant in enterprise/government contexts
- **VoiceOver** (macOS/iOS, built-in) — essential for Safari and native iOS flows

They have meaningfully different behavior. A navigation landmark that works in VoiceOver may announce confusingly in JAWS. Test on at least two.

### Practical scenarios

**Frontend:** You build a combobox autocomplete — input triggers a listbox of suggestions. The ARIA pattern is documented. But does the screen reader announce the number of results when they appear? Does selecting an option close the listbox and move focus back to the input with a confirmation? Does pressing Escape work correctly in both browse mode and forms mode (NVDA distinction)? You'll only know by testing it.

**Fullstack:** A form submission returns a server-rendered error summary at the top of the page. The DOM updates, but focus stays at the submit button. A sighted user sees the red error list. A screen reader user hears nothing — they have to manually navigate back up to discover something went wrong. Fix: move focus to the error summary or use a live region to announce the error count.

### When to reach for it

Reach for screen reader testing when you're building interactive widgets (modals, drawers, carousels, autocompletes, data tables with actions), form flows, and anything with dynamic content updates. Don't rely on it as a first pass — run axe first to clear the mechanical issues, then do manual testing to validate the experience.
