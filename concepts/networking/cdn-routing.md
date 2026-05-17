---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## CDN Routing

CDN routing is the infrastructure that decides *which* edge node answers a user's request before any content is even considered. Getting this selection wrong means all the caching in the world doesn't help—users in Singapore are hitting a node in Frankfurt.

### The Two Core Mechanisms

**Anycast** is the cleaner approach: dozens of edge nodes worldwide advertise the *same* IP address via BGP. The internet's routing layer does the work—packets naturally flow toward the topologically nearest node based on AS path lengths. No application involvement. The tradeoff is that "nearest" means nearest *by BGP hops*, not geography. A user 200km away might route through a longer AS path than one 800km away depending on peering agreements.

**DNS-based routing** is more explicit: the CDN's authoritative nameserver inspects the resolver IP on each query and returns an A record pointing to the nearest cluster. The critical nuance here is that it sees your *resolver's* IP, not your client's. A user in Tokyo using `8.8.8.8` might get routed to a U.S. cluster because Google's resolver is resolving from a U.S. datacenter. This is why "why am I hitting the wrong POP?" is such a common CDN debugging headache—check what resolver the client is using first.

Most production CDNs layer both: anycast steers traffic to the right regional cluster at the IP level, then DNS fine-tunes within it.

### Mental Model

Think of anycast like taxi dispatch where every cab has the same phone number—you always connect to whoever's closest. DNS routing is like a dispatcher who asks your zip code before assigning a driver. One is implicit and automatic; the other gives you more control but adds a lookup step.

### Where This Actually Matters

**Backend:** Your origin sees requests from a small set of edge POP IPs, not the full internet. This means connection pooling to origin is bounded and predictable—but it also means a single misbehaving POP can hammer your origin in ways that look like a traffic spike from one IP block.

**SRE:** Failover behavior differs sharply between the two mechanisms. Anycast failover is fast—BGP withdraws the route and traffic shifts in seconds. DNS-based failover is TTL-bounded; if you set a 5-minute TTL for performance, you have a 5-minute blast radius when a node goes down. The common pattern is short TTLs (30–60s) on CDN DNS records specifically to keep failover windows small.

**Fullstack:** When investigating latency regressions or cache miss spikes, the first question is "which POP is this user hitting and why?" Tools like `dig +short` against the CDN's nameserver, or checking `X-Cache` / `CF-Ray` response headers, tell you immediately. A sudden reroute to a cold POP after a network event explains a lot of "the site is slow in region X" tickets.

The consistency complexity—handling cache state across nodes after routing shifts—is why cache purging and edge caching are downstream problems from routing.
