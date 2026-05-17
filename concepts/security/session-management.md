---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Session Management

HTTP is stateless — each request arrives with no memory of prior ones. Session management is the layer that imposes identity continuity across those requests, so "logged in as Alice" persists from one click to the next.

### The two fundamental approaches

**Server-side sessions**: On login, the server generates a random session ID, stores state (user ID, roles, expiry) in a backend store (Redis, DB), and hands the client an opaque cookie containing only that ID. Every subsequent request looks up the ID in the store to reconstruct identity.

**Signed client tokens (JWT et al.)**: The server encodes state directly into a token, signs it cryptographically, and sends it to the client. No server-side store needed — on each request the server just verifies the signature and reads the payload.

### The tradeoffs that actually matter

**Revocation** is where JWTs bite people. Because the token is self-contained and stateless, you can't invalidate it before expiry without reintroducing a server-side store (a token blocklist) — which erases the scalability benefit. Server-side sessions revoke instantly: delete the session record and the user is logged out everywhere immediately. For anything with security sensitivity (admin panels, financial operations, "log out all devices"), this matters.

**Scalability** cuts the other way. Server-side sessions require either sticky sessions (routing a user's requests to the same server that holds their session, which limits horizontal scaling) or a shared external store like Redis. JWTs let any instance validate a request independently — no coordination needed. This is why JWTs are popular in microservices and API-heavy architectures.

**Token size**: JWTs grow with every claim you embed. Sending 2KB of token on every request adds up at scale; session IDs are 32 bytes.

### Concrete mental model

Think of it like a coat check. Server-side sessions: the coat check holds your coat (state), gives you a ticket (ID). JWT: they photograph your coat, seal it in an envelope you carry, and verify it's real by checking the official stamp each time. The coat check can always say "sorry, that ticket is no longer valid." The envelope system can't — once stamped, it's valid until it expires.

### Practical scenarios

**Backend (API server)**: If you're building an internal tool or anything requiring instant revocation (compromised accounts, permission changes), use server-side sessions backed by Redis. The shared store is worth the ops overhead.

**Fullstack (SPA + API)**: JWTs are tempting because they work across origins without cookie friction. Use short-lived access tokens (15 min) plus a longer-lived refresh token stored in an `HttpOnly` cookie. The refresh token is server-side revocable; the access token is stateless but expires quickly enough to limit the blast radius of a leak.

The most common mistake: issuing long-lived JWTs (days/weeks) because "they're stateless and easy," then realizing there's no way to log users out when an account is compromised.
