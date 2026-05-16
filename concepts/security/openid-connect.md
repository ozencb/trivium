---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**OpenID Connect (OIDC)** is an identity layer built on top of OAuth 2.0 that answers the question OAuth intentionally left unanswered: *who is this user?* OAuth tells you what a token is authorized to do; OIDC tells you who the token belongs to.

## The Core Mechanism

OAuth 2.0 gives you an access token, but that token is opaque by design — it's a credential for resource access, not a user identity assertion. OIDC extends the OAuth flow by adding an **ID token**: a signed JWT containing verified claims about the authenticated user (`sub`, `email`, `name`, `iss`, `aud`, `exp`, etc.).

The key addition to the OAuth flow is the `openid` scope. When your client requests this scope, the authorization server returns *both* an access token and an ID token. The ID token is signed with the provider's private key, so you can verify it without a round-trip — you fetch the provider's JWKS endpoint once, cache the public keys, and verify locally from then on.

OIDC also standardizes a **UserInfo endpoint** (`/userinfo`) that accepts the access token and returns additional user claims. This is useful when the ID token is kept small and you need supplemental profile data.

## Concrete Mental Model

Think of OAuth like a valet key — it grants limited access to a specific resource. OIDC is the valet key *plus a driver's license*: you know both what the key can do and who it belongs to.

The ID token is that license. It's issued by the authorization server, cryptographically signed, and carries enough information for your app to establish a session without asking the user to log in again.

## Practical Scenarios

**Backend:** You're building an API that accepts requests from a mobile app using Google Sign-In. The app sends an ID token in the `Authorization` header. Your server fetches Google's JWKS, verifies the token signature and `aud` claim (to confirm the token was issued for *your* app), extracts the `sub` as a stable user identifier, and either creates or fetches the user record. No session needed on the API side — stateless authentication with verified identity.

**Fullstack:** You're implementing SSO across multiple internal tools using a self-hosted provider (Keycloak, Auth0, etc.). Each app initiates the OIDC authorization code flow. After the redirect, you exchange the code for tokens, validate the ID token, and hydrate the session. Because all apps trust the same issuer, a user logged into Tool A doesn't re-authenticate for Tool B — the provider issues a new ID token silently if a valid session exists. This is **Single Sign-On**, and OIDC is the mechanism that makes it work reliably across different origins and tech stacks.

The main thing to internalize: OIDC is not a separate protocol — it's OAuth 2.0 with a defined identity contract layered on top. If you already understand OAuth flows and JWT verification, OIDC is just the standardized answer to "okay, but *who* authorized this?"
