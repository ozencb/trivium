---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## JWT-Based Authentication

JWT-based authentication lets a server prove a user's identity on every request without maintaining session state — the token itself carries the proof of authenticity via a cryptographic signature the server can verify locally.

### Core Mechanism

When a user logs in, the server mints a JWT: it constructs a header (algorithm) + payload (claims like `sub`, `exp`, roles) + a signature computed over those two. For HS256, that's `HMAC-SHA256(base64url(header) + "." + base64url(payload), secret)`. For RS256, the server signs with a private key and any holder of the public key can verify — which is why this scales to distributed systems cleanly.

On subsequent requests, the client sends the JWT and the server re-computes the expected signature. If it matches, the claims are trusted — no DB lookup required. Crucially, the payload is only base64url-encoded, not encrypted. Anyone can decode it. The signature guarantees tamper-evidence, not confidentiality.

### Mental Model

Think of a JWT like a tamper-evident wristband at a venue. Staff issued it, and any other staff member can verify the hologram without radioing HQ. But once issued, you can't "un-issue" it until it expires — that's the fundamental tension.

### Backend

Your auth middleware intercepts every request, extracts the Bearer token, verifies the signature (cheap CPU operation, zero I/O), and populates the request context with identity. This means your API servers are fully stateless — horizontally scalable with no shared session store.

The catch is revocation. If a user logs out or gets compromised, the token is valid until `exp`. The common mitigations are: short-lived access tokens (15 min) paired with refresh tokens, or a token blocklist — which reintroduces a cache/DB lookup and partially defeats the stateless benefit. Pick your tradeoff deliberately.

### Fullstack

Storage location matters: `localStorage` is vulnerable to XSS (any injected script can read it); `httpOnly` cookies resist XSS but require CSRF protection. The Authorization: Bearer header pattern implies JS access, so you're trading XSS safety for simpler cross-origin behavior.

On the client side, you need to handle expiry gracefully — typically a silent refresh flow where the access token expires and the client uses the refresh token to get a new one without user interaction.

### Connection to What You Know

In OAuth 2.0, the access token is often a JWT — the resource server validates it locally using the authorization server's public key (fetched once from a JWKS endpoint), avoiding a round-trip to the auth server per request. This is the pattern behind services like Auth0 or Cognito issuing tokens your API validates without calling back home.
