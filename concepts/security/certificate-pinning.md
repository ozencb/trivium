---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Certificate Pinning

Normal TLS trusts any certificate signed by any CA in the system trust store — which means a compromised or rogue CA can issue a valid certificate for your domain that clients will happily accept. Certificate pinning sidesteps this by hardcoding the expected fingerprint directly in the client, so even a legitimately-signed cert gets rejected if it doesn't match what you expected.

### The Core Mechanism

During the TLS handshake, after the server presents its certificate chain, the client performs an additional check: it computes a hash of the certificate (or its public key) and compares it against a hardcoded set of pins. If nothing matches, the connection is aborted — regardless of whether the cert is otherwise valid.

There are two levels you can pin at:

- **Leaf certificate pinning**: pin the exact certificate. Simple, but breaks as soon as the cert rotates.
- **Public key pinning (SPKI)**: pin the public key's hash (Subject Public Key Info). More practical — you can renew the cert with the same key pair and the pin stays valid. This is what most production implementations use.

You typically ship a primary pin plus one or two backup pins (for a different key you hold in reserve), giving yourself a rotation path without an outage.

### Concrete Mental Model

Imagine your mobile banking app talks to `api.bank.com`. A corporate proxy intercepts the connection and presents a cert signed by the company's internal CA — which the OS trusts. Without pinning, the connection succeeds and traffic is readable by the proxy. With pinning, the app checks the public key hash, finds it doesn't match the bank's actual key, and drops the connection. The app doesn't care that the cert is technically valid; it only cares that it came from the right key.

### Where This Matters in Practice

**Backend:** Most relevant for high-value internal service-to-service calls or integrations with third-party financial/payment APIs where MITM is a meaningful threat model. If you're building an internal SDK that wraps an external API, pinning in that SDK hardens it against CA compromises you can't control.

**SRE:** This is where pinning becomes a liability. Key rotation turns into a coordinated deployment — the client binary must ship with new pins before the server rotates, or clients break. Let's Encrypt's 90-day cert cycles are incompatible with naive cert pinning unless you're using SPKI pinning with the same key. Stale pins cause silent outages; apps that can't be force-updated are especially risky. HPKP (the HTTP header-based version) was deprecated in Chrome in 2018 specifically because sites pinned incorrectly and locked themselves out.

### What Seniors Know That Juniors Don't

The question isn't whether pinning is secure — it clearly is. It's whether the operational overhead is justified for your threat model. Most services are better served by Certificate Transparency monitoring (which detects rogue certs after issuance) combined with short-lived certs, rather than pinning. Reserve pinning for mobile apps or native clients with controlled update cycles, where you genuinely can't tolerate CA-level compromise and can manage the rotation discipline it demands.
