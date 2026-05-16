---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Session Management

HTTP is stateless — each request arrives with no memory of previous ones, so without session management, every request would require re-authentication. Sessions solve this by establishing a persistent identity token that travels with requests and maps back to server-side state.

### The Core Mechanism

After a user authenticates, the server creates a **session record** (typically stored in memory, Redis, or a database) containing identity and metadata — user ID, roles, expiry, maybe device info. It issues the client an opaque **session ID**, usually a cryptographically random string. The client stores this (cookie, header) and sends it on subsequent requests. The server looks it up, finds the associated state, and knows who's asking.

This is fundamentally a lookup table: session ID → user context. The ID itself means nothing without the server-side record it points to.

Contrast this with JWTs, where the token *is* the state — the server validates a signature rather than doing a lookup. Sessions trade network/storage overhead for **revocability**: you can invalidate a session immediately by deleting the record. With a JWT, you can't un-issue a token without a blocklist, which reintroduces lookup overhead anyway.

### Concrete Mental Model

Think of a coat check. You hand over your coat (credentials), get a numbered ticket (session ID), and use that ticket for the rest of the night. The ticket is worthless to someone else without your coat, and the venue can revoke it at any time by removing the coat from inventory. The ticket doesn't describe your coat — it just points to it.

### Practical Scenarios

**Backend:** Session stores need to be shared across instances. If you're running 3 API servers and sessions live in local memory, a user hitting server 2 won't find their session from server 1. This is why Redis is the standard — a centralized, fast session store that all instances can reach. Session expiry, sliding windows (reset TTL on each request), and absolute timeouts are all implemented at this layer.

**Fullstack:** The frontend usually stores the session ID in an `HttpOnly` cookie (inaccessible to JS, which mitigates XSS) with `Secure` and `SameSite=Strict` flags. On logout, the correct behavior is to delete the server-side record *and* clear the cookie — deleting only the cookie leaves the session valid for anyone who captured it. Next.js apps often use libraries like `iron-session` or `lucia` that abstract this, but they're all doing the same lookup under the hood.

**Key failure modes to know:** session fixation (attacker sets a session ID before login — mitigated by regenerating the ID post-authentication), session hijacking (stealing a valid ID via network sniffing or XSS), and improper expiry (sessions that never time out).
