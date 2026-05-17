---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Shadow DOM

The browser's default DOM is a single shared namespace: any CSS rule can match any element, and JavaScript can reach anything with `querySelector`. Shadow DOM punches a hole in that model by letting you attach a separate, encapsulated DOM tree to any element — one that has its own style scope and is opaque to the outside document.

**The core mechanism** is the *shadow root* — a second root node attached to a *shadow host* element. Once attached (via `element.attachShadow({ mode: 'open' })`), children placed inside it are rendered as part of the host's visual output, but they live in a separate tree. CSS defined outside the shadow boundary doesn't cascade in (with narrow exceptions like inherited properties and CSS custom properties, which do pierce the boundary by design). CSS defined inside doesn't leak out. `document.querySelector` doesn't see shadow DOM nodes unless you explicitly traverse into shadow roots.

**Mental model:** think of shadow DOM the way you think of an `<iframe>`, but without the navigation/security isolation overhead and with full layout integration. You get style containment without the heavyweight cost.

**Concrete example:** The browser's native `<video>` element has playback controls — a progress bar, a volume knob, a fullscreen button. Those controls are real DOM nodes, styled with CSS. They've been rendered via shadow DOM since before the spec was standardized. You don't see them in your page's DOM, your CSS doesn't accidentally style them, and users don't need to ship the implementation. That's the value proposition.

**In practice for frontend engineers:** Shadow DOM is the isolation primitive behind Web Components. When you define a custom element (`class MyCard extends HTMLElement`), shadow DOM lets you ship encapsulated structure and styles as a single unit. The component author controls what leaks in (via CSS custom properties as an intentional theming API) and what doesn't.

The pitfall most people hit: *inherited* CSS properties like `color`, `font-family`, and `line-height` **do** inherit through shadow boundaries because they propagate through the element tree, not the style sheet. You can't fully seal a shadow component from ambient typography without explicitly resetting those properties inside.

**For fullstack engineers:** If you're rendering server-side HTML and then hydrating, shadow DOM complicates serialization. `innerHTML` doesn't serialize shadow trees by default — you need the newer Declarative Shadow DOM (`<template shadowrootmode="open">`) to express shadow DOM in static HTML, which is what frameworks like Lit use for SSR. Worth knowing before you assume shadow-DOM-based components will serialize cleanly.

The main reason to reach for shadow DOM is genuine style encapsulation in a shared environment — a design system shipping components to multiple teams, a widget embedded in third-party pages, or any context where CSS collision is a real operational risk.
