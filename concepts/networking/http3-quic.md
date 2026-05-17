---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## HTTP/3 and QUIC

HTTP/3 replaces TCP with QUIC—a transport protocol built on UDP that bakes TLS into the handshake and handles multiplexing natively. The motivation is simple: HTTP/2 solved head-of-line blocking at the *application* layer, but TCP's byte-stream model means a single lost packet still stalls every concurrent stream while retransmission happens.

**The core mechanism**

QUIC treats each stream as independently ordered. Stream 3 losing a packet doesn't stall stream 7—the transport layer knows they're separate. This is the fix HTTP/2 couldn't make: multiplexing in HTTP/2 runs over a single TCP connection, so packet loss at the TCP layer serializes delivery of all streams on top of it.

Connection establishment is also restructured. First connection: 1-RTT (TLS 1.3 handshake is embedded, not sequential). Reconnecting to a known server: 0-RTT—QUIC can resume with cached session state and send application data in the first packet. Compare this to HTTP/2's TCP handshake + TLS handshake = 2 RTTs minimum before a byte of HTTP is exchanged.

QUIC also solves connection migration. A TCP connection is identified by 4-tuple (src IP, src port, dst IP, dst port). Switch from WiFi to LTE and the connection breaks. QUIC uses a connection ID, so the transport survives IP address changes—relevant for mobile clients.

**Mental model**

Think of TCP as a shared single-lane pipe: if anything blocks it, everything waits. QUIC is more like a highway with independent lanes per stream—one lane blocked doesn't affect others, and the highway itself can tolerate your on-ramp changing.

**Practical implications**

*Backend:* If you're terminating TLS at a load balancer (nginx, Envoy, HAProxy), QUIC/HTTP/3 support requires UDP to be handled there too—most proxies now support it, but firewall rules often block non-80/443 UDP by default. Check your ACLs before wondering why HTTP/3 isn't negotiating.

*Frontend:* Browser support is universal (Chrome, Firefox, Safari). The negotiation happens via the `Alt-Svc` header or HTTPS DNS records—clients fall back to HTTP/2 automatically if QUIC is blocked. You don't force HTTP/3; you advertise it and let the client upgrade.

*SRE:* Observability gets harder. UDP doesn't fit the TCP connection state mental model your tooling was built around. `netstat` and `ss` won't show QUIC streams the same way. Loss detection and congestion control are implemented in userspace (inside QUIC), so kernel-level TCP metrics don't apply. Budget time to adapt your latency and retransmission dashboards—the signal is still there, just surfaced differently.

**When to reach for it**

If you're serving clients on lossy or high-latency networks (mobile, satellite, anything with >1% packet loss), the head-of-line blocking fix is measurable. For low-latency server-to-server traffic on reliable datacenter networks, the gains are smaller and the operational complexity may not be worth it.
