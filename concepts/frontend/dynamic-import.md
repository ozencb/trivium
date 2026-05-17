---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Dynamic Import

`import()` lets you load a JavaScript module on demand at runtime instead of at parse time — the practical payoff is that your users don't download code they haven't asked for yet.

### The core mechanism

Static `import` statements are resolved and evaluated before any code runs. The module graph is fully determined at parse time, which is why bundlers can tree-shake and analyze it statically — but it also means everything gets bundled together.

`import()` is different: it's a language primitive (not a function, despite the syntax) that returns a `Promise<ModuleNamespace>`. The module isn't fetched or evaluated until that expression is hit at runtime. Bundlers like Vite, webpack, and Rollup treat every `import()` call as a **split point** — they automatically extract the target module (and its dependency subtree) into a separate chunk that gets fetched on demand.

```js
// This chunk is loaded immediately
import { format } from 'date-fns';

// This chunk is only fetched when the user navigates here
const { Chart } = await import('./chart-library');
```

The returned module namespace object is identical to what you'd get from a static import — `default`, named exports, everything.

### Where this actually matters

**Route-based splitting** is the canonical use case. In React Router, Next.js's `<Link>`, or Vue Router, each route can lazily load its component. A user hitting `/dashboard` never downloads the `/settings` bundle. React's `lazy()` is just a thin wrapper around `import()`.

**Interaction-triggered loading** is underused but powerful. A rich text editor, a date picker with a large locale library, a chart — these don't need to be in the initial bundle. Load them when the user actually opens that panel or clicks that button.

**Conditional loading** is another pattern: load a heavy analytics or monitoring library only in production, or load a polyfill only when the browser needs it.

### Pitfalls

The main trap is **waterfall loading**: if component A lazy-loads B, and B lazy-loads C, you've created sequential round trips. Bundler `prefetch` hints (`/* webpackPrefetch: true */` or Vite's `import(...).then()` with `<link rel="modulepreload">`) let you start the fetch during idle time before the user triggers it.

The other trap is **overly granular splitting**. Splitting every small component creates a flood of tiny HTTP requests. The split boundary should be at natural breakpoints — routes, heavy third-party libs, rarely-used features — not at the component level.

### For fullstack engineers

In Node.js/server contexts, `import()` is how you dynamically load plugins, conditionally require heavy dependencies only when a specific endpoint is hit, or load environment-specific config modules. The semantics are identical; the network latency concern just shifts to disk I/O.
