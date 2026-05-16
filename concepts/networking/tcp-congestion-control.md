---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

TCP Congestion Control is the mechanism by which a TCP sender self-regulates how much data it pushes into the network — not to protect the receiver (that's flow control), but to avoid collapsing shared network infrastructure when buffers overflow.

## The Core Mechanism

The sender maintains a **congestion window** (`cwnd`) — a cap on how many unacknowledged bytes can be in flight at once. The actual send rate is `min(cwnd, receiver_window) / RTT`. The sender never explicitly learns about network capacity; it *infers* congestion from packet loss and ACK timing, then adjusts `cwnd` accordingly.

The algorithm has two phases:

**Slow Start** — on connection open (or after timeout), `cwnd` starts at ~10 segments and *doubles* every RTT as ACKs arrive. This sounds aggressive but the "slow" refers to starting from 1 in the original spec. Exponential growth continues until `cwnd` hits `ssthresh` (slow-start threshold).

**Congestion Avoidance** — above `ssthresh`, growth becomes linear: +1 MSS per RTT. When loss is detected (either a timeout or three duplicate ACKs), the sender treats it as a signal that it's overrun a bottleneck. On timeout: `ssthresh = cwnd/2`, `cwnd = 1` — brutal restart. On triple-dup-ACK (Fast Recovery): `ssthresh = cwnd/2`, `cwnd = ssthresh` — less catastrophic because some packets are still getting through.

This **AIMD** pattern (Additive Increase, Multiplicative Decrease) is what makes TCP behave fairly across multiple flows sharing a link.

## Mental Model

Think of it as a driver merging onto a highway in fog. You can't see how congested it is, so you accelerate until you nearly rear-end someone (packet drop), then back off hard, then cautiously speed up again. The whole network converges on fair-ish sharing through everyone doing this simultaneously.

Modern Linux uses **CUBIC** by default, which recovers more aggressively after loss based on time elapsed rather than pure ACK counting. Google's **BBR** takes a different approach entirely — it models bandwidth and RTT directly rather than inferring congestion from loss, which matters a lot on high-bandwidth, lossy links (e.g., cross-continental fiber or cellular).

## Practical Relevance

**Backend**: If your service calls a slow upstream over TCP (database, external API), and that connection's `cwnd` is still in slow start (new connection per request, or connection reset), you're artificially throttled even when bandwidth is available. Connection pooling and keep-alives matter here — they let `cwnd` grow and stabilize.

**SRE**: Sudden latency spikes that correlate with high retransmit rates (`netstat -s`, or `ss -ti`) often point to congestion on a path, not server-side slowness. A node showing high `TCPLostRetransmit` or `TCPSackFailures` is fighting congestion somewhere in the network path. Also: tuning `tcp_congestion_control`, `initcwnd`, and buffer sizes (`rmem`/`wmem`) can meaningfully affect throughput for latency-sensitive or bulk-transfer workloads.

This is the foundation for why HTTP/2 multiplexing interacts awkwardly with TCP — all streams share one `cwnd`, so a single loss event stalls everything.
