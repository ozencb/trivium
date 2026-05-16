---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## DNS Resolution

DNS is a distributed system that maps human-readable names (like `api.stripe.com`) to IP addresses that machines can route to. Without it, every application would need to hardcode IPs or maintain its own address book — and since IPs change, that would break constantly.

### The Core Mechanism

DNS is not a single server — it's a hierarchy of authoritative sources queried in sequence. When your code does `getaddrinfo("api.stripe.com")`, here's what actually happens:

1. **Recursive resolver** (usually your ISP or a configured one like 8.8.8.8) takes the request.
2. It asks a **root nameserver** who's authoritative for `.com`.
3. It asks the `.com` TLD server who's authoritative for `stripe.com`.
4. It asks **Stripe's authoritative nameserver** for `api.stripe.com`.
5. The resolver returns the IP to your process and caches it for the TTL duration.

Each layer only knows about its own subtree — root knows TLDs, TLD knows domains, authoritative servers know specific records. This is why DNS scales globally without any single choke point.

### Mental Model

Think of it like phone directory assistance, but delegated by country → city → business. No one directory knows everything; each hands you off to a more specific authority until you reach someone who actually has the answer.

### Practical Implications by Role

**Backend:** Every outbound HTTP call to another service starts with DNS. If you're hitting a database, cache, or external API, DNS resolution adds latency on the first call (before the TTL cache warms up). Reusing connections matters here — not just for TCP overhead, but to avoid repeated DNS lookups. Short TTLs (common in dynamic environments) make this worse.

**SRE:** TTL is your blast radius knob during incidents. High TTL = fast cached lookups, but slow propagation when you failover. Low TTL = fast failover, but amplified resolver load. Blue/green and canary deployments often use weighted DNS records or swap CNAMEs, both of which require understanding TTL lag. You'll also debug split-horizon DNS (same name resolves differently inside vs. outside the cluster) constantly.

**Frontend:** Browser DNS caches are separate from OS caches and have their own (often shorter) TTLs. Preconnect hints (`<link rel="preconnect">`) and DNS prefetch (`dns-prefetch`) exist specifically to pay the resolution cost before the user triggers the request. Third-party scripts introduce their own DNS lookups — a page hitting 20 different origins has 20 separate resolution chains.

**Fullstack:** Service-to-service calls in a monorepo-to-microservices migration often break because developers hardcode `localhost` or assume names resolve the same in dev and prod. DNS is the contract between your deployment infrastructure and your code — get comfortable reading `/etc/hosts`, `resolv.conf`, and your platform's service discovery layer.
