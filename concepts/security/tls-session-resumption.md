---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## TLS Session Resumption

A full TLS handshake costs two round trips before any application data flows—expensive for latency-sensitive services and high-connection-rate scenarios. Session resumption lets a client that already negotiated a session skip most of that work on subsequent connections, cutting it to one round trip (or zero with TLS 1.3 0-RTT).

### How it actually works

There are two mechanisms, and they have meaningfully different operational properties:

**Session IDs** (older, TLS 1.2): The server stores the negotiated session state in memory and hands the client an opaque ID. On reconnect, the client presents the ID; if the server still has it cached, they skip key exchange and go straight to application data. The catch: the state lives on the server, so it doesn't survive restarts and doesn't work across a cluster without sticky sessions or a shared session cache (Redis, Memcached).

**Session Tickets** (RFC 5077): The server encrypts the session state using a private ticket encryption key and sends the blob to the client. The client stores it and presents it on reconnect. The server decrypts it, verifies it, and resumes. No server-side state—scales horizontally naturally. The catch: all servers in a cluster must share the ticket encryption key, and key rotation coordination becomes a real operational concern.

**TLS 1.3** replaces both with PSK (Pre-Shared Key) resumption and adds optional 0-RTT data, where the client can send application data in its very first flight before the server responds.

### Mental model

Think of session tickets like a signed JWT for your TLS session: the server issues it, the client holds it, and any server with the signing key can validate it without phoning home.

### Where this bites you in practice

**Backend:** If you're running multiple instances behind a load balancer and using session IDs, you need either sticky sessions (fragile) or a shared session store. Session tickets eliminate this, but now you have a shared secret (the ticket key) that must be distributed, rotated, and protected—it's effectively a long-lived credential for past sessions.

**SRE:** Ticket key rotation has a subtle failure mode: if you rotate too aggressively, clients with tickets encrypted under the old key will fall back to full handshakes (graceful degradation, not breakage, but spikes your handshake rate). Track your session resumption rate in metrics—a sudden drop is often a canary for a misconfigured rotation or a certificate change that invalidated existing tickets.

**0-RTT in TLS 1.3:** Tempting for performance, dangerous for non-idempotent endpoints. Early data has no replay protection—an attacker can retransmit it. Most CDNs disable 0-RTT for anything except safe HTTP methods, or strip it at the edge. Don't enable it on endpoints that mutate state without understanding this.

The one thing people miss: resumed sessions don't re-validate the server certificate. If a cert is revoked after a ticket is issued, clients with valid tickets will keep connecting successfully until the ticket expires.
