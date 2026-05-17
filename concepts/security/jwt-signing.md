---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## JWT Signing and Verification

A JWT isn't encrypted by default — it's *signed*. The signing step is what makes it tamper-evident: anyone can decode the payload, but only the holder of the right key can produce a valid signature. Verification proves the token wasn't modified since issuance.

### The Mechanism

A JWT is three base64url-encoded segments: header, payload, signature. The signature is computed over `header.payload` using a secret or private key. On verification, the receiver recomputes the signature and checks it matches — if the payload was altered by even one byte, the signatures diverge.

Two algorithm families dominate:

**HS256 (HMAC-SHA256)** — symmetric. One secret is shared between the issuer and every verifier. Fast, simple. The problem: every service that needs to *verify* tokens must also possess the secret, which means every service could *issue* tokens. In a breach, your blast radius includes all holders of that secret.

**RS256 (RSA-SHA256)** — asymmetric. The auth service signs with a private key; everyone else verifies with the public key. Services that only need to validate tokens never touch the private key. This is the right default in any multi-service architecture.

### Mental Model

Think of HS256 as a shared wax seal — anyone with the stamp can forge a letter. RS256 is a notarized signature — only the notary can sign, but any court can verify.

### Concrete Scenarios

**Backend (API gateway / microservices):** Your auth service issues RS256 tokens. Each downstream service fetches the public key from a JWKS endpoint (e.g., `/.well-known/jwks.json`) and validates tokens locally without a network call to the auth service. Key rotation becomes operationally safe: publish a new keypair, keep the old public key available briefly, and services pick up the new key on next fetch. With HS256, rotation requires coordinating secret updates across every service simultaneously.

**Fullstack (BFF or monolith):** HS256 is often fine here — your server both issues and verifies tokens, so there's only one secret holder. Just don't leak it to the client (the frontend never needs it) and rotate it in your secret manager, not in code.

### Common Pitfalls

- **`alg: none` attacks** — always explicitly allowlist algorithms on verification; never accept whatever algorithm the token header claims.
- **Trusting `iss` without validating the key source** — fetch JWKS from a URL you control or hardcode; don't let a token tell you where to fetch verification keys.
- **Not checking `exp`** — a valid signature doesn't mean the token is current. Always validate expiration.
- **Storing sensitive data in the payload** — it's base64, not encrypted. Anyone with the token can read the claims.

RS256 is the safer default for anything beyond a single-process app. The key rotation story alone is worth the marginal complexity.
