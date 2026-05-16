---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

TCP Keepalive is a mechanism that periodically probes an idle TCP connection to verify the remote peer is still reachable. Without it, a connection can appear valid on your side while the peer has crashed, rebooted, or been silently dropped by a NAT device — and you won't discover the truth until you actually try to use it.

## How it works

Keepalive is implemented at the OS level (not in the TCP spec itself). When enabled on a socket, the kernel tracks idle time. Once a connection sits idle for `tcp_keepalive_time` seconds, the OS starts sending empty ACK probe packets at `tcp_keepalive_intvl` intervals. If `tcp_keepalive_probes` probes go unanswered, the OS closes the connection and surfaces an error to your application.

Linux defaults: `tcp_keepalive_time=7200s`, `tcp_keepalive_intvl=75s`, `tcp_keepalive_probes=9`. That means you'd wait **over 2 hours** before detecting a dead connection. This is almost always wrong for production.

These are configurable per-socket (via `setsockopt`) or system-wide via `/proc/sys/net/ipv4/`.

## Mental model

Two sides of a phone call that's gone silent. After N seconds of silence, one side says "hello?" — if no response after a few tries, they hang up. Without this, the line stays "open" indefinitely even if the other person left hours ago.

## Practical scenarios

**Backend:** Connection pools are the main battleground. A pool keeps connections alive across requests, but a connection idle for 30 minutes might look healthy to your pool while the database or a firewall has long forgotten about it. First use of that connection either hangs or errors. Setting aggressive keepalive values (e.g., 30-60s idle before probing) lets the pool detect stale connections proactively rather than surfacing errors to callers. Most DB clients expose this: `keepAlive: true` in node-postgres, `tcp_keepalives_idle` in libpq, `socketKeepAlive` in JDBC.

**SRE:** NAT gateways and stateful firewalls maintain connection tables with their own timeouts — AWS NAT Gateway drops idle TCP connections after ~350s, GCP after ~600s. If your application's keepalive interval exceeds the NAT timeout, the NAT drops the mapping silently. Your app still thinks the socket is open; the next packet hits a dead route. This is the canonical cause of "first request after a quiet period fails." The fix is setting keepalive to probe well inside the NAT timeout. Also relevant for long-lived gRPC streams or WebSocket connections through load balancers.

## Important distinction

TCP keepalive is separate from application-layer heartbeats (HTTP keep-alive headers, WebSocket pings, gRPC PING frames). They address similar failure modes but operate independently — a TCP keepalive probe can keep the socket alive even if the application layer is silent, and vice versa.

The core takeaway: OS defaults are designed for telephone-era reliability assumptions, not cloud infrastructure with aggressive NAT timeouts. Tune `tcp_keepalive_time` to something under your environment's NAT idle timeout, or you'll hit half-open connection bugs under low-traffic conditions.
