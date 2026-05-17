---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## API Versioning

Once a public API has consumers, any breaking change — removing a field, changing a response shape, tightening validation — can silently break clients you don't control. API versioning is how you ship those changes anyway, by giving clients a stable contract to pin against while you evolve forward.

**The core tension** isn't technical, it's operational: every version you keep alive is code you maintain, test, and debug in production. The goal isn't to version everything — it's to delay incompatibility as long as possible through additive changes, and version only when you genuinely can't avoid a break.

**The main strategies:**

*URI versioning* (`/v1/users`, `/v2/users`) is the most common and the most visible. Easy to route, easy to cache, easy to test. The downside: it implies the whole resource is versioned, even if only one field changed.

*Header versioning* (`Accept: application/vnd.yourapi.v2+json` or a custom `API-Version: 2024-01`) keeps URLs clean and maps well to REST's content negotiation model. Stripe uses date-based header versioning — your account is pinned to the version active when you signed up, and you opt into newer behavior explicitly. This is elegant but harder to test in a browser and invisible to caches by default.

*Query param versioning* (`/users?version=2`) is the least principled — it makes version a filter on a resource rather than a statement about the contract — but it's pragmatic for internal or low-stakes APIs.

**The additive change principle** is what separates experienced API designers: before reaching for versioning, ask whether the change is actually breaking. Adding a new optional field, adding a new endpoint, or relaxing a constraint are all non-breaking. If you can make the change additive, you skip versioning entirely.

**Backend:** When you do version, keep the version boundary at the routing/controller layer and share as much underlying service logic as possible. The failure mode is two parallel implementations that diverge silently — V1 gets a security fix, V2 doesn't. Version at the edge, not the domain.

**Fullstack:** On the client side, the discipline is never assuming a field exists without handling its absence — even within a single version, server-side deploys can race mobile app updates. That habit makes version migrations cheaper because your clients are already defensive.

**The interview signal:** Most candidates describe versioning as "just put /v2 in the URL." The real conversation is about deprecation timelines, sunset headers (`Sunset: Sat, 01 Jan 2028 00:00:00 GMT`), version discovery, and how you migrate clients off old versions before decommissioning. Having opinions about *when to version* and *how to kill old versions* is what reads as senior.
