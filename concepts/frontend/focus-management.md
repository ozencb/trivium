---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Focus Management

When you change what's on the page — navigating routes, opening modals, inserting validation errors — the browser's focus state doesn't automatically update to reflect that change. Focus management is the practice of explicitly moving focus to the right place so keyboard users aren't left stranded in the DOM equivalent of a dead end.

### The core problem

The browser tracks a single focused element at any moment. When you remove that element from the DOM (or bury it behind a modal overlay), focus either disappears entirely or gets reset to `<body>`. For a sighted user with a mouse this is invisible — they just click. For a keyboard or screen reader user, they've lost their place entirely and have no natural way to find the new content without tabbing through everything from the top.

The fix is mechanical: call `element.focus()` at the right moment, after the DOM has settled.

### Mental model

Think of focus as a text cursor. When you cut text and paste it somewhere else, your editor repositions the cursor — it doesn't leave it floating where the old text was. Your job as the developer is to be that editor. The browser won't do it for you.

### Where this actually bites you

**Modal dialogs** — Two requirements: when the modal opens, focus moves inside it (usually to the first focusable element or a descriptive heading). When it closes, focus returns to the element that triggered it. If you don't return focus, the user is teleported to the top of the document.

**SPA route transitions** — This is the most commonly missed one. After navigation, focus typically stays wherever it was on the previous page, often a link in a nav that no longer makes sense in context. The standard pattern is to focus the page's `<h1>` or a skip-navigation landmark after each route change. React Router doesn't handle this for you; neither does Next.js by default without explicit hooks.

**Inline error insertion** — If you insert a validation error summary above a form on submit, focus needs to move to it. Otherwise the user submits, nothing appears to happen from their perspective, and they don't know why.

**Focus trapping** — Modals also require trapping: `Tab` and `Shift+Tab` should cycle within the modal, not escape into the background. This means intercepting keyboard events and wrapping around when you reach the last/first focusable element.

### Common pitfalls

- Focusing a `<div>` without `tabindex="-1"` — `focus()` silently fails on non-interactive elements without it
- Moving focus before the element is rendered (use `useEffect` or `requestAnimationFrame` as needed)
- Focusing too eagerly on minor updates (every toast notification shouldn't hijack focus — use ARIA live regions for announcements that don't need a focus shift)

For fullstack setups with server-rendered partial updates (htmx, Turbo), the same rules apply — you're just wiring the focus call to a response event instead of a React state change.
