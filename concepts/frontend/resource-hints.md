---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Resource Hints

The browser parses HTML top-to-bottom and only discovers resources when it encounters them — a script tag deep in the document, a font inside a CSS file, an image in a lazy-loaded component. Resource hints let you break that sequential dependency by telling the browser *declaratively* what it will need, before the parser gets there.

### The core idea

There are three distinct primitives:

**`preload`** — fetch this resource now, at high priority, because it's needed for the current page. The browser downloads it immediately but doesn't execute it; you control execution separately. Use this for critical assets that are discovered late: a font loaded via CSS, a hero image set in JS, a script that's dynamically injected.

```html
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
```

**`preconnect`** — establish the TCP connection, TLS handshake, and DNS lookup to a third-party origin ahead of time. The actual fetch happens later, but the expensive roundtrip overhead is already paid. Ideal for CDNs, API hosts, font providers.

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

**`prefetch`** — fetch a resource for a *future* navigation, at low priority, using idle network time. The browser may or may not honor it depending on conditions. Use this speculatively — the next page a user is likely to visit.

### Mental model

Think of preload as "I need this now, go get it in parallel." Preconnect as "warm up the pipe to that server." Prefetch as "here's a tip about what I'll probably need later."

The key distinction: preload is for the current page's critical path; prefetch is for the next page. Confusing them is the most common mistake — prefetch does nothing for current-page performance.

### Practical scenarios

**Frontend:** You're using a web font and notice layout shift because the font loads after CSS. A `preload` with `as="font"` moves the fetch to the very beginning of the document load, eliminating the flash of unstyled text. Same pattern for a hero image set via JavaScript — the browser can't discover it from the HTML, so you hint it explicitly.

**Fullstack:** Your SSR app renders a page that always makes an API call to `api.yourdomain.com`. Add a `preconnect` in the `<head>` of your layout. By the time JS hydrates and fires the fetch, the connection is already open. On a cold 4G connection this can save 200-400ms before the first API request even starts.

### Pitfalls

- **Over-preloading kills itself.** Preloading 15 resources saturates bandwidth and harms the actual critical path. Reserve it for 2-3 truly critical late-discovered assets.
- **Missing `as` attribute on preload** causes the browser to fetch at wrong priority and potentially fetch twice.
- **Preload without use** triggers a console warning and wastes bandwidth — the browser fetched something you never consumed.
- **`crossorigin` mismatch** on fonts causes a double-fetch silently. If the font request uses CORS, the preload must too.
