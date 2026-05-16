---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Code Splitting

Code splitting is the practice of breaking your JS bundle into multiple smaller chunks that are fetched on demand instead of all at once. The motivation is straightforward: a user hitting `/login` shouldn't have to download the code for your analytics dashboard, admin panel, and every chart library you've ever imported.

### The Core Mechanism

When a bundler (Webpack, Vite, Rollup) encounters a dynamic `import()` call, it treats that as a **split point** and emits a separate chunk file. The main bundle gets a small loader that fetches the chunk over the network when that `import()` actually executes at runtime.

The bundler does the hard work statically: it traces the full import graph from each split point, figures out what belongs in each chunk, and handles shared dependencies by de-duplicating them into common chunks. That's why `import('./AdminPanel')` automatically pulls in everything `AdminPanel` transitively imports — unless those things already live in another chunk, in which case they go into a shared chunk instead.

The key mental model: **`import()` is the seam you hand the bundler**. Everything reachable from that call, not already in the main bundle, becomes its own chunk.

### Concrete Example

```js
// Static import — goes into main bundle unconditionally
import HeavyEditor from './RichTextEditor'

// Dynamic import — bundler emits a separate chunk
const RichTextEditor = lazy(() => import('./RichTextEditor'))
```

In the second case, the bundler emits `RichTextEditor.[hash].js`. `React.lazy` calls `import()` when the component first renders, which triggers the network fetch. Until then, nothing is loaded.

### Practical Scenarios

**Frontend SPA**: The highest-leverage application is route-level splitting. Each route becomes a split point, so users only load JS for pages they actually visit. A React app with 10 routes and no splitting might ship an 800KB main bundle; route-splitting can cut initial load to 60–100KB and defer the rest. Most routers (React Router, TanStack Router) have built-in support for this pattern.

**Fullstack (Next.js, Remix)**: The framework handles route splitting automatically, but component-level decisions still matter. A `<PDFExporter>` or `<MapView>` used in one specific route shouldn't load on every render of that route if the user might never trigger it — lazy-load it behind the user action that needs it.

### The Tradeoff to Watch

Over-splitting creates waterfall problems. Each chunk is an additional network round-trip, and if chunk A loads then triggers chunk B then triggers chunk C, you've replaced one large bundle with a request chain that's slower. Bundlers expose chunk size hints (`minSize`, `maxSize`) and you can use `webpackChunkName` (or Rollup's `manualChunks`) to group related modules into fewer, better-sized chunks. The goal isn't the smallest chunks — it's the right chunks loaded at the right time.
