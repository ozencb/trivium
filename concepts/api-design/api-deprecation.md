---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## API Deprecation

API deprecation is the formal process of retiring an API version or endpoint in a way that doesn't immediately break consumers. You need it because APIs have clients you don't control — third-party integrators, mobile apps that haven't updated, internal teams on different release cadences — so "just remove it" is rarely an option.

### The core mechanism

Deprecation isn't a single event; it's a **runway**. The real engineering work is signaling intent, giving consumers time to migrate, and then actually removing it. The three levers:

**Sunset headers** (RFC 8594) — HTTP response headers that announce a specific removal date. When you add `Sunset: Sat, 01 Nov 2026 00:00:00 GMT` to your responses, well-behaved API clients can detect it programmatically and alert their operators.

**Removal timelines** — typically 6–18 months for public APIs, 3–6 months for internal ones. The timeline has to be long enough for slow-moving consumers (enterprises, mobile app release cycles) but short enough that you're not maintaining deprecated code indefinitely.

**Migration guides** — not just changelog entries. These need to describe what broke, what replaced it, and *why*, otherwise consumers will cargo-cult the old behavior into the new endpoint.

### Concrete example

Say you're migrating `/v1/users` (returns `name` as a string) to `/v2/users` (splits it into `first_name`/`last_name`). You:

1. Deploy v2, keep v1 running
2. Add `Sunset` and `Deprecation` headers to all v1 responses pointing to the v2 migration doc
3. Log v1 traffic by caller — this is how you find who's still using it when your deadline approaches
4. Reach out directly to high-volume v1 consumers before killing it
5. Return 410 Gone after the sunset date (not 404 — the distinction matters semantically)

### Where this actually bites you

**Backend:** The trap is removing the endpoint before updating all internal consumers. It's embarrassingly common to deprecate a public endpoint, announce it widely, then miss an internal service that was calling it. Audit your own traffic first.

**Fullstack:** Frontend teams often get blindsided by deprecation timelines set by backend teams. If you own both, make deprecation headers visible in your dev tooling — a console warning when `Sunset` is within 90 days prevents scrambles later. For mobile clients specifically, always give at least one full major release cycle before removal.

### What separates senior engineers here

Junior engineers think of deprecation as "add a warning, remove in 3 months." Senior engineers understand that the removal date is a *negotiation*, not a unilateral decision — you need traffic data to identify stragglers, communication plans for high-value consumers, and fallback behavior (like returning transformed data from v2 behind the v1 interface) for when strict removal isn't politically feasible. The technical work is easy; the coordination work is where deprecations succeed or fail.
