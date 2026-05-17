---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## TCP Congestion Control

TCP has no out-of-band channel to ask the network "how congested are you?" — so it infers congestion from packet loss and uses that signal to regulate how fast it sends. Without this, senders would blast data until routers dropped everything, causing *congestion collapse* (a real event that nearly brought down the early internet in 1986).

**The core mechanism: AIMD**

The invariant is *Additive Increase, Multiplicative Decrease* (AIMD). TCP maintains a **congestion window** (`cwnd`) — a cap on how many bytes can be in-flight before waiting for an ACK. Each round-trip without loss, `cwnd` grows by one segment (additive increase). When loss is detected, `cwnd` is cut in half (multiplicative decrease). This asymmetry is intentional: probing for capacity gently, retreating aggressively.

On top of AIMD, there's **slow start**: a new connection doesn't start at a modest `cwnd`, it starts at ~10 segments and *doubles* each RTT until it hits a threshold (`ssthresh`) or sees loss. "Slow" is relative to the old 1-segment start, not to what it actually does. After the first loss event sets `ssthresh`, the connection enters congestion avoidance (the linear growth phase).

**Mental model: the sawtooth**

Plot `cwnd` over time and you get a sawtooth wave — steady growth, sharp drop on loss, repeat. The sender is continuously probing the network's capacity and retreating when it overshoots. This is what makes TCP "fair" across flows: all TCP connections on a bottleneck link converge toward equal bandwidth share, because they all respond to the same loss signals.

**Practical implications**

*Backend:* Long-lived connections (DB connections, gRPC streams) benefit from warm `cwnd`. A connection pool that reuses connections avoids slow start on every request. For short-lived HTTP/1.1 connections (or anything over a cold socket), the first few RTTs are artificially throttled — this is one reason HTTP/2 multiplexing matters, and why TCP Fast Open was invented.

*SRE:* When you see retransmission spikes in your metrics, that's `cwnd` getting hammered — often a sign of buffer bloat or a flapping link, not application-layer timeouts you can simply increase your way out of. Kernel tuning (`tcp_init_cwnd`, `tcp_slow_start_after_idle`) and BBR (a newer congestion control algorithm that estimates bandwidth directly rather than inferring from loss) are levers worth knowing. BBR is particularly useful for high-latency or lossy links where CUBIC's loss-based heuristics underperform.

The deeper invariant: TCP congestion control is a distributed algorithm running across millions of endpoints with no coordinator, converging on fair bandwidth allocation through a shared signal (packet loss). HTTP/2 flow control operates at the application layer but was designed with similar logic — understanding AIMD makes its window management immediately intuitive.
