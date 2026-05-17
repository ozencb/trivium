---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Server-Side Rendering

SSR means your server executes application code, renders a complete HTML document, and sends it over the wire — the browser gets a fully-formed page it can display immediately, without waiting for JavaScript. The motivation is simple: browsers can paint HTML in microseconds, but fetching, parsing, and executing a JavaScript bundle takes hundreds of milliseconds on real hardware.

**The core mechanism**

In a pure client-side app (CSR), the server sends a nearly-empty HTML shell plus a JS bundle. The browser then downloads the bundle, executes it, makes API calls, and finally renders content — the user stares at a blank or spinner-covered screen until all of that completes. With SSR, the server runs the same rendering logic (in Node.js, Go, Ruby, etc.), inlines the resulting HTML, and ships it in the initial response. Time-to-first-meaningful-paint collapses because there's no JS dependency on the critical path.

The key invariant: **the server must know at request time what to render**. This means SSR is inherently request-scoped — the server sees the URL, cookies, headers, and can query databases or call services synchronously before producing the HTML. That's its power and its cost.

**Mental model**

Think of CSR as a flat-pack furniture box: the browser receives raw materials and assembles them locally. SSR is receiving furniture pre-assembled — heavier to ship, but immediately usable.

**Practical scenarios**

*Frontend:* E-commerce product pages, marketing sites, news articles — anything where initial load speed directly affects conversion or bounce rate. SSR means search engines get real content (not JS-dependent rendered content) and users on slow connections see something useful fast.

*Fullstack:* SSR blurs the line between frontend and backend. In Next.js, `getServerSideProps` runs server-side on every request, giving you access to databases and secrets that never touch the client. You own the full request lifecycle — authentication, data fetching, rendering — in one place. The tradeoff is server load: unlike static files, SSR responses can't be edge-cached without care, and slow data fetches block time-to-first-byte.

**Where senior engineers focus**

The subtle trap is treating SSR as a binary choice. Real systems often mix strategies: SSR the shell and above-the-fold content, stream progressive chunks as data arrives (streaming SSR), and hydrate interactivity client-side afterward. Understanding SSR deeply means knowing *why* it helps (critical rendering path), not just *that* it helps — so you can make the right tradeoff when a page is behind auth (caching doesn't save you), when data is highly dynamic (SSR adds latency), or when you need global edge distribution (static generation beats SSR on cost and speed).

SSR is the foundation that makes streaming, hydration, and hybrid rendering patterns legible — each is a refinement of the same core question: who renders what, and when.
