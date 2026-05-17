---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## DNS Resolution

DNS is a globally distributed, hierarchical lookup system that maps human-readable names to IP addresses. Without it, every application would need to hard-code IPs — brittle, unscalable, and incompatible with how the internet actually operates (IPs change, services move, CDNs serve different IPs per region).

### The Mechanism

DNS isn't one database — it's a tree of delegated authority. At the root are 13 root nameserver clusters. Below them are TLD nameservers (`.com`, `.io`, etc.). Below those are authoritative nameservers — the ones that actually hold records for your domain.

When you query `api.example.com`, the resolution chain works like this:

1. **Recursive resolver** (your ISP's server, or 8.8.8.8) checks its cache. Cache miss → escalate.
2. Ask a **root nameserver**: "Who handles `.com`?" → returns `.com` TLD nameserver addresses.
3. Ask the **TLD nameserver**: "Who handles `example.com`?" → returns `example.com`'s authoritative nameserver.
4. Ask the **authoritative nameserver**: "What's the A record for `api.example.com`?" → returns `203.0.113.42`.
5. Recursive resolver caches the answer (respecting TTL), returns it to the client.

Your OS also caches results. So the full round-trip typically only happens once per TTL window per resolver.

### Mental Model

Think of DNS like asking for directions in a city you don't know. You ask a central information desk (root), they point you to the right district office (TLD), which points you to the building manager (authoritative). Each step only knows its slice. The recursive resolver is doing all the legwork on your behalf.

### Practical Implications

**Backend**: When your service calls an external API by hostname, the first request pays the DNS lookup cost. Connection pooling + keep-alive amortize this — but cold starts (Lambda, containers) pay it fresh. Hardcoding IPs to "skip DNS" is a trap: it breaks when providers rotate IPs or when you need geo-routing.

**SRE**: TTL is your blast radius knob. Low TTL (30–60s) means fast failover but higher resolver load and more latency variance. High TTL means DNS changes propagate slowly — dangerous during incidents. Blue/green cutover strategy often hinges on getting TTL right *before* the deployment, not during.

**Frontend**: Browsers cache DNS per tab session, not just by TTL. `dns-prefetch` hints (`<link rel="dns-prefetch" href="//cdn.example.com">`) can shave 20–120ms off first-resource loads for third-party origins.

**Fullstack**: Service discovery in microservices often runs on DNS internally (Kubernetes uses CoreDNS for `service.namespace.svc.cluster.local`). Understanding TTL behavior explains why pod restarts sometimes cause transient connection errors — stale DNS cache pointing to the old pod IP.

### Key Invariant

DNS is eventually consistent by design. Changes propagate based on TTL expiry, not push. Assume stale data exists in the wild for up to the TTL duration after any record change — your deployment and rollback strategies should account for this.
