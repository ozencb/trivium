---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## TLS Handshake

TLS Handshake is the negotiation phase before any encrypted data flows — both parties agree on a cipher suite, authenticate the server (and optionally the client), and derive a shared symmetric key without ever transmitting it over the wire.

### The Core Mechanism

The handshake solves a bootstrapping problem: you need a shared secret to encrypt, but you can't share the secret securely without already having encryption. TLS solves this with asymmetric crypto *only for the handshake*, then switches to symmetric crypto for the actual data.

In TLS 1.3 (the current standard), the flow is:

1. **ClientHello** — client sends supported cipher suites and a key share (its half of a Diffie-Hellman exchange)
2. **ServerHello** — server picks the cipher suite, sends its DH key share and its certificate
3. **Both sides independently derive the same session key** from the DH exchange — no key was ever transmitted
4. **Server sends Finished** (encrypted with the derived key, proving it has the right key)
5. **Client verifies the cert** against trusted CAs, sends its own Finished
6. Symmetric encryption begins

TLS 1.2 needed 2 round trips; TLS 1.3 needs 1 (and supports 0-RTT resumption for reconnects, with caveats around replay attacks).

### Mental Model

Think of DH key exchange like mixing paint: you and the server each have a private color, you exchange a public base color, each mixes their private color in, and you both end up with the same final color — but an observer only ever sees the base and the mixed intermediate, never the private component.

The certificate is separate from the key exchange — it's the server proving *who it is*, not how you'll communicate secretly.

### Practical Scenarios

**Backend:** When your service calls a third-party API over HTTPS, a handshake happens per connection (or per connection pool entry). High-frequency service-to-service calls benefit heavily from connection reuse — a new handshake adds ~1 RTT of latency. This is why HTTP keep-alive and connection pooling matter more than most engineers realize.

**SRE:** TLS termination usually happens at the load balancer, which means traffic *inside* your cluster may be unencrypted unless you've set up mTLS (which builds directly on this). Certificate expiry is a classic incident cause — the handshake fails with a hard error the moment a cert expires, taking down services immediately.

**Fullstack:** Browser devtools show TLS version and cipher suite in the Security tab. If users report intermittent connection failures, a mismatch in supported TLS versions (e.g., an old client trying TLS 1.0 against a server that dropped support) will manifest as a handshake failure before any HTTP traffic, which looks like a network error rather than an application error.

### What This Unlocks

Once you have the handshake model, mTLS is just "now the client also presents a certificate in step 5" — mutual authentication instead of one-way. Certificate pinning is "the client rejects the cert unless it matches a known fingerprint, bypassing normal CA trust."
