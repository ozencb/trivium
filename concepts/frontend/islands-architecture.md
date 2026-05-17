---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Islands Architecture

Islands Architecture is a rendering strategy where the server delivers fully-formed static HTML, and JavaScript is only shipped and executed for explicitly marked interactive regions ("islands") — each hydrating independently rather than the entire page. It's the architectural answer to the question: why hydrate a navbar and a cookie banner just to make one product carousel interactive?

### The Core Mechanism

In a traditional SSR + hydration setup (Next.js pages router, for example), the server renders HTML, ships the entire React tree as JS, then the client re-executes that tree to attach event listeners. Even static content participates in hydration. Islands Architecture breaks this by treating each interactive component as its own isolated unit with its own hydration boundary, state, and JS bundle. Static regions ship zero JavaScript — they're just HTML. The framework (Astro, Fresh, Marko) knows which components need hydration and only sends those.

The key insight: islands don't share a JavaScript runtime. They're separate component trees that happen to coexist on the same page. Communication between them typically happens through the DOM, custom events, or a lightweight shared store — not through a unified component tree.

### Concrete Mental Model

Think of the page as a newspaper layout. The article text, header, and footer are ink on paper — static, no interactivity needed. But you've glued in a few widgets: a live stock ticker, a comments section, a share button. Those widgets are self-contained; they have their own batteries. Islands Architecture formalizes this: the "ink" is server HTML, the "widgets" are hydrated islands.

### In Practice

**Frontend:** Astro is the clearest implementation. You write `.astro` components that ship no JS by default, and opt specific components into hydration with directives like `client:load`, `client:visible`, or `client:idle`. `client:visible` is particularly powerful — it uses an IntersectionObserver to hydrate only when the island scrolls into view, which is essentially lazy hydration for free.

**Fullstack:** Islands Architecture shines on content-heavy sites with sparse interactivity — marketing pages, documentation, blogs, e-commerce product pages. If your page is 80% static and 20% interactive, shipping a full SPA bundle is wasteful. The architecture lets you pay the JS cost proportionally.

### Where It Gets Nuanced

The tradeoff is coordination cost. When islands need to communicate — a filter component updating a product grid — you lose the convenience of shared React state. You end up routing messages through `CustomEvent`, `nanostores`, or URL state. This is manageable but requires deliberate design.

Also worth knowing: Islands Architecture isn't a replacement for SPAs. If your UI is inherently stateful and interconnected (a dashboard, a complex form flow), a unified component tree is the right call. Islands Architecture wins when the static/interactive ratio heavily favors static.

**The senior differentiator in interviews:** knowing that Islands Architecture is fundamentally about hydration granularity, and being able to articulate when the coordination overhead of isolated islands is worth the JS bundle savings — versus when shared state needs make a unified hydration model the pragmatic choice.
