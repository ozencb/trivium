---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## JWT-Based Authentication

The core trade-off: instead of the server maintaining a session store that maps `sessionId → user`, the server mints a self-contained token that *is* the session. Any service that knows the secret (or has the public key) can validate it without a database round-trip.

**The mechanism**

A JWT is three base64url-encoded segments: header (algorithm), payload (claims), and signature. The signature covers the first two segments — so a client can read the payload freely, but cannot alter it without invalidating the signature. When the server receives a request, it re-derives the signature and compares; if it matches and `exp` hasn't passed, the token is trusted.

This is why "stateless" matters: you can scale horizontally to 50 servers with zero shared state. Each server independently validates. No Redis session store, no sticky sessions.

**Where it breaks down**

Revocation is the honest cost. A valid token *is* valid until expiry — you can't "un-sign" one. The practical workarounds are: short-lived access tokens (15 minutes) paired with a refresh token flow, or a token blocklist (which re-introduces server state for the revoked set). Neither is free.

The other pitfall: `alg: none` attacks and algorithm confusion. If your library accepts the algorithm field from the token itself, an attacker can forge tokens. Always specify the expected algorithm server-side, never trust the header's `alg`.

**Mental model**

Think of a JWT like a notarized document. Anyone can read it, anyone with the notary's stamp can verify it's authentic, but you can't revoke a notarization — you can only wait for it to expire. The notary (auth server) doesn't need to be present for verification.

**Practical scenarios**

*Backend services:* JWT shines in microservice architectures. The auth service issues a token; downstream services (orders, inventory, notifications) each validate it independently with a shared public key. No inter-service session lookups.

*Fullstack apps:* The typical pattern is an `/auth/login` endpoint returns `{ accessToken, refreshToken }`. The client stores the access token in memory (not localStorage — XSS risk) and the refresh token in an `httpOnly` cookie. On 401, the client silently hits `/auth/refresh` to rotate. The access token's short TTL limits blast radius if it leaks.

**When to reach for it vs. not**

Reach for it when you need stateless validation across multiple services or when you're building an API consumed by third parties. Avoid it when you need instant revocation (financial sessions, "log out all devices") — opaque session tokens with a fast lookup (Redis) handle that better. The two aren't mutually exclusive: use JWTs for service-to-service auth, server-side sessions for user-facing auth where revocation matters.
