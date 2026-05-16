---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Islands Architecture

Islands Architecture is a frontend rendering strategy where most of a page is static HTML with isolated, independently hydrated interactive components — "islands" — scattered throughout. The goal is to ship near-zero JavaScript by default and only pay the hydration cost for components that actually need it.

### The Core Mechanism

In a traditional SSR + hydration setup, the server renders HTML, ships it to the browser, then React (or equivalent) re-hydrates the entire page as a single component tree. Even if 90% of your page is read-only content, the browser still downloads and executes the JavaScript for all of it.

Islands inverts this. The server renders the full HTML, but the hydration step is surgically scoped. Each interactive component is treated as an independent unit with its own JavaScript bundle. The static content between them — headers, prose, layout — stays as inert HTML forever. No hydration, no JS execution.

The key insight: there's no shared component tree. Islands don't compose into a React root. They're parallel, isolated hydration units that happen to share a page.

### Mental Model

Think of a newspaper page. The article text is static — you don't need JavaScript to read it. But the "share" button, the comment widget, and the subscription paywall pop-up are interactive. Islands treats each of those as a self-contained application embedded in an otherwise static document. They boot independently, and the rest of the page doesn't care.

### Practical Application

**Frontend:** If you're building a content-heavy site — documentation, marketing pages, blogs — Islands dramatically reduces Time to Interactive. You write components normally (often in any framework), mark the interactive ones as islands, and the bundler handles scoping. Astro is the canonical implementation: `client:load`, `client:idle`, `client:visible` directives let you control *when* each island hydrates.

**Fullstack:** Islands pairs naturally with edge rendering. You can stream the static shell from the edge instantly (low latency, no cold starts needed), then load only the JS for the interactive bits. This matters when you're building pages that are mostly data-display with a few interactive elements — think dashboards with static charts but a live filter widget, or e-commerce product pages where only the cart button needs hydration. You get the SEO and performance of fully static pages with the interactivity of a SPA, without shipping a monolithic JS bundle.

### Where It Gets Nuanced

The tradeoff is composition. When islands need to share state — say, a cart count in the header and a product page that updates it — you can't just lift state up through a React tree. You need a client-side store (nanostores, Zustand) or a custom event bus. This is the architectural cost: you trade bundle efficiency for the complexity of cross-island communication.
