---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## JWT Signing and Verification

JWTs let a server issue a tamper-proof claim ("this user is authenticated as user ID 42") that clients can carry around and present without the server needing to do a database lookup every time. The signing mechanism is what makes that tamper-proof part actually hold.

### The core mechanism

A JWT is three base64url-encoded segments joined by dots: `header.payload.signature`. The header and payload are just JSON — readable by anyone. The signature is what binds them together and makes mutation detectable.

**Symmetric signing (HMAC):** The server signs `base64(header) + "." + base64(payload)` using a shared secret and a hash function (e.g., HS256 = HMAC-SHA256). Verification means re-computing the signature with the same secret and checking it matches. Fast, simple — but every service that needs to verify must also hold the secret, meaning they could also *issue* tokens.

**Asymmetric signing (RSA/ECDSA):** The server signs with a private key; verifiers use the corresponding public key. A downstream service can verify a token's authenticity without being able to mint new ones. This is the right model when multiple services need to trust tokens they didn't issue.

The signature covers the exact bytes of header and payload. If anyone flips a single bit in the payload — changing `"role":"user"` to `"role":"admin"` — the signature no longer matches. Verification fails.

### Mental model

Think of it like a wax seal on a letter. Anyone can read the letter. The seal proves it came from you and hasn't been opened. Symmetric HMAC is like everyone on your team having a copy of your seal — useful internally. Asymmetric is like a notary stamp: anyone can verify it's legitimate, but only the notary can produce it.

### Practical scenarios

**Backend (auth service):** You issue JWTs on login using RS256 with your private key. You publish your public key at a `/.well-known/jwks.json` endpoint. Other microservices fetch that key and verify incoming tokens locally — no auth service round-trip on every request.

**Fullstack:** Your Next.js API routes receive a JWT in the `Authorization` header. Middleware verifies the signature before any handler runs. If the sig is invalid or the token is expired (the `exp` claim is part of the signed payload, so it can't be forged either), you reject early. The client-side never sees your signing key; it just stores the token and sends it.

**Key rotation gotcha:** When you rotate signing keys, old tokens signed with the previous key must still verify during the overlap window. JWKS endpoints handle this by publishing multiple keys — verifiers try each `kid` (key ID) in the token header to find the right one.

The `alg: none` vulnerability is worth knowing: some early libraries accepted unsigned tokens if the header claimed `"alg": "none"`. Always explicitly validate the algorithm against an allowlist, never trust whatever the token header says.
