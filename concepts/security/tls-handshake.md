---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## TLS Handshake

TLS solves two problems at once: **confidentiality** (traffic is encrypted) and **authenticity** (you're talking to who you think you are). The handshake is the negotiation that establishes both before a single byte of application data flows.

### Core Mechanism

The naive approach — encrypt with the server's public key — doesn't work for ongoing communication: asymmetric crypto is too slow and lacks forward secrecy. Instead, TLS uses the handshake to bootstrap a short-lived **symmetric session key** that both sides derive independently.

In TLS 1.3 (the modern baseline):

1. **Client Hello** — client sends supported cipher suites and a Diffie-Hellman public key share
2. **Server Hello** — server responds with its DH key share and its certificate (containing its public key, signed by a CA)
3. **Key derivation** — both sides independently compute the same shared secret via DH math. The secret was never transmitted.
4. **Finished messages** — each side sends a MAC over the entire handshake transcript, proving they hold the expected keys and haven't been tampered with
5. Application data flows, encrypted with AES-GCM or ChaCha20

The DH key shares are **ephemeral** (ECDHE) — generated fresh per session. This gives you **forward secrecy**: compromising the server's long-term private key later doesn't decrypt past sessions, because those session keys are gone.

Certificate verification is separate: the client walks the certificate chain up to a trusted root CA. This answers "is this really api.stripe.com?" — the server proves identity by signing handshake data with the private key corresponding to the cert's public key.

### Mental Model

Think of it as establishing a shared secret by each throwing colored paint into a public bucket — anyone watching sees the colors, but deriving the final mixed color requires information only each side holds privately. The certificate is the identity badge that proves the person holding the bucket is actually Stripe.

### Practical Implications

**Backend**: Most TLS failures (`CERTIFICATE_VERIFY_FAILED`, hostname mismatch) happen because the certificate chain validation broke, not encryption. Common culprits: missing intermediate certs, system CA bundle not updated in containers, clock skew causing cert to appear expired.

**SRE**: TLS termination at the load balancer vs. end-to-end is an architectural tradeoff. Terminating at the LB means internal traffic is plaintext — fine on a trusted internal network, but a compliance blocker for PCI-DSS or HIPAA. Also: TLS 1.3 saves one full round-trip versus 1.2, which matters at scale or on mobile.

**Fullstack**: HSTS, cert pinning, mixed content errors — all stem from this layer. When you see a mysterious CORS failure, check whether the preflight is hitting a cert error first; browsers report them identically.

The conceptual jump from here to **mutual TLS** is small: the client also presents a certificate, and the server verifies it. Same mechanism, both directions.
