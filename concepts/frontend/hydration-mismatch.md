---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Hydration Mismatch Debugging

When React hydrates server-rendered HTML, it doesn't re-render — it *reconciles*: walking the existing DOM and attaching event listeners while assuming the tree matches what it would have rendered client-side. When it doesn't match, you get a mismatch, and React either silently replaces the DOM (dev mode warns, prod mode often doesn't) or throws entirely.

**The core mechanism**

During the reconciliation pass, React compares virtual DOM nodes against real DOM nodes by text content, tag type, and attribute values — not by identity. The invariant it enforces: the serialized server output must be byte-for-byte equivalent to what `renderToString` (or streaming equivalents) would produce for the *same props and state at the same point in time*. The key phrase is "same point in time" — the server renders at request time, the client renders at hydration time, and anything that differs between those two moments causes a mismatch.

**Where mismatches actually come from**

The most common sources aren't obvious bugs — they're subtle environment differences:

- **`Date.now()` or `Math.random()` in render** — produces different values server vs. client.
- **`typeof window !== 'undefined'` guards** — code that conditionally renders based on browser availability, which is undefined on the server.
- **Browser extensions** — inject DOM nodes (ads, password managers) that React didn't render.
- **Locale/timezone divergence** — a formatted date renders differently if the server is UTC and the client is in a different zone.
- **Async data that resolves differently** — especially with streaming SSR, where the client might receive stale or partial cache.

**Mental model**

Think of SSR output as a *snapshot contract*. The client is signing that contract blindly — it trusts the DOM is correct and just needs to attach behavior. The moment reality diverges from the snapshot, React has to choose between trusting the snapshot (keeping the DOM, potentially wrong) or trusting its own render (replacing the DOM, causing a flash). React 18 is more aggressive about replacing, which makes mismatches more visible but also more disruptive.

**Practical debugging**

In dev mode, React logs the specific nodes that diverged. The useful pattern: suppress hydration warnings on a subtree with `suppressHydrationWarning` (legitimate for things like timestamps that are intentionally client-only), or use `useEffect` to defer client-only rendering until after hydration completes. Next.js's `dynamic(() => ..., { ssr: false })` is essentially a formalized version of this pattern.

**Why this matters at the senior level**

Mismatches in production are often silent and intermittent — they surface as layout flashes, broken interactivity, or SEO-vs-user content divergence. Recognizing *why* they happen (not just that they happened) lets you design components that are hydration-safe by default: separating server-stable from client-volatile state, choosing the right rendering strategy per component, and knowing when SSR is actively harmful for a given piece of UI.
