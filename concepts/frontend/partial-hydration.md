---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Partial Hydration

Full hydration is a tax you pay whether or not the user ever clicks anything. Partial hydration lets you pay only for the interactivity you actually ship — the rest stays inert HTML.

**The core mechanism**

In a standard SSR setup, the server renders a full HTML document, then the client downloads the entire JS bundle and replays component initialization across the whole tree (reconciling virtual DOM, attaching event listeners, restoring state). Partial hydration breaks this: you annotate which components need client-side behavior, and only those get hydrated. Everything else is static markup the browser never touches with JavaScript.

The framework needs to solve a boundary problem here — it must know where a hydration island begins and ends without running JS on the surrounding tree. This is why partial hydration isn't just a config flag; it typically requires explicit component boundaries or compiler support.

**Mental model**

Think of your page as a newspaper. The article text, byline, and layout are print — static, no behavior needed. The comments section, the share button, the subscription widget — those need JS. Partial hydration means you deliver the whole newspaper as HTML but only wire up the dynamic widgets. The article doesn't need a React runtime; the comment box does.

**Concrete example**

A marketing landing page: hero section, feature grid, testimonials, a pricing toggle (interactive), and a CTA with a modal (interactive). With full hydration, React boots for all of it. With partial hydration, only the pricing toggle and modal component receive JavaScript. The rest is untouched HTML. On a 3G connection, this is the difference between "usable immediately" and "blank white screen."

**Where this matters in practice**

*Frontend:* Content-heavy pages with sparse interactivity — blogs, docs sites, e-commerce product pages — are the obvious wins. When you're doing performance audits and Time-to-Interactive is high despite good HTML load times, excess hydration is often the culprit.

*Fullstack:* In Next.js you approximate this with `'use client'` boundaries — components without that directive don't ship client JS. Astro makes it explicit with `client:load` / `client:idle` / `client:visible` directives. The tradeoff: you have to think about component boundaries up front, which adds design overhead.

**The senior-engineer angle**

This is where you earn your seat in architecture discussions. Junior engineers reach for client components by default. The sharp question to ask is: *does this component actually need to run JavaScript on the client, or does it just need to look like it does?* Knowing the hydration cost of a component tree — and knowing when to push interactivity to the edges — is the difference between a performant app and one that ships a React runtime to render a paragraph tag.

Partial hydration is also the conceptual foundation for Islands Architecture (explicit interactive islands in a static sea) and Resumability (skipping hydration entirely by serializing framework state at the server).
