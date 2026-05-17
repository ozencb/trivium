---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

TCP keepalive solves a subtle but painful problem: an idle TCP connection can become a zombie — the local process thinks it's connected, but the remote host has crashed, the NAT entry has expired, or a stateful firewall has silently dropped the session. Without keepalive, you won't discover this until you try to write and wait for a timeout that might take minutes.

**The mechanism**

When a connection sits idle past `tcp_keepalive_time` (default: 2 hours on Linux), the kernel starts sending empty ACK probes. If the remote responds, the idle timer resets. If probes go unanswered `tcp_keepalive_probes` times (default: 9), spaced `tcp_keepalive_intvl` apart (default: 75s), the kernel tears down the connection and returns an error to the application. The critical detail: this happens entirely in the kernel — your application is unblocked from a hung `read()` or eventually gets an error, rather than waiting forever.

**Mental model**

Think of it like a landlord doing periodic welfare checks on tenants. If a tenant stops responding after several knocks, the landlord doesn't keep the unit reserved — they mark it available. Keepalive does the same for socket file descriptors and connection pool slots.

**Backend implications**

Database and HTTP connection pools rely heavily on this. Without keepalive (or a short enough timeout), a pool can fill with connections that *look* healthy but are actually broken — typically because a firewall between your app server and DB silently expired its NAT state after 5-30 minutes of inactivity. The next query on that connection blocks until TCP's own retransmit timeout (~15 min by default), destroying latency. Most database drivers let you set `keepalive=true` and configure the intervals at the socket level — this should be on by default in any production pool config.

**SRE implications**

Long-lived gRPC streams, persistent WebSocket connections, and database streaming replicas all hit keepalive issues at scale. If you're seeing connections drop during low-traffic windows (overnight, weekends) but not during peak hours, firewall or NAT state expiry is usually the culprit — the idle connections get reaped because traffic stops flowing. The fix is setting keepalive intervals *below* your network's NAT/firewall timeout, which you often have to discover empirically. AWS NAT Gateway, for instance, drops idle connections after 350 seconds.

One gotcha: application-level heartbeats (like gRPC's PING frames or MQTT keepalive) and TCP keepalive are separate mechanisms. TCP keepalive detects broken paths; application heartbeats can also detect unresponsive *peers* that are still reachable. For robust production systems, you often need both.
