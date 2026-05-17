---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Streaming SSR

Traditional SSR sends one complete HTML response — the server waits until the full page is rendered, then flushes everything at once. Streaming SSR breaks that into a pipeline: the server writes HTML to the response in chunks as each piece becomes ready, so the browser can start parsing, painting, and even executing scripts before the server finishes generating the rest.

### The core mechanism

HTTP supports chunked transfer encoding, which lets a server send a response body in pieces without declaring `Content-Length` upfront. The browser treats each chunk as it arrives — it doesn't wait for the closing tag. This means you can flush `<head>` and your above-the-fold shell immediately, letting the browser fetch critical CSS and JS in parallel with the server still resolving data for the rest of the page.

React 18's `renderToPipeableStream` (Node.js) and `renderToReadableStream` (edge runtimes) expose this directly. You stream a shell with `<Suspense>` boundaries as placeholders, then flush each boundary's resolved content as an inline `<script>` that swaps it in via client-side reconciliation. The HTML stays semantically valid throughout.

### Mental model

Think of a restaurant sending dishes as they're ready rather than holding the entire order until the last plate is plated. The customer (browser) starts eating immediately; the kitchen (server) keeps working.

### Where it matters in practice

**Frontend/fullstack:** The canonical win is TTFB and LCP. If your page has a slow data dependency (e.g., a personalized feed behind auth), you can stream the chrome — nav, layout, static sections — immediately, then stream the feed content once the DB query resolves. Without streaming, the user stares at a blank screen for the duration of your slowest query.

**Common pitfall: headers must be set before the first flush.** Once you've started streaming, you can't set a `Set-Cookie` or redirect. This catches engineers who try to handle auth redirects mid-render — you need to resolve auth *before* opening the stream, not inline with component rendering.

**Another pitfall: error handling is harder.** With a single response, an unhandled exception means a 500 before the client sees anything. With streaming, you may have already flushed a 200 and partial HTML — you can't change the status code. You need explicit error UI within Suspense boundaries rather than relying on HTTP status for error signaling.

### Why this differentiates senior engineers

Most engineers understand SSR vs CSR. Fewer can speak to *why* streaming changes the performance model (it parallelizes server work with browser parsing and asset fetching), or *where* it breaks down (header immutability, error semantics, CDN edge caching of partial responses). In design discussions, knowing when *not* to stream — e.g., short latency APIs where chunking overhead outweighs benefit — is the signal that separates someone who's used the abstraction from someone who understands it.
