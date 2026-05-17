---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Read-Your-Writes Consistency

After you write data, you always see that write reflected in your own subsequent reads — even in a replicated system where other clients might still see stale data. This matters because the alternative is deeply disorienting: you submit a form, the page reloads, and your change has vanished.

### The Core Mechanism

You already know replication lag exists. Read-your-writes (RYW) is a targeted fix for *one specific case*: your own writes. The system doesn't promise anything to other clients — it only promises you won't be surprised by your own history.

Two implementation patterns:

**Sticky primary reads** — After any write, route that client's reads back to the primary for some window (or indefinitely). Simple, but it undermines your read-scaling strategy and can become a bottleneck under write-heavy workloads.

**Replication watermark** — More sophisticated. When a write completes, the primary returns a token (usually a log sequence number or timestamp). The client stores this. On subsequent reads, it passes the token along; the system only serves the read from a replica that has caught up to at least that point. If no replica qualifies, it either waits or falls back to the primary. This preserves read scaling — you're just being selective about *which* replica serves you.

### Mental Model

Think of it like a ticket-based system: you write, you get a stub with a sequence number. You hand that stub to the read path, which checks "has any replica consumed through this sequence number yet?" If yes, serve from there. If no, find one that has.

### Where This Bites You

**Backend:** The classic failure mode is post-write redirects. A user updates their settings via a POST, you redirect them to a GET, but the GET hits a replica that hasn't applied the write yet. The user sees the old state. Session-bound sticky reads or passing the write token through the redirect URL both fix this.

**Fullstack:** Auth state is a minefield here. After a user changes their password or upgrades their subscription tier, they immediately hit an API endpoint — and a lagging replica still thinks they're on the old plan. The write and the read go to different nodes, and the authorization check fails or returns stale entitlements. RYW with a per-session watermark prevents this, but you have to thread the token through your session layer.

**When to reach for it:** Any time users interact with their own data and immediately read it back — profile updates, settings, content creation, cart modifications. If users interact with other people's data (viewing a social feed), eventual consistency is usually fine and RYW adds unnecessary complexity.

The hard part isn't the concept — it's plumbing the watermark token across service boundaries, through load balancers, and into your read layer without losing it.
