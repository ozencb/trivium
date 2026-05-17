---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## OpenID Connect

OAuth 2.0 solves authorization ("can this app access this resource?") but says nothing about who the user is. OIDC fills that gap by standardizing an **ID token**—a signed JWT containing user identity claims—so your app can authenticate users via a trusted third party without managing passwords or building a user store from scratch.

### Core Mechanism

OIDC adds one key thing to the OAuth 2.0 Authorization Code flow: the token endpoint returns an `id_token` alongside the `access_token`. This ID token is a JWT signed by the identity provider (IdP), containing claims like `sub` (stable user ID), `email`, `name`, and `aud` (your client ID). You verify the signature using the IdP's public keys (fetched from `/.well-known/jwks.json`) and trust the claims.

The critical distinction: the `access_token` is for calling APIs on behalf of the user; the `id_token` is for establishing who the user is in your system. Mixing these up is a common mistake—never use an `access_token` as proof of identity.

### Mental Model

Think of OIDC as a notarized letter. OAuth hands you a key card (access token) to enter rooms. OIDC hands you a passport (ID token) that says who you are, issued and cryptographically signed by a trusted authority. Your app validates the passport locally—no need to call the IdP on every request.

### Practical Scenarios

**Backend:** When building a service that accepts logins via Google, GitHub, or an enterprise SSO (Okta, Azure AD), you receive the authorization code, exchange it for tokens, validate the `id_token`'s signature and claims (`iss`, `aud`, `exp`), then upsert the user into your database using `sub` as the stable key. Never use `email` as the primary key—users can change emails, and some IdPs reuse them.

**Fullstack:** In a Next.js or similar app, libraries like `next-auth` handle the OIDC flow for you, but understanding what's underneath matters when things break. When a user hits a protected route, the app checks the session (typically a server-side cookie wrapping the ID token claims), and your API routes trust the session rather than re-validating the JWT on every call. Where it gets interesting: handling token refresh, logout propagation (OIDC's front-channel/back-channel logout specs), and what "session expiry" means when your IdP's token and your app's session have different lifetimes.

### Where This Differentiates You

In design discussions, the senior move is knowing when *not* to reach for OIDC—if you're building internal service-to-service auth, you want OAuth client credentials, not OIDC. And when you do use OIDC, understanding the security surface (token leakage, `nonce` replay protection, PKCE for public clients) separates engineers who wire up a library from those who can reason about the trust model.
