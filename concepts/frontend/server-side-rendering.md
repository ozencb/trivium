---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Server-Side Rendering (SSR)** means the server generates complete HTML for each request and sends it to the browser, rather than sending a bare JS bundle and letting the browser build the page. The payoff is faster first-paint and content that's immediately indexable—no waiting for JS to execute.

## The Core Mechanism

In a traditional SPA, the browser receives something like:

```html
<div id="root"></div>
<script src="bundle.js"></script>
```

The page is blank until the JS downloads, parses, executes, fetches data, and renders. That's 3-5 sequential round trips before the user sees anything.

With SSR, the server runs your rendering logic (React, Vue, etc.) *before* responding. It executes the component tree, fetches whatever data it needs, and serializes the result as HTML. The browser receives a fully-formed document:

```html
<div id="root">
  <h1>Dashboard</h1>
  <ul><li>Item 1</li>...</ul>
</div>
```

The browser paints immediately. JS still loads afterward to make the page interactive—that's hydration—but the visual content is already there.

## Mental Model

Think of it like the difference between a restaurant and a meal kit. SPA is a meal kit: you receive raw ingredients (JS bundle) and cook everything yourself (client-side rendering). SSR is a restaurant: the kitchen (server) does the work, and you get a finished plate.

## Where It Matters in Practice

**Frontend:** The main win is perceived performance and SEO. For a product landing page or content-heavy site, SSR means search crawlers and users both see real content immediately. Without it, Google's crawler might index an empty shell.

**Fullstack:** SSR lets you move data-fetching logic to the server, closer to your database or internal APIs—avoiding the extra network hop from browser → API → database. In Next.js terms, `getServerSideProps` runs on the server, fetches from your DB directly, and ships pre-populated HTML. No public API endpoint needed just to render a page.

**The tradeoff:** SSR adds server load. Every request triggers a render cycle instead of just serving static files. You're trading infrastructure complexity for faster first-paint and simpler data access patterns. This is why static generation (pre-rendering at build time) exists as a middle ground—but that's a separate topic.

## Why This Unlocks Other Concepts

Streaming SSR extends this by flushing HTML in chunks as data resolves, rather than waiting for everything. Hydration is what happens *after* SSR—attaching event listeners to the server-rendered HTML. Static Site Generation is SSR run at build time instead of per-request. Understanding SSR's basic contract (server renders → sends HTML → client hydrates) is the foundation for all of them.
