---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## CDN Cache Purging

CDN cache purging is the mechanism to forcibly evict cached content from edge nodes before TTL expires. You need it because TTL-based expiration is a blunt instrument — you can't wait 24 hours for users to stop seeing stale content after a hotfix.

### Core Mechanism

When you push a purge request (via the CDN's API or dashboard), the provider propagates an invalidation signal to edge nodes. Each node marks the matching cached object as stale. The next inbound request for that resource misses the cache and pulls fresh content from origin, which then gets re-cached.

The key subtlety: purge propagation is **eventually consistent**, not instant. Depending on the CDN, edge nodes across all PoPs might take seconds to a few minutes to acknowledge the invalidation. During that window, some users still get stale content. Most CDNs give you a propagation SLA (Cloudflare is typically <1s globally; Fastly, AWS CloudFront, and Akamai vary).

**Purge targeting options** differ by provider but generally fall into three tiers:
- **URL-based**: purge exact paths (`/assets/logo.png`) — precise but tedious at scale
- **Tag/surrogate key-based**: tag cached objects with logical groups (`product-123`, `user-feed`) and purge the entire group with one API call — this is the power move
- **Wildcard/prefix**: purge everything under `/api/v1/` — useful but expensive; some CDNs charge per-request or rate-limit aggressively

### Mental Model

Think of it as a distributed `cache.delete()` call that has to replicate across hundreds of datacenters, each running their own cache store. The CDN control plane broadcasts the invalidation; each edge node applies it asynchronously.

### Practical Scenarios

**Backend**: You cached API responses with a 1-hour TTL. A data bug made it into production and got cached. You fix the bug and deploy, but users keep hitting the cached bad response. A targeted purge (by URL or surrogate key) clears the bad data immediately rather than waiting out the TTL.

**SRE**: You're on call at 2am. A marketing image got cached with the wrong pricing. Emergency purge via API (scripted, not manual UI clicking) is the difference between a 2-minute fix and a 1-hour TTL wait that makes it onto a status page.

**DevOps**: Your CI/CD pipeline deploys versioned JS bundles (`main.abc123.js`) but your HTML files reference them by hash. Post-deploy, you run a purge against all `*.html` paths so edge nodes immediately serve the new HTML pointing to the new bundle. Without the purge, users get new JS but cached HTML pointing at the old bundle — broken app.

### Watch Out For

Cache tag purging requires you to instrument your origin responses with `Surrogate-Key` or `Cache-Tag` headers at deploy time. It's powerful but opt-in — if you haven't tagged objects, you're stuck with URL-by-URL purging at scale.
