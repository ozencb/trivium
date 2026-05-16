---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## CDN Routing

CDN routing is the set of mechanisms that determine *which edge node* handles a given user's request. Getting this wrong means users hit a server 8,000 miles away instead of one 30 miles away, defeating the entire point of a CDN.

### Core Mechanism

There are two dominant approaches, and most CDNs blend them:

**Anycast routing**: Multiple edge nodes are assigned the *same IP address*. When a user's packet hits the internet, BGP—the protocol that routes traffic between autonomous systems—naturally steers it toward the "closest" node in terms of network hops and peering agreements. No application-level logic required; the network fabric does the work. This is how Cloudflare and Google's CDN operate.

**DNS-based (GeoDNS) routing**: The CDN's authoritative nameserver returns *different A records* depending on where the DNS query originates. When your resolver asks "what's the IP for cdn.example.com?", the CDN's DNS sees the resolver's IP, maps it to a geographic region, and returns the IP of the nearest PoP. Akamai and AWS CloudFront lean heavily on this.

A critical subtlety with GeoDNS: the CDN sees the *resolver's* IP, not the user's. A user in Tokyo using Google's 8.8.8.8 resolver (which may resolve from a US data center) can get routed to a US edge node. This is why CDNs also look at EDNS Client Subnet (ECS)—a DNS extension that includes a prefix of the *client's* actual IP—when resolvers send it.

### Mental Model

Think of anycast like a post office network where every branch has the same address. Mail gets delivered to whichever branch your carrier can reach fastest. GeoDNS is more like a smart receptionist who answers the phone, hears your area code, and transfers you to the nearest branch—but she's guessing your location from your phone number, not your actual GPS.

### Practical Scenarios

**Backend**: If you're building an API with global users, you're essentially choosing between Anycast (simpler, more reliable routing, no TTL games) and GeoDNS (more control, easier to implement health-check-based failover per region). When a PoP goes down, Anycast failover is implicit via BGP withdrawal; GeoDNS failover requires your CDN's health check system to update DNS records quickly—during which the TTL governs how stale routes persist.

**SRE**: Routing directly affects incident blast radius. A misconfigured BGP announcement or a bad GeoDNS health-check can silently drain traffic away from healthy nodes or flood an overloaded one. Understanding which routing method your CDN uses tells you *where to look* when traffic distribution looks wrong in your dashboards.

**Fullstack**: Cache hit rates are routing-dependent. If your users in Southeast Asia get routed to a US edge due to a GeoDNS misconfiguration, they'll also miss the warm cache on the correct regional PoP—you'll see latency spikes *and* elevated origin load simultaneously, which is confusing until you trace it to routing.

Once you understand how requests reach an edge node, CDN cache invalidation (purging) and edge cache behavior make much more sense—they're all scoped per-PoP.
