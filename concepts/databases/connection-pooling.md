---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Connection Pooling

Opening a database connection is expensive: TCP handshake, TLS negotiation, authentication, and session setup can cost 10–100ms. Connection pooling amortizes that cost by maintaining a fixed set of live connections that requests borrow and return rather than open and close.

### How it actually works

The pool initializes N connections at startup. When your code requests a connection, the pool hands one over from the available set. When you're done, it goes back into the pool — the socket stays open. If all connections are checked out, new requests queue up to a configurable timeout before failing. The pool also runs background health checks, enforces idle timeouts, and rotates connections past their max lifetime (important for surviving DB failovers).

The key parameters you'll tune: `min`/`max` pool size, `max_lifetime` (prevents stale connections), `idle_timeout`, and `checkout_timeout` (how long to wait before giving up).

Mental model: a car rental fleet. You don't manufacture a new car per customer — you maintain a fixed fleet, hand out keys, and take them back. The fleet manager periodically retires old cars.

### Backend

In a Node.js/PostgreSQL service, `pg-pool` with `max: 20` means 200 concurrent requests compete for 20 slots rather than each spawning a raw connection. Without pooling, you'd hit PostgreSQL's `max_connections` (default: 100) fast — and PostgreSQL forks a process per connection, so this isn't just a soft limit.

### Fullstack

Next.js server actions are stateless — each invocation is ephemeral. If you instantiate a new Prisma/Drizzle client per request, you're opening a new connection every time. The fix is a module-level singleton pool. In serverless environments (Lambda, Vercel), it's worse: you potentially have thousands of short-lived instances each holding connections. That's where an external pooler like **PgBouncer in transaction mode** becomes necessary — it sits between your app and DB, multiplexing thousands of app-side connections onto tens of real DB connections.

### Common pitfalls

- **Connection leaks**: forgetting to release connections (always use `try/finally` or a scoped helper). A leaked pool silently starves all other requests.
- **Pool too large**: you can exhaust the DB's own connection limit; PostgreSQL degrades badly above a few hundred connections.
- **Not setting `max_lifetime`**: connections survive DB restarts or failovers in a broken state, causing cryptic errors on the next borrower.
- **Transaction mode vs. session mode** in PgBouncer: transaction mode doesn't support session-level features (prepared statements, advisory locks) — know which you're using.
