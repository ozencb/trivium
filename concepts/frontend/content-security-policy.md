---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Content Security Policy

CSP is an HTTP response header that tells the browser which sources it's allowed to load and execute resources from. Where XSS prevention tries to stop malicious content from entering the DOM, CSP is a second line of defense: even if injection succeeds, the browser won't execute the payload.

### Core Mechanism

The server sends a `Content-Security-Policy` header. The browser parses it before executing anything on the page. Every resource load — scripts, styles, images, fetch requests — gets checked against the policy. Violations are blocked (and optionally reported).

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com; connect-src 'self' https://api.example.com
```

Key directives: `script-src` controls what JS can execute, `connect-src` controls fetch/XHR destinations, `default-src` is the fallback. The dangerous values are `'unsafe-inline'` (allows inline `<script>` tags) and `'unsafe-eval'` (allows `eval()`). Allowing either largely defeats the purpose.

The modern escape hatch for legitimate inline scripts is **nonces**: the server generates a cryptographically random value per request, injects it as `nonce="abc123"` on trusted `<script>` tags, and includes `'nonce-abc123'` in the policy. An injected `<script>` can't know the nonce, so it gets blocked even though inline execution is "allowed."

### Mental Model

Think of CSP as an allowlist enforced by the browser itself, not your code. Your app logic can't be bypassed — the browser is the enforcer. The browser doesn't care that an attacker tricked your app into rendering `<script src="evil.com/x.js">` if `evil.com` isn't in `script-src`.

### Practical Scenarios

**Frontend**: Frameworks like Next.js or Remix generate inline scripts for hydration data. You can't use a strict policy without either nonces (generated server-side per request) or hashes (SHA256 of the inline content). This shapes how you configure your meta-framework's CSP middleware.

**Fullstack**: CSP header generation belongs in your middleware layer, not static config, because nonces must be fresh per request and injected into the HTML before the browser parses it. A common pattern: middleware generates a nonce, stores it in request context, the template injects it into `<script nonce="...">` tags, and the header includes it.

**SRE**: Use `Content-Security-Policy-Report-Only` to deploy a policy in observation mode — violations are reported to your `report-uri` endpoint but not blocked. This is how you migrate an existing app to strict CSP without taking down prod. Reports also surface real attacks happening in production.

### Bridge to Trusted Types

CSP's `require-trusted-types-for 'script'` directive is what activates Trusted Types enforcement. Without CSP, Trusted Types is advisory. With it, the browser hard-blocks any raw string assignment to DOM sinks like `innerHTML` — which is why understanding CSP is the prerequisite.
