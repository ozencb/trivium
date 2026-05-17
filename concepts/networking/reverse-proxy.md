---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Reverse Proxy

A reverse proxy is an intermediary that clients talk to *instead of* your backends — the client has no knowledge of, or connection to, the actual origin servers. Unlike a forward proxy (which acts on behalf of clients to reach servers), a reverse proxy acts on behalf of servers to handle clients.

### Core Mechanism

The key invariant: the client terminates its TCP/TLS connection at the proxy, not the backend. The proxy then opens a *separate* connection to the backend. This connection boundary is what enables every feature a reverse proxy offers:

- **TLS termination** — the proxy holds the certificate and handles the handshake. Backends receive plain HTTP internally, decoupling cert management from application deployment.
- **Request routing** — because the proxy reads the decrypted request, it can route on Host header, URL path, cookies, or any request attribute.
- **Connection pooling** — the proxy can maintain persistent upstream connections to backends, amortizing TCP handshake cost across many client requests.
- **Buffering** — slow clients don't hold upstream resources. The proxy buffers the full request before forwarding, so backends process at full speed.

### Mental Model

Think of it as a receptionist at a large office. Visitors (clients) interact only with the receptionist, who decides which employee (backend) to route them to. The visitor never learns the internal office layout, and the company can reorganize internally — hire, fire, move employees — without changing how visitors interact with the front desk.

### Practical Scenarios

**Backend:** You're deploying a new version of a service. With a reverse proxy, you can route 5% of traffic to v2 by path prefix or header, leaving v1 handling the rest — without touching client configuration. When something breaks, rollback is a config change, not a DNS update.

**SRE:** Header-based routing lets you implement canary deployments and dark launches at the infrastructure layer rather than in application code. The proxy also gives you a single chokepoint for rate limiting, circuit breaking, and observability — you get request metrics for every service without instrumenting each one.

**DevOps:** TLS termination at the proxy means your internal PKI complexity drops dramatically. Services communicate over plaintext on a trusted network segment; you only manage certificates in one place. This also makes mTLS adoption incremental — you can enforce it at the proxy boundary without requiring every service to implement it.

### The Invariant Worth Internalizing

Because the proxy is a separate hop, it adds latency (typically sub-millisecond on local network, but nonzero). More importantly, it becomes a single point of failure if not deployed redundantly. Every feature a reverse proxy gives you — routing, caching, auth offload — comes with the tradeoff that the proxy must be as reliable as the most critical service behind it.

This model extends directly to API Gateways, which are essentially reverse proxies with authentication, rate limiting, and developer-portal features bolted on.
