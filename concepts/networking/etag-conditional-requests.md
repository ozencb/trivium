---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

ETags and conditional requests solve the "I have a cached copy, but is it still valid?" problem without the cost of re-downloading the full response. They let the server answer "nope, still fresh" with a 304 and zero body, or "here's the new version" only when something actually changed.

## The Mechanism

The server attaches a validator to a response — either an `ETag` (an opaque string, usually a hash or version token) or a `Last-Modified` timestamp. On the next request for the same resource, the client sends that value back as a conditional header: `If-None-Match: "abc123"` or `If-Modified-Since: Tue, 13 May 2026 10:00:00 GMT`. The server compares, and if nothing changed, returns `304 Not Modified` with no body.

Two validator types exist for a reason. ETags are stronger — they catch cases where a file's content reverts to a previous state (same timestamp, different content), or where timestamps aren't reliable (e.g., deployed from a build system). Last-Modified is simpler but has 1-second granularity and can lie after deploys.

ETags come in two flavors: strong (`"abc123"`) and weak (`W/"abc123"`). Strong equality means byte-for-byte identical. Weak means semantically equivalent — useful for compressed vs. uncompressed variants of the same content.

## Concrete Mental Model

Think of it like a version token in a document store. You fetch a document and get back `ETag: "v42"`. Next time, you ask: "give me this document, but only if it's changed from v42." The server either says "still v42, nothing to send" or "it's v43 now, here you go."

## Practical Scenarios

**Backend:** For API endpoints returning expensive-to-compute resources (user dashboards, aggregated reports), generate an ETag from a hash of the underlying data or a DB row's `updated_at`. When clients poll frequently, the majority of requests become 304s — no serialization, no payload, reduced egress.

**Frontend:** Browsers handle ETags automatically for static assets, but fetch-based API calls don't. If you're polling a REST endpoint, manually send `If-None-Match` with the last ETag you received. On 304, reuse the cached response. This matters for mobile clients on metered connections.

**Fullstack:** ETags are also useful for optimistic concurrency — the `If-Match` header (not `If-None-Match`) lets you say "update this resource only if it's still version v42." If someone else changed it, you get `412 Precondition Failed` instead of silently overwriting. This is the HTTP-native version of compare-and-swap.

## Common Pitfalls

- **ETag generation across server instances:** If two servers compute ETags differently (different hash seeds, included request metadata), you'll get spurious cache misses. ETags must be deterministic and instance-agnostic.
- **Forgetting to vary ETags by content encoding:** A gzipped and uncompressed response shouldn't share an ETag unless it's marked weak.
- **Conflating with Cache-Control:** ETags handle *revalidation* — they don't control whether a browser even attempts to reuse a cached copy. `Cache-Control: max-age` does that. They work together: max-age determines when to revalidate, ETags determine the outcome.
