---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## OAuth 2.0

OAuth 2.0 solves a specific trust problem: how do you let a third-party app act on a user's behalf without the user handing over their password? The answer is a structured delegation flow where an authorization server issues scoped, short-lived tokens after verifying user consent.

### The Core Mechanism

Four actors, always: the **resource owner** (user), the **client** (your app), the **authorization server** (the IdP—Google, GitHub, etc.), and the **resource server** (the API holding the data).

The authorization code flow (the one you should use) works like this:

1. Client redirects the user to the authorization server with a `client_id`, requested `scopes`, and a `redirect_uri`.
2. User authenticates and consents. Authorization server issues a short-lived **authorization code** and redirects back to the client.
3. Client exchanges that code for an **access token** (and optionally a **refresh token**) via a back-channel server-to-server POST—never through the browser.

The critical invariant: the access token is never visible to the browser during issuance. The authorization code is single-use and expires in seconds. This is why the flow uses two legs instead of one.

### Mental Model

Think of it like a valet key. The resource owner (you) gives the valet (third-party app) a key that only opens specific doors (scopes), can't start the car past a certain time (expiry), and was issued by the manufacturer (authorization server)—not cut from your master key.

### Practical Angles

**Backend:** When your service consumes a third-party API (Stripe, Slack, GitHub), you're the client. Store refresh tokens encrypted at rest, never in logs. Rotate access tokens aggressively—if one leaks, its blast radius is bounded by expiry and scope.

**Fullstack:** SPAs and mobile apps can't keep a `client_secret` secret, so they use PKCE (Proof Key for Code Exchange)—a code verifier/challenge pair that binds the authorization request to the token exchange without a shared secret. Never use the implicit flow (tokens returned in URL fragments); it was deprecated for good reason—tokens end up in browser history and server logs.

### Where Engineers Trip Up

- **Storing access tokens in `localStorage`**: XSS can exfiltrate them. Prefer `httpOnly` cookies with a short-lived session or BFF pattern.
- **Missing state parameter**: Without a random `state` param validated on redirect, the flow is vulnerable to CSRF.
- **Conflating OAuth with authentication**: OAuth proves *authorization*, not identity. If you need to know *who* the user is, you need OpenID Connect on top of it—which adds an `id_token` (a JWT) to the response.

Understanding where the authorization code ends and the token begins—and why the back-channel exchange exists—is what separates engineers who use OAuth from those who can design systems that depend on it correctly.
