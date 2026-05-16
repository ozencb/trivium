---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Web Components

Web Components are a browser-native standard for defining reusable, encapsulated custom HTML elements — no framework required. They exist because the platform needed a way to extend HTML itself, not just layer abstractions on top of it.

### Core mechanism

Three specs work together:

**Custom Elements** — lets you register a new tag name backed by a JS class. The browser calls lifecycle hooks (`connectedCallback`, `attributeChangedCallback`, `disconnectedCallback`) as the element moves through the DOM. You get a real HTML element, not a virtual one.

**Shadow DOM** — you already know this: the encapsulated subtree attached to your element. Styles inside don't leak out; external styles don't leak in (mostly).

**HTML Templates** — `<template>` is parsed but not rendered, so it's cheap to clone as a stamping mechanism. `<slot>` lets consumers project their own markup into your shadow tree.

```js
class TooltipEl extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    const tpl = document.getElementById('tooltip-tpl');
    shadow.appendChild(tpl.content.cloneNode(true));
  }
}
customElements.define('x-tooltip', TooltipEl);
```

Now `<x-tooltip>` is a real browser citizen — it shows up in DevTools, participates in the normal DOM lifecycle, and works without any runtime.

### Mental model

Think of it as *extending* the HTML vocabulary the same way `<video>` or `<details>` are extended. The browser ships `<video>` as a custom element internally — Web Components just expose that same mechanism to you.

### Practical scenarios

**Frontend:** Web Components shine when you need widgets that survive framework churn. A date picker, a rich text editor, a color input — ship it once, use it in React, Vue, Svelte, or vanilla HTML. The Shoelace component library does exactly this. The tradeoff is ergonomics: you lose JSX, reactivity primitives, and tight framework integration, so fine-grained interactive UIs are rougher to build natively.

**Fullstack:** If your stack serves HTML from the server (Rails, Django, Laravel, HTMX-style apps), Web Components fill the gap cleanly. You render server-side HTML with custom tags already in it; the browser upgrades them progressively. No hydration mismatch, no framework bundle required. A `<search-box>` that enhances a plain `<input>` is a natural fit.

The real value isn't replacing React — it's *interoperating with everything*. Design system teams building tokens and low-level primitives for cross-team consumption are the primary beneficiaries today.
