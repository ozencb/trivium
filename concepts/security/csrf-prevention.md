---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## CSRF Prevention

Browsers automatically attach cookies to any request to a matching origin — including requests initiated by a malicious third-party page. CSRF exploits this: an attacker's page silently submits a form or fires an XHR to your API, and the victim's session cookie rides along for free. The defenses exist to prove the request was *intentionally* made by your app, not just incidentally credentialed by the browser.

### The core problem

CORS protects against reading cross-origin responses, but it doesn't prevent the *request from being sent*. A form POST to `https://bank.com/transfer` from `https://evil.com` will still fire with the user's cookies — the browser only blocks the attacker from reading the response. If your endpoint mutates state on receipt, the damage is done before the response is ever checked.

### Defense mechanisms

**Synchronizer token pattern**: On page load, the server generates a random token tied to the session, embeds it in a hidden form field (or a meta tag for SPAs), and validates it on every state-changing request. The attacker can't read your page's DOM due to same-origin policy, so they can't steal the token.

**Double-submit cookie**: Set a random value in both a cookie and a request header (or body). The server checks they match. The attacker can't set or read your cookies, so they can't replicate the pair — but this breaks down if you have subdomain XSS, since subdomains *can* write to parent-domain cookies.

**SameSite cookie attribute**: `SameSite=Strict` prevents the cookie from being sent on any cross-origin navigation; `Lax` (now the default in most browsers) blocks it on POST/PUT/DELETE cross-origin but allows it on top-level GET navigations. For most apps, `Lax` kills the majority of CSRF surface for free — but it's a browser-enforced hint, not a guarantee, and older browsers don't respect it.

### In practice

For a **backend** serving traditional HTML forms (Rails, Django, Express with sessions), the synchronizer token is the standard: frameworks usually wire it automatically. The pitfall is unprotected JSON APIs that still use cookie auth — devs often skip CSRF middleware assuming "it's an API," but if the browser sends cookies, the risk exists.

For **fullstack** apps with a separate SPA frontend, the common pattern is combining `SameSite=Lax` with a custom request header (e.g., `X-Requested-With: XMLHttpRequest`). Because simple cross-origin forms can't set custom headers, the server can reject anything without it. This is low-overhead and reliable for modern browsers. If you need belt-and-suspenders, add a CSRF token in a non-HttpOnly cookie that your JS reads and echos as a header.

The practical modern baseline: use `SameSite=Lax` or `Strict` on session cookies, and add synchronizer tokens (or the custom header trick) for anything where a CSRF bypass would be high-impact. Don't rely solely on checking `Origin`/`Referer` headers — they're occasionally absent and trivially controlled in some environments.
