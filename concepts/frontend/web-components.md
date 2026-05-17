---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Web Components are a browser-native spec for defining custom, encapsulated HTML elements that carry their own behavior and styling—no build step, no framework required. The value proposition is longevity and portability: a component defined against the platform itself works in React, Vue, a legacy jQuery app, or raw HTML, and won't break when framework majors turn over.

## The Three-Spec Stack

You already know Shadow DOM, so the mental model here is how the three specs compose:

**Custom Elements** is the registrar. `customElements.define('my-card', MyCardElement)` maps a tag name to a class extending `HTMLElement`. From that point on, the browser constructs instances of your class wherever it encounters `<my-card>`—in markup, in `innerHTML`, or via `document.createElement`. Lifecycle callbacks (`connectedCallback`, `disconnectedCallback`, `attributeChangedCallback`) are the platform-native equivalents of mount/unmount/props-change.

**Shadow DOM** is encapsulation. You attach a shadow root in the constructor and render into it. Styles are scoped by default—nothing leaks in or out—but CSS custom properties *do* pierce the boundary intentionally. That's your theming API surface: expose `--card-background` and let consumers customize it without giving them access to your internals.

**HTML Templates** (`<template>` / `<slot>`) are the rendering primitive. A `<template>` is parsed but never rendered—it's a dormant document fragment you clone cheaply on each instantiation. `<slot>` handles content projection: it lets the consumer's light-DOM children *appear* inside your shadow root at a named position, without actually relocating them in the tree. This is the key to composability.

Together: define a `<template>` with `<slot>` placeholders, clone it into `attachShadow({mode: 'open'})` in the constructor, wire up attributes via `attributeChangedCallback`. That's a complete, encapsulated component.

## Where This Actually Pays Off

**Frontend:** Cross-framework design systems. If your org runs a React dashboard, a Vue 3 app, and a legacy admin panel, web components let you ship one button library and consume it everywhere without wrapping it per-framework. The cost: you lose React's reconciler—reactivity requires manual wiring or a thin library like Lit.

**Fullstack:** Progressive enhancement and HTML streaming. Declarative Shadow DOM (`<template shadowrootmode="open">`) lets servers emit pre-rendered shadow roots that hydrate client-side. This is still catching up in tooling, but it's where the spec is heading for SSR.

## Pitfalls Worth Knowing

- **Form participation** is a known gap. Custom elements can't inherit native `<input>` behavior without `ElementInternals`, which is newer and less ergonomically supported across frameworks.
- **Attribute/property duality** requires boilerplate. Attributes are strings; JS properties aren't. Every reflected attribute needs a getter/setter pair unless you use a library.
- **SSR is awkward.** Declarative Shadow DOM solves it on paper, but framework integrations are inconsistent.

Reach for Web Components when portability *across* frameworks or survival *beyond* any single framework's lifecycle is the real constraint—not just because encapsulation is appealing (Shadow DOM alone handles that).
