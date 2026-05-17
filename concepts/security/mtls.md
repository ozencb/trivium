---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Mutual TLS (mTLS)

Standard TLS proves the server is who it claims to be — your browser trusts the bank's certificate. mTLS extends that handshake symmetrically: the server also demands a certificate from the client, so both sides cryptographically prove identity before exchanging a single byte of application data.

### The Mechanism

The standard TLS handshake adds one extra round-trip for mTLS: after the server sends its certificate, it sends a `CertificateRequest`. The client responds with its own certificate, then signs a digest of the handshake transcript with its private key. The server verifies that signature against the client certificate's public key. If either side can't verify the other, the handshake fails — no connection, no fallback.

What this gives you isn't authentication layered on top of an open channel — it's authentication *as* the channel. There's no separate login step, no bearer token to steal in transit, no session to hijack. The identity is baked into the transport.

### Concrete Mental Model

Think of it like two employees badging into a secure facility: the door (server) checks your badge, but you also check that the door is a real door and not someone running an access-control scam. Both parties present credentials to a shared authority (a Certificate Authority) that both trust.

In practice, each service gets a certificate signed by an internal CA. When Service A calls Service B, B rejects connections from anything that doesn't hold a cert from that CA. You don't need to embed API keys or tokens anywhere — the cert itself is the credential.

### Where This Shows Up

**Backend:** In microservice architectures, mTLS is the enforcement mechanism behind zero-trust networking. Instead of trusting calls that arrive inside your VPC, you verify every caller explicitly. If your `payment-service` gets compromised, it can't impersonate `auth-service` because it doesn't hold auth's private key.

**SRE:** Certificate rotation becomes your operational burden. Short-lived certs (24–72 hours) limit blast radius if a key leaks, but require reliable automated issuance (SPIFFE/SPIRE, Vault PKI, or a service mesh's built-in CA). A failed rotation that takes down inter-service communication at 3am is a classic mTLS war story — plan your rotation before you need it.

**DevOps:** Service meshes like Istio and Linkerd implement mTLS transparently via sidecar proxies, so your application code doesn't change. But "transparent" doesn't mean free — you need to reason about certificate issuance, CRL/OCSP revocation, and what happens when the control plane is temporarily unreachable.

### The Senior-Engineer Signal

Where this separates candidates in design discussions: knowing that mTLS doesn't solve authorization (a valid cert proves identity, not permission), and that certificate management complexity often makes API gateway + JWT the right call for external traffic. mTLS shines for internal east-west traffic at scale, not as a universal hammer.
