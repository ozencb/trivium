---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Screen reader testing is the practice of verifying that your UI is usable when consumed as audio or braille output rather than visually. It's necessary because a correct accessibility tree is a prerequisite, not a guarantee — screen readers are implementations that interpret the tree, and they have quirks, inconsistencies, and behaviors no linter will catch.

## The Core Mechanism

You already know the accessibility tree sits between the DOM and assistive technology. What screen reader testing surfaces is the gap between *tree correctness* and *user experience coherence*. A `role="dialog"` with `aria-modal="true"` and a proper `aria-labelledby` looks fine in DevTools. But NVDA on Windows may not trap focus inside it without additional JS — while VoiceOver on macOS does. The spec and the implementation diverge.

Screen readers also impose a *linear reading model* on inherently spatial UIs. Users navigate by heading hierarchy, landmark regions, or tab order — not by scanning. Testing forces you to experience your interface the way a non-visual user does: sequentially, with only audio feedback.

## Concrete Mental Model

Think of it like testing your API by actually calling it, not just reading the OpenAPI spec. The accessibility tree is the spec. The screen reader is the client. You care whether the client gets a coherent, predictable experience — not whether the spec is syntactically valid.

## Practical Testing Workflow

1. Navigate keyboard-only first (Tab, arrows, Enter/Space) to confirm focus is logical
2. Enable a screen reader and run the same flow — listen for what gets announced
3. Specifically check: interactive element labels, state changes (expanded/collapsed, selected, error), reading order, focus behavior when content appears or disappears

**Pairings that matter:** NVDA + Chrome (most common Windows users), VoiceOver + Safari (macOS/iOS), TalkBack + Chrome (Android). Behavior differs enough that testing one doesn't cover the others.

## Frontend Scenarios

A custom `<div role="combobox">` dropdown: does opening it announce "expanded"? Do options announce their position ("2 of 5")? Does selecting one move focus back sensibly? Form validation: does the error message get announced when the field blurs, or just appear visually while the screen reader stays silent?

## Fullstack Scenarios

Server-rendered apps and SPAs both have a specific failure mode: page navigation. A full-page load re-announces the `<title>`. Client-side routing (Next.js, Remix, React Router) does not — the DOM updates silently. Without explicit focus management or a live region announcing the new page, screen reader users have no signal that navigation happened. This is one of the most common accessibility regressions in fullstack apps and is invisible to automated tools.

## The Key Insight

Static analysis (axe, Lighthouse) tells you about structural problems. Screen reader testing tells you whether the *experience* is coherent. You cannot substitute one for the other — you have to listen.
