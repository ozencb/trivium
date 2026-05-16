---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Partial Hydration** is the technique of hydrating only the interactive parts of a server-rendered page, leaving static sections as inert HTML. Full hydration pays the JavaScript cost for every component, even ones that never respond to user input — partial hydration eliminates that waste.

---

**Core mechanism**

Standard hydration walks the entire component tree: download JS for everything, re-execute renders in memory, reconcile against the existing DOM, attach listeners. Even a static `<Header>` that's just a logo and some links goes through this process.

Partial hydration breaks the tree into two classes at build or render time: components that need a JS runtime, and components that don't. Static components ship zero JavaScript — they exist only as HTML. Interactive components hydrate independently.

The hard part is that most component models weren't designed for this. React's reconciler, for example, expects to own the entire tree. Supporting partial hydration requires the framework to treat components as independent hydration boundaries rather than nodes in a single managed graph.

---

**Mental model**

Think about a news article page: nav, hero image, article body, a comment widget, a newsletter signup. Only the widget and the form have real interactivity. With full hydration, you're paying JS execution cost for the article body — paragraphs of text that will never change. With partial hydration, those paragraphs stay frozen as HTML. The comment widget and signup form each hydrate on their own, isolated from the rest.

---

**Frontend scenarios**

Content-heavy sites — blogs, docs, marketing pages — see the biggest gains. If 80% of your page is static, full hydration is a large runtime tax with no user-visible benefit. Partial hydration cuts Time to Interactive directly, because the browser isn't parsing and executing JS for components that do nothing. Lower TBT and faster LCP improve Core Web Vitals, which matters if SEO is in scope.

---

**Fullstack scenarios**

In SSR/SSG setups (Next.js, Remix, Astro, SvelteKit), you're already sending fully-rendered HTML from the server. Partial hydration is the logical next step: fast first paint from the server, then selective hydration only where the user needs to interact. Astro makes this concrete with `client:load`, `client:idle`, `client:visible` — each component opts into its own hydration timing explicitly.

This shifts the mental model from "is this a server or client component?" to "does this component need a runtime at all?"

It's also the direct prerequisite for **Islands Architecture**, which formalizes this into self-contained interactive regions with independent hydration lifecycles, and connects to **Resumability**, which pushes further by asking whether you need to hydrate at all — or can you just resume from serialized server state.
