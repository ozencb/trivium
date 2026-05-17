---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Code Splitting

Modern bundlers like webpack or Vite pack your entire application into one (or a few) JavaScript files by default. That's fine at small scale, but once your app grows, a user hitting `/login` downloads code for the dashboard, the admin panel, and the charting library they'll never touch in that session. Code splitting breaks that monolithic bundle into chunks that load on demand.

**The core mechanism:** Bundlers analyze your `import()` calls at build time and emit separate chunk files. The dynamic import becomes a network fetch at runtime — the browser only requests that chunk when execution reaches that `import()`. The bundler also handles deduplication, so shared dependencies (like React itself) go into a shared chunk loaded once.

```js
// Without splitting: UserDashboard is in your main bundle always
import UserDashboard from './UserDashboard';

// With splitting: a separate chunk, fetched only when this runs
const UserDashboard = lazy(() => import('./UserDashboard'));
```

React's `lazy` + `Suspense` is the most common pattern, but the underlying primitive is just `import()`. Routers like React Router or TanStack Router have route-level splitting built in — each route becomes a chunk, which is usually the right granularity to start with.

**Mental model:** Think of it like a library with books on shelves. Without splitting, every visitor carries every book to their table when they walk in. With splitting, they only grab the books relevant to what they're researching, and the library fetches others as needed.

**Frontend:** The highest-ROI split is route-level. A 2MB bundle becomes ten 200KB chunks — most users only ever load 2-3 of them. Beyond routes, consider splitting heavy third-party deps used in only one area: PDF renderers, rich text editors, chart libraries. The anti-pattern is over-splitting: if every component is a lazy chunk, you trade one big waterfall for many small ones, and the overhead of round-trips kills perceived performance.

**Fullstack (Next.js, Remix, etc.):** Frameworks handle route splitting automatically, but you still own component-level decisions. Server components change the calculus — a heavy component rendered server-side never ships its JS to the client at all, which can be better than lazy loading it. Know which budget you're optimizing: bundle size (client) vs. render time (server).

**Common pitfalls:**
- Lazy loading above the fold — Suspense fallbacks are jarring when the user sees them immediately on page load; split below the fold or prefetch aggressively
- Not prefetching on hover/focus, so the chunk fetch happens only after the click, adding latency
- Forgetting that splitting shifts load time, it doesn't eliminate it — the chunk still needs to download, parse, and execute

The right time to reach for this is when your main bundle exceeds ~150-200KB gzipped, or when profiling shows significant JS parse time on initial load.
