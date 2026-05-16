---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Web Storage API** gives browsers a simple key-value store that persists across page loads — a client-side escape hatch from the stateless nature of HTTP, without the overhead and automatic server-transmission of cookies.

## Core Mechanism

There are two stores: `localStorage` and `sessionStorage`. Both implement the same synchronous, string-keyed API. The difference is lifetime:

- `localStorage` persists indefinitely until explicitly cleared (or the user clears site data)
- `sessionStorage` is scoped to the tab's session — gone when the tab closes, and *not* shared between tabs even on the same origin

Both are origin-scoped (`scheme + host + port`), so `https://app.com` and `http://app.com` get separate storage. There's no cross-origin access.

The storage limit is typically 5–10MB per origin depending on browser — orders of magnitude more than cookies, but still not a database.

```js
localStorage.setItem('theme', 'dark');
const theme = localStorage.getItem('theme'); // 'dark'
localStorage.removeItem('theme');

// Everything is stringified — objects need JSON round-trips
localStorage.setItem('user', JSON.stringify({ id: 42, role: 'admin' }));
const user = JSON.parse(localStorage.getItem('user'));
```

The synchronous API is the subtle footgun: reads and writes block the main thread. For large payloads or frequent writes, this matters — prefer IndexedDB for anything heavier.

## Mental Model

Think of it as the browser's equivalent of a process environment — simple string pairs that survive restarts (`localStorage`) or exist only for the current "session" (`sessionStorage`), with no knowledge by the server unless you explicitly send the values.

## Practical Scenarios

**Frontend:** UI preferences (dark mode, sidebar collapsed state, dismissed banners) are the canonical use case. You want these to survive a refresh but don't need or want them server-side. Also common: caching API responses for fast initial renders before a fresh fetch completes.

**Fullstack:** Auth token storage is where most engineers have opinions. Storing JWTs in `localStorage` is convenient but exposes them to XSS — any injected script can read storage. `httpOnly` cookies are safer for tokens. A common compromise: store non-sensitive session metadata (user display name, preferences) in `localStorage`, keep auth tokens in `httpOnly` cookies managed server-side.

Also relevant for fullstack: persisting draft state (unsaved form data), storing A/B test variant assignments, or holding device fingerprint values that feed analytics without a server round-trip on every page.

## One Thing That Bites People

`storage` events fire in *other* tabs on the same origin when `localStorage` changes — not in the originating tab. This is actually useful for cross-tab state sync (sign out everywhere, real-time preference propagation), but it surprises engineers who expect the event to fire locally.
