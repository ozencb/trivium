---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## API Keys

API keys are long-lived, opaque credential strings that identify *who is calling your API*—not who the end user is. They exist because OAuth flows, while powerful, are overkill when you need machine-to-machine auth: no browser, no user delegation, no refresh token dance. An API key is just a shared secret: the client sends it, you look it up, you trust the request.

### The Core Mechanism

Under the hood, an API key is typically a cryptographically random string (32–64 bytes, base64url-encoded) stored hashed on the server—same principle as passwords. When issued, the plaintext is shown *once*. When a request arrives, you hash the incoming key and compare against stored hashes. This means if your database is leaked, the raw keys aren't exposed.

The key itself carries no information—it's just a lookup handle to a row that stores: owner, scopes/permissions, rate limits, expiry (if any), and last-used timestamp. The opaque design is intentional: JWTs embed claims but can't be easily revoked; API keys point to a mutable server-side record, so you can revoke or scope them without coordination.

### Mental Model

Think of it like a hotel key card. The card itself is meaningless plastic—it just maps to a room assignment in the hotel's system. The hotel can deactivate it instantly without changing your lock or reissuing every card. That's your server-side API key record.

### Practical Patterns

**Backend (service-to-service):** You're building a data pipeline that calls a third-party enrichment API. You embed their API key in your environment config (never in code) and send it as `Authorization: Bearer sk_live_...` or `X-API-Key: ...`. The third party rate-limits by key, bills by key, and lets you rotate keys without changing your OAuth flow. When you do rotate, you create the new key, deploy with both, confirm the old is unused, then delete it—zero downtime rotation.

**Fullstack:** Your frontend should *never* hold an API key for a privileged backend service—those requests go through your own backend, which holds the key server-side. But you might issue *your own* API keys to paying users who want programmatic access to your product. This is common in developer-facing SaaS: Stripe, OpenAI, GitHub all do this. You generate a user-scoped key, store it hashed, and let users rotate or revoke it from a dashboard.

### What Goes Wrong

- **Leaking into git**: Keys embedded in source code are indexed by bots within minutes of a public push. Use environment variables, secret managers, or `.env` files excluded from version control.
- **Over-permissioned keys**: One key with full access is a single point of failure. Issue narrow-scoped keys (read-only, write-only, specific endpoints) so a leak's blast radius is bounded.
- **No rotation policy**: Long-lived keys are a liability. Enforce expiry or at least track last-used; keys unused for 90 days should be candidates for deletion.

Once you're managing many keys and want to layer on per-key rate limiting, that stored key record becomes the natural bucket for tracking request counts—which is exactly how rate limiting builds on top of this.
