---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Differential Bundling

Differential bundling means shipping multiple compiled variants of your code — one per capability tier — and letting the environment pick the right one. The motivation is simple: transpiling ES2022+ down to ES5 for IE11 costs ~20-30% more bytes and runtime overhead, but only a shrinking fraction of users need that penalty.

### The core mechanism

Your bundler produces two (or more) outputs from the same source:

- **Modern bundle**: minimal transformation, native `async/await`, optional chaining, native ESM — targeting evergreen browsers
- **Legacy bundle**: fully transpiled, `Promise` polyfills, CommonJS or IIFE — targeting older engines

The browser selects between them using the `module`/`nomodule` attribute split:

```html
<script type="module" src="/bundle.modern.js"></script>
<script nomodule src="/bundle.legacy.js"></script>
```

Browsers that understand `type="module"` ignore `nomodule` scripts, and vice versa. This is a native browser feature, not runtime detection — zero overhead.

A third tier is increasingly common: a "module/nomodule" split *plus* a separate dynamic-`import()`-capable check via `<link rel="modulepreload">`, giving you fine-grained targeting across Chrome 61+, Chrome 80+, and Safari 14+ as distinct tiers.

### Concrete mental model

Think of it like deploying two Docker images: one optimized for ARM (modern), one for x86 (legacy). The load balancer routes traffic based on the client's architecture. No client runs both; no code is conditionally executed at runtime to pick a path.

The bundler (Vite, Rollup, webpack with `@babel/preset-env` + `browserslist`) handles compilation. The HTML or server handles routing. These two concerns stay separate.

### Practical scenarios

**Frontend (SPA/static):** Vite's `build.target` option uses this under the hood. Set `target: 'es2015'` for your legacy output and `target: 'esnext'` for modern. Your CI produces both, your static host serves both, and 95% of your users get the smaller, faster bundle. The remaining 5% (old Androids, corporate IE) still work.

**Fullstack (SSR/Node):** The same source tree feeds three compilations: server (Node, can use `require`/ESM depending on version), client-modern, client-legacy. Next.js has done this internally for years — its `pages/` compiler emits both a `_app.modern.js` and a legacy fallback. If you're building a custom SSR server with Vite + `vite-plugin-ssr` or Remix, you configure `legacy()` plugin from `@vitejs/plugin-legacy` and the framework wires the HTML snippet for you.

### What to watch for

- **Bundle size tracking must be per-tier** — comparing a modern build to a legacy build isn't an apples comparison
- **Polyfill deduplication**: the legacy bundle should include polyfills, the modern bundle should not; putting them in a shared chunk breaks this
- **Testing**: your CI should run Playwright/Vitest against both outputs, not just one

The payoff scales with audience: consumer products with diverse traffic gain more than internal B2B tools where you control the browser fleet.
