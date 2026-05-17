---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Web Storage API

Both `localStorage` and `sessionStorage` are synchronous, origin-scoped key-value stores for strings—but they differ on *which boundary* gates access, and that boundary mismatch is the source of almost every bug people hit with them.

### Core mechanism

The storage unit for both is the **origin** (scheme + host + port). But `localStorage` is persisted to disk and shared across every browsing context under that origin—all tabs, all windows, even across browser restarts. `sessionStorage` is scoped to a single **browsing context** (roughly: a tab), lives in memory, and is destroyed when that context closes.

The subtle invariant: two tabs open to `https://example.com` share one `localStorage` namespace but have *independent* `sessionStorage` namespaces. Writes to sessionStorage in tab A are invisible to tab B, full stop.

There's one known trap here: when a new tab is opened via `window.open()` or a link without `rel="noopener"`, the new tab inherits a *snapshot copy* of the opener's sessionStorage at creation time. After that moment, the two are independent—but that initial copy surprises people expecting full isolation.

### Concrete mental model

Think of `localStorage` as a shared clipboard for the origin and `sessionStorage` as a clipboard local to each tab. The shared one persists across sessions; the local one vanishes when you close the tab.

### Practical implications

**Auth flows:** JWTs or session tokens in `localStorage` are shared across tabs—a logout operation that clears the token will work, but you need to listen for the `storage` event on other tabs to react to it synchronously. If you store auth state in `sessionStorage`, you get natural per-tab session isolation for free (useful for multi-account UIs), but the user is "logged out" every time they close the tab—which may be a feature or a bug depending on your security model.

**Tab isolation:** `sessionStorage` is the right primitive when you want per-tab state that doesn't bleed between contexts—think multi-step wizards, shopping carts in separate tabs, or any scenario where two concurrent instances of the same page should be independent.

**SSR and hydration:** Neither API exists in Node.js. Any access to `localStorage` or `sessionStorage` at module evaluation time or during server rendering will throw. The fix is deferring reads to `useEffect` or guarding with `typeof window !== 'undefined'`. The sneakier version of this bug is a hydration mismatch: the server renders one thing, but the client reads sessionStorage during hydration and diverges—React will silently produce inconsistent DOM until it reconciles, or throw in strict mode.

The fundamental rule: if you need state shared across tabs, use `localStorage` and design for concurrent writes. If you need per-tab isolation with no persistence requirement, use `sessionStorage`. If you need persistence *and* isolation, you need a server-side session.
