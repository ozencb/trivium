---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Content Security Policy

CSP is an HTTP response header that tells the browser exactly which origins are allowed to load scripts, styles, fonts, frames, and other resources — and the browser enforces this before executing anything. Even if an attacker successfully injects a `<script>` tag via XSS, CSP stops it from running if the source isn't on the allowlist.

**The core mechanism**

CSP works by having your server send a `Content-Security-Policy` header with directives like:

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com; style-src 'self' 'unsafe-inline'
```

Each directive targets a resource type. `default-src` is the fallback. `script-src` controls JavaScript. The browser parses this before rendering and blocks anything that doesn't match — with violations optionally reported to an endpoint via `report-uri` or `report-to`.

The mental model: CSP is a firewall at the resource-loading layer, not the network layer. It doesn't prevent the injected content from reaching the DOM — it prevents the browser from *acting* on it.

**Where engineers get it wrong**

The most common pitfall is `'unsafe-inline'` and `'unsafe-eval'`. These effectively disable script protection, but teams reach for them because inline scripts are everywhere in legacy apps or because frameworks like Angular historically needed `eval`. The correct path is nonces (`'nonce-abc123'`) or hashes — you whitelist specific inline script blocks by their SHA hash rather than opening the floodgates.

Another trap: setting `report-only` mode, watching violations, and never graduating to enforcement. Report-only is how you audit before shipping, not a permanent state.

**Practical scenarios**

*Frontend*: When building a React/Vue SPA, CSP lets you lock down `script-src` to your CDN and your own origin. Nonces get generated server-side per request and injected into the HTML — this is why SSR matters for CSP; a pure static build makes nonces harder to manage.

*Fullstack*: Your Express/Next/Rails app sets the header. Libraries like `helmet` (Node) make this a one-liner, but the defaults are often too permissive. You need to audit every third-party script (analytics, A/B testing tools) and explicitly allow their domains — which also forces a conversation about supply chain risk.

*SRE*: CSP violation reports are signal. A spike in blocked resources can mean someone injected a payload, a deployment broke a script hash, or a third-party changed their CDN URL. Routing `report-to` to a log aggregator and alerting on anomalies gives you early XSS detection without waiting for user reports.

**Why it matters at the senior level**

CSP is the defense-in-depth layer below XSS prevention. Sanitization can have bugs; CSP limits blast radius when it does. In design reviews, proposing CSP with nonces signals you're thinking about the threat model holistically. It also sets up understanding of **Trusted Types**, which pushes enforcement down to the DOM API level — the next evolution past header-based policy.
